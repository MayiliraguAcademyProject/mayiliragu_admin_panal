import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Sparkles,
  BookOpen,
  Ticket,
  ClipboardList,
  User,
  Phone,
  MapPin,
  X
} from 'lucide-react';
import {
  useStudyCategoriesList,
  useAdminBooksList,
  useCreateBook,
  useUpdateBook,
  useDeleteBook,
  useCouponsList,
  useCreateCoupon,
  useAdminOrdersList,
  useUpdateOrderStatus,
  useUpdateOrderPaymentStatus,
  usePaymentQr,
  useUpdatePaymentQr
} from '../../../core/api/endpoints';
import type { Book } from '../../../core/types';
import { ApiConstants } from '../../../core/constants/api_constants';

// Validation Schemas
const bookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  author: z.string().min(1, 'Author is required'),
  publisher: z.string().optional(),
  priceHardCopy: z.coerce.number().min(0).optional(),
  priceSoftCopy: z.coerce.number().min(0).optional(),
  stockHardCopy: z.coerce.number().min(0).default(0),
  categoryId: z.string().min(1, 'Category is required'),
  isActive: z.boolean().default(true),
});

const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').toUpperCase(),
  discountType: z.enum(['PERCENTAGE', 'FLAT']),
  discountValue: z.coerce.number().min(0.1, 'Value must be greater than 0'),
  minPurchaseAmount: z.coerce.number().min(0).default(0),
  maxDiscountAmount: z.coerce.number().min(0).optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean().default(true),
  usageLimit: z.coerce.number().min(1).optional(),
});

export default function BookStorePage() {
  const [activeTab, setActiveTab] = useState<'books' | 'coupons' | 'orders' | 'settings'>('books');

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedQrFile, setSelectedQrFile] = useState<File | null>(null);
  const [activeScreenshotUrl, setActiveScreenshotUrl] = useState<string | null>(null);

  // API hooks
  const { data: categoriesData } = useStudyCategoriesList();
  const categories = categoriesData?.data || [];

  const { data: booksData, isLoading: isBooksLoading } = useAdminBooksList();
  const books = booksData?.data || [];

  const createBookMutation = useCreateBook();
  const updateBookMutation = useUpdateBook();
  const deleteBookMutation = useDeleteBook();

  const { data: couponsData, isLoading: isCouponsLoading } = useCouponsList();
  const coupons = couponsData?.data || [];
  const createCouponMutation = useCreateCoupon();

  const { data: ordersData, isLoading: isOrdersLoading } = useAdminOrdersList();
  const orders = ordersData?.data || [];

  const { data: qrData, isLoading: isQrLoading } = usePaymentQr();
  const updateQrMutation = useUpdatePaymentQr();

  const updateOrderStatusMutation = useUpdateOrderStatus();
  const updateOrderPaymentMutation = useUpdateOrderPaymentStatus();

  // Forms
  const bookForm = useForm<any>({
    resolver: zodResolver(bookSchema) as any,
    defaultValues: { title: '', description: '', author: '', publisher: '', stockHardCopy: 0, categoryId: '', isActive: true },
  });

  const couponForm = useForm<any>({
    resolver: zodResolver(couponSchema) as any,
    defaultValues: { code: '', discountType: 'PERCENTAGE', discountValue: 0, minPurchaseAmount: 0, isActive: true },
  });

  // Book Handlers
  const handleOpenAddBook = () => {
    bookForm.reset({
      title: '',
      description: '',
      author: '',
      publisher: '',
      priceHardCopy: undefined,
      priceSoftCopy: undefined,
      stockHardCopy: 0,
      categoryId: '',
      isActive: true,
    });
    setEditingBook(null);
    setThumbnailFile(null);
    setPdfFile(null);
    setIsBookModalOpen(true);
  };

  const handleOpenEditBook = (book: Book) => {
    bookForm.reset({
      title: book.title,
      description: book.description || '',
      author: book.author || '',
      publisher: book.publisher || '',
      priceHardCopy: book.priceHardCopy ?? undefined,
      priceSoftCopy: book.priceSoftCopy ?? undefined,
      stockHardCopy: book.stockHardCopy,
      categoryId: book.categoryId,
      isActive: book.isActive,
    });
    setEditingBook(book);
    setThumbnailFile(null);
    setPdfFile(null);
    setIsBookModalOpen(true);
  };

  const onBookSubmit = async (values: z.infer<typeof bookSchema>) => {
    try {
      if (editingBook) {
        await updateBookMutation.mutateAsync({
          id: editingBook.id,
          ...values,
          thumbnail: thumbnailFile || undefined,
          pdf: pdfFile || undefined,
        });
      } else {
        await createBookMutation.mutateAsync({
          ...values,
          thumbnail: thumbnailFile || undefined,
          pdf: pdfFile || undefined,
        });
      }
      setIsBookModalOpen(false);
      bookForm.reset();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await deleteBookMutation.mutateAsync(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Coupon Handlers
  const onCouponSubmit = async (values: z.infer<typeof couponSchema>) => {
    try {
      await createCouponMutation.mutateAsync({
        ...values,
        startDate: new Date(values.startDate).toISOString(),
        endDate: new Date(values.endDate).toISOString(),
      });
      setIsCouponModalOpen(false);
      couponForm.reset();
    } catch (err) {
      console.error(err);
    }
  };

  // Order Handlers
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatusMutation.mutateAsync({ id: orderId, orderStatus: status });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderPaymentMutation.mutateAsync({ id: orderId, paymentStatus: status });
    } catch (err) {
      console.error(err);
    }
  };

  const handleQrUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQrFile) return;
    try {
      await updateQrMutation.mutateAsync(selectedQrFile);
      setSelectedQrFile(null);
      alert('Payment QR Code updated successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to update QR Code');
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-fade-in text-text-primary">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" /> Book Store Control Center
        </h1>
        <p className="text-xs text-text-secondary mt-1 font-semibold">
          Manage hard/soft copy study book listings, set price structures, customize checkout coupons, and process incoming COD orders.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/80 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('books')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-xs transition-all ${activeTab === 'books'
            ? 'border-accent text-accent'
            : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Books Listing ({books.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-xs transition-all ${activeTab === 'coupons'
            ? 'border-accent text-accent'
            : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Discount Coupons ({coupons.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-xs transition-all ${activeTab === 'orders'
            ? 'border-accent text-accent'
            : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Orders Management ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-xs transition-all ${activeTab === 'settings'
            ? 'border-accent text-accent'
            : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>QR Settings</span>
        </button>
      </div>

      {/* TAB CONTENT: BOOKS */}
      {activeTab === 'books' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-text-secondary">Study Books Inventory</h2>
            <button
              onClick={handleOpenAddBook}
              className="flex items-center space-x-2 px-4 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-lg shadow-accent/20 transition-all duration-200"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Book</span>
            </button>
          </div>

          {isBooksLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-white/40">
              <p className="text-xs text-text-secondary font-semibold">No books uploaded to the store yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-cardBg border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="flex gap-4">
                    <img
                      src={book.thumbnailUrl ? (book.thumbnailUrl.startsWith('http') ? book.thumbnailUrl : ApiConstants.getAssetUrl(book.thumbnailUrl)) : '/placeholder-book.png'}
                      alt={book.title}
                      className="w-16 h-20 object-cover rounded-lg bg-slate-100 flex-shrink-0"
                    />
                    <div>
                      <span className="px-2 py-0.5 bg-accent/10 text-accent text-[9px] font-bold rounded-md uppercase">
                        {book.category?.name || 'General'}
                      </span>
                      <h3 className="font-extrabold text-sm text-text-primary mt-1 line-clamp-1">{book.title}</h3>
                      <p className="text-[11px] text-text-secondary font-bold">Author: {book.author || 'Unknown'}</p>

                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Hard Copy:</span>
                          <span className="font-extrabold text-slate-800">
                            {book.priceHardCopy ? `₹${book.priceHardCopy}` : 'N/A'} (Stock: {book.stockHardCopy})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Soft Copy:</span>
                          <span className="font-extrabold text-slate-800">
                            {book.priceSoftCopy ? `₹${book.priceSoftCopy}` : 'N/A'} {book.pdfUrl ? '✓ PDF' : '✖ File'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-md ${book.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-650'}`}>
                      {book.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenEditBook(book)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-text-primary rounded-xl transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book.id)}
                        className="p-2 bg-slate-100 hover:bg-red-50 text-red-650 rounded-xl transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-text-secondary">Checkout Discount Coupons</h2>
            <button
              onClick={() => {
                couponForm.reset();
                setIsCouponModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-lg shadow-accent/20 transition-all duration-200"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Coupon</span>
            </button>
          </div>

          {isCouponsLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-white/40">
              <p className="text-xs text-text-secondary font-semibold">No coupons created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="bg-cardBg border border-border/80 rounded-2xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-accent/15 text-accent text-xs font-black rounded-lg border border-accent/20 tracking-wider">
                      {coupon.code}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-md ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Discount:</span>
                      <span className="font-extrabold text-slate-800">
                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Min Purchase:</span>
                      <span className="font-bold">₹{coupon.minPurchaseAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Used count:</span>
                      <span className="font-bold">
                        {coupon.usageCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : '(No limit)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Validity:</span>
                      <span className="font-semibold text-[10px]">
                        {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-text-secondary">COD Order Processing</h2>

          {isOrdersLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-white/40">
              <p className="text-xs text-text-secondary font-semibold">No orders placed yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-cardBg border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-6 justify-between"
                >
                  {/* Order Overview & Items */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold text-text-secondary">
                        Order Date: {new Date(order.orderDate).toLocaleString()}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold rounded text-text-secondary">
                        ID: {order.id.slice(0, 8)}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-black rounded uppercase">
                        {order.paymentMethod}
                      </span>
                    </div>

                    <div className="border border-border/40 rounded-xl overflow-hidden max-w-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-text-secondary border-b border-border/40">
                          <tr>
                            <th className="p-3">Book Title</th>
                            <th className="p-3">Format</th>
                            <th className="p-3">Price</th>
                            <th className="p-3 text-center">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items?.map((item) => (
                            <tr key={item.id} className="border-b border-border/20 last:border-0">
                              <td className="p-3 font-semibold">{item.book?.title || 'Unknown Book'}</td>
                              <td className="p-3 font-medium uppercase text-[10px] text-text-secondary">{item.format.replace('_', ' ')}</td>
                              <td className="p-3 font-bold">₹{item.price}</td>
                              <td className="p-3 text-center font-bold">{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Address details */}
                    {(order.shippingAddress || order.shippingName) && (
                      <div className="bg-slate-50 rounded-xl p-4 max-w-xl text-xs space-y-2 text-text-secondary border border-border/30">
                        <h4 className="font-extrabold text-text-primary flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-accent" /> Shipping Address
                        </h4>
                        <div className="space-y-1">
                          <p className="flex items-center gap-1 font-semibold text-text-primary">
                            <User className="w-3 h-3" /> {order.shippingName}
                          </p>
                          <p className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {order.shippingPhone}
                          </p>
                          <p className="pl-4 whitespace-pre-wrap">{order.shippingAddress}</p>
                        </div>
                      </div>
                    )}
                    {order.paymentScreenshotUrl && (
                      <div className="bg-slate-50 rounded-xl p-4 max-w-xl text-xs space-y-2 text-text-secondary border border-border/30 mt-3">
                        <h4 className="font-extrabold text-text-primary flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-accent" /> Payment Verification
                        </h4>
                        <div className="space-y-2">
                          <p className="font-semibold text-text-secondary">Uploaded Payment Screenshot:</p>
                          <button
                            type="button"
                            onClick={() => setActiveScreenshotUrl(order.paymentScreenshotUrl ?? null)}
                            className="inline-block border rounded-lg overflow-hidden bg-white p-1 hover:border-accent transition-all cursor-zoom-in"
                          >
                            <img
                              src={order.paymentScreenshotUrl}
                              alt="Payment Screenshot"
                              className="max-w-[120px] max-h-[120px] object-contain"
                            />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment/Pricing Summary & Status Management */}
                  <div className="w-full lg:w-80 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-border/40 pt-4 lg:pt-0 lg:pl-6 space-y-4">
                    {/* Financial Summary */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-semibold">₹{order.subTotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span className="font-semibold">₹{order.shippingCharge}</span>
                      </div>
                      <div className="flex justify-between text-green-700">
                        <span>Discount:</span>
                        <span className="font-semibold">-₹{order.discountAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm font-black border-t border-border/35 pt-1.5">
                        <span>Total Payable:</span>
                        <span className="text-accent">₹{order.payableAmount}</span>
                      </div>
                    </div>

                    {/* Action selectors */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black text-text-secondary uppercase mb-1">
                          Payment Status
                        </label>
                        <select
                          value={order.paymentStatus}
                          onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value)}
                          className={`w-full text-xs font-extrabold rounded-xl border border-border/80 p-2.5 ${order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                            }`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PAID">PAID</option>
                          <option value="REFUNDED">REFUNDED</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-text-secondary uppercase mb-1">
                          Order Status
                        </label>
                        <select
                          value={order.orderStatus}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="w-full text-xs font-extrabold rounded-xl border border-border/80 p-2.5 bg-slate-50"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-cardBg border border-border/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-text-primary">Global Payment UPI QR Code</h3>
              <p className="text-xs text-text-secondary mt-1">
                Upload the shop's UPI QR Code image. Students will see this image during checkout to make online payments.
              </p>
            </div>

            {isQrLoading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="w-6 h-6 text-accent animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-border/60 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center min-h-[220px]">
                  {qrData?.paymentQrUrl ? (
                    <div className="space-y-2 text-center">
                      <img
                        src={qrData.paymentQrUrl.startsWith('http') ? qrData.paymentQrUrl : ApiConstants.getAssetUrl(qrData.paymentQrUrl)}
                        alt="Payment QR"
                        className="max-w-[200px] max-h-[200px] object-contain border rounded-lg bg-white p-2"
                      />
                      <p className="text-[10px] text-text-secondary">Current Active QR Code</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <p className="text-xs text-text-secondary font-semibold">No payment QR Code uploaded yet.</p>
                      <p className="text-[10px] text-text-secondary">Students will see a placeholder until uploaded.</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleQrUpload} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Select QR Image File (PNG/JPG)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedQrFile(e.target.files?.[0] || null)}
                      className="w-full text-xs border border-border/80 rounded-xl p-2 bg-white outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updateQrMutation.isPending || !selectedQrFile}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-lg shadow-accent/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateQrMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Update Payment QR Code</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT BOOK */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cardBg border border-border/70 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-border/40 pb-4">
              <h3 className="text-base font-black flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" /> {editingBook ? 'Edit Book Details' : 'Add New Book'}
              </h3>
              <button onClick={() => setIsBookModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={bookForm.handleSubmit(onBookSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Book Title *</label>
                  <input
                    type="text"
                    {...bookForm.register('title')}
                    className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                    placeholder="Enter book title"
                  />
                  {bookForm.formState.errors.title && (
                    <span className="text-[10px] text-red-650">{bookForm.formState.errors.title.message?.toString()}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Author *</label>
                  <input
                    type="text"
                    {...bookForm.register('author')}
                    className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                    placeholder="Enter author name"
                  />
                  {bookForm.formState.errors.author && (
                    <span className="text-[10px] text-red-650">{bookForm.formState.errors.author.message?.toString()}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Publisher</label>
                  <input
                    type="text"
                    {...bookForm.register('publisher')}
                    className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                    placeholder="Enter publisher"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Category *</label>
                  <select
                    {...bookForm.register('categoryId')}
                    className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent outline-none bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {bookForm.formState.errors.categoryId && (
                    <span className="text-[10px] text-red-650">{bookForm.formState.errors.categoryId.message?.toString()}</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Hard Copy Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...bookForm.register('priceHardCopy')}
                    className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent outline-none"
                    placeholder="Physical book price"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Hard Copy Stock</label>
                  <input
                    type="number"
                    {...bookForm.register('stockHardCopy')}
                    className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent outline-none"
                    placeholder="Available stock"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Soft Copy Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...bookForm.register('priceSoftCopy')}
                    className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent outline-none"
                    placeholder="Digital book price"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Cover Thumbnail</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    className="w-full text-xs border border-border/80 rounded-xl p-2 bg-slate-50 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Digital PDF Document</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="w-full text-xs border border-border/80 rounded-xl p-2 bg-slate-50 outline-none"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...bookForm.register('isActive')}
                    className="w-4 h-4 rounded text-accent focus:ring-accent"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-text-secondary">
                    Publish Book Store Listing
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">Description</label>
                <textarea
                  {...bookForm.register('description')}
                  rows={3}
                  className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent outline-none"
                  placeholder="Enter book description"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 border border-border/80 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBookMutation.isPending || updateBookMutation.isPending}
                  className="px-5 py-2 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-lg shadow-accent/15 flex items-center gap-1.5"
                >
                  {(createBookMutation.isPending || updateBookMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Save Book</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE COUPON */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cardBg border border-border/70 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-border/40 pb-4">
              <h3 className="text-base font-black flex items-center gap-2">
                <Ticket className="w-5 h-5 text-accent" /> Create Discount Coupon
              </h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={couponForm.handleSubmit(onCouponSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary">Coupon Code *</label>
                <input
                  type="text"
                  {...couponForm.register('code')}
                  className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent outline-none"
                  placeholder="e.g. WELCOME10"
                />
                {couponForm.formState.errors.code && (
                  <span className="text-[10px] text-red-650">{couponForm.formState.errors.code.message?.toString()}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Discount Type</label>
                  <select
                    {...couponForm.register('discountType')}
                    className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent outline-none bg-white"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FLAT">FLAT (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Discount Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...couponForm.register('discountValue')}
                    className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent outline-none"
                    placeholder="Value"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Min Purchase (₹)</label>
                  <input
                    type="number"
                    {...couponForm.register('minPurchaseAmount')}
                    className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent outline-none"
                    placeholder="Min amount"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Max Discount Capping (₹)</label>
                  <input
                    type="number"
                    {...couponForm.register('maxDiscountAmount')}
                    className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent outline-none"
                    placeholder="Optional cap limit"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Start Date *</label>
                  <input
                    type="date"
                    {...couponForm.register('startDate')}
                    className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">End Date *</label>
                  <input
                    type="date"
                    {...couponForm.register('endDate')}
                    className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Usage Limit</label>
                  <input
                    type="number"
                    {...couponForm.register('usageLimit')}
                    className="w-full text-xs border border-border/80 rounded-xl p-3 focus:border-accent outline-none"
                    placeholder="Optional total limit"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActiveCoupon"
                    {...couponForm.register('isActive')}
                    className="w-4 h-4 rounded text-accent focus:ring-accent"
                  />
                  <label htmlFor="isActiveCoupon" className="text-xs font-bold text-text-secondary">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 border border-border/80 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCouponMutation.isPending}
                  className="px-5 py-2 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-lg shadow-accent/15 flex items-center gap-1.5"
                >
                  {createCouponMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Coupon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SCREENSHOT LIGHTBOX */}
      {activeScreenshotUrl && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setActiveScreenshotUrl(null)}
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeScreenshotUrl}
              alt="Verification Proof"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
