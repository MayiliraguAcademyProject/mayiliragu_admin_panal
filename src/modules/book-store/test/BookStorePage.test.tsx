import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/test-utils';
import BookStorePage from '../pages/BookStorePage';

const state = vi.hoisted(() => {
  const defaultCategories = [{ id: 'c1', name: 'E-Books', description: 'Digital books.' }];

  const defaultBooks = [
    {
      id: 'b1',
      title: 'Quantitative Aptitude',
      description: 'A comprehensive aptitude guide.',
      thumbnailUrl: '/books/qa.jpg',
      images: [],
      author: 'R.S. Aggarwal',
      publisher: 'S. Chand',
      priceHardCopy: 350,
      priceSoftCopy: null,
      stockHardCopy: 25,
      pdfUrl: null,
      categoryId: 'c1',
      isActive: true,
      isDeleted: false,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      category: { id: 'c1', name: 'E-Books' },
    },
    {
      id: 'b2',
      title: 'General Studies Manual',
      description: 'Dormant listing.',
      thumbnailUrl: '/books/gsm.jpg',
      images: [],
      author: 'Unknown',
      publisher: null,
      priceHardCopy: null,
      priceSoftCopy: null,
      stockHardCopy: 0,
      pdfUrl: null,
      categoryId: 'c1',
      isActive: false,
      isDeleted: false,
      createdAt: '2026-08-02T00:00:00.000Z',
      updatedAt: '2026-08-02T00:00:00.000Z',
      category: { id: 'c1', name: 'E-Books' },
    },
  ];

  const defaultCoupons = [
    {
      id: 'cp1',
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minPurchaseAmount: 500,
      maxDiscountAmount: null,
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      isActive: true,
      usageLimit: null,
      usageCount: 4,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'cp2',
      code: 'FLAT50',
      discountType: 'FLAT',
      discountValue: 50,
      minPurchaseAmount: 1000,
      maxDiscountAmount: 200,
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      isActive: false,
      usageLimit: 100,
      usageCount: 12,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
  ];

  const defaultOrders = [
    {
      id: 'ord_12345678',
      studentId: 'st_98765432',
      couponId: null,
      orderDate: '2026-08-05T10:00:00.000Z',
      subTotal: 700,
      shippingCharge: 60,
      discountAmount: 50,
      payableAmount: 710,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      shippingName: 'Karthik',
      shippingPhone: '9876543210',
      shippingAddress: 'Chennai, TN',
      paymentScreenshotUrl: null,
      createdAt: '2026-08-05T10:00:00.000Z',
      updatedAt: '2026-08-05T10:00:00.000Z',
      items: [
        {
          id: 'i1',
          orderId: 'ord_12345678',
          bookId: 'b1',
          format: 'HARD_COPY',
          price: 350,
          quantity: 2,
          book: { title: 'Quantitative Aptitude' },
        },
      ],
      coupon: null,
      student: { name: 'Karthik', email: 'karthik@test.com' },
    },
  ];

  let categoriesData: unknown = { data: defaultCategories.map((c) => ({ ...c })) };
  let booksData: unknown = { data: defaultBooks.map((b) => ({ ...b })) };
  let couponsData: unknown = { data: defaultCoupons.map((c) => ({ ...c })) };
  let ordersData: unknown = { data: defaultOrders.map((o) => ({ ...o })) };
  let qrData: unknown = null;
  let booksLoading = false;
  let couponsLoading = false;
  let ordersLoading = false;
  let qrLoading = false;

  const createBookMutation = vi.fn().mockResolvedValue({});
  const updateBookMutation = vi.fn().mockResolvedValue({});
  const deleteBookMutation = vi.fn().mockResolvedValue({});
  const createCouponMutation = vi.fn().mockResolvedValue({});
  const updateOrderStatusMutation = vi.fn().mockResolvedValue({});
  const updateOrderPaymentMutation = vi.fn().mockResolvedValue({});
  const updateQrMutation = vi.fn().mockResolvedValue({});

  function reset() {
    categoriesData = { data: defaultCategories.map((c) => ({ ...c })) };
    booksData = { data: defaultBooks.map((b) => ({ ...b })) };
    couponsData = { data: defaultCoupons.map((c) => ({ ...c })) };
    ordersData = { data: defaultOrders.map((o) => ({ ...o })) };
    qrData = null;
    booksLoading = false;
    couponsLoading = false;
    ordersLoading = false;
    qrLoading = false;
    vi.clearAllMocks();
  }

  return {
    createBookMutation,
    updateBookMutation,
    deleteBookMutation,
    createCouponMutation,
    updateOrderStatusMutation,
    updateOrderPaymentMutation,
    updateQrMutation,
    reset,
    getCategoriesData: () => categoriesData,
    getBooksData: () => booksData,
    getCouponsData: () => couponsData,
    getOrdersData: () => ordersData,
    getQrData: () => qrData,
    getBooksLoading: () => booksLoading,
    getCouponsLoading: () => couponsLoading,
    getOrdersLoading: () => ordersLoading,
    getQrLoading: () => qrLoading,
    setCategoriesData: (d: unknown) => {
      categoriesData = d;
    },
    setBooksData: (d: unknown) => {
      booksData = d;
    },
    setCouponsData: (d: unknown) => {
      couponsData = d;
    },
    setOrdersData: (d: unknown) => {
      ordersData = d;
    },
    setQrData: (d: unknown) => {
      qrData = d;
    },
    setBooksLoading: (v: boolean) => {
      booksLoading = v;
    },
    setCouponsLoading: (v: boolean) => {
      couponsLoading = v;
    },
    setOrdersLoading: (v: boolean) => {
      ordersLoading = v;
    },
    setQrLoading: (v: boolean) => {
      qrLoading = v;
    },
  };
});

vi.mock('../../../core/api/endpoints', () => ({
  useStudyCategoriesList: () => ({ data: state.getCategoriesData(), isLoading: false }),
  useAdminBooksList: () => ({ data: state.getBooksData(), isLoading: state.getBooksLoading() }),
  useCreateBook: () => ({ mutateAsync: state.createBookMutation, mutate: state.createBookMutation, isPending: false }),
  useUpdateBook: () => ({ mutateAsync: state.updateBookMutation, mutate: state.updateBookMutation, isPending: false }),
  useDeleteBook: () => ({ mutateAsync: state.deleteBookMutation, mutate: state.deleteBookMutation, isPending: false }),
  useCouponsList: () => ({ data: state.getCouponsData(), isLoading: state.getCouponsLoading() }),
  useCreateCoupon: () => ({ mutateAsync: state.createCouponMutation, mutate: state.createCouponMutation, isPending: false }),
  useAdminOrdersList: () => ({ data: state.getOrdersData(), isLoading: state.getOrdersLoading() }),
  useUpdateOrderStatus: () => ({ mutateAsync: state.updateOrderStatusMutation, mutate: state.updateOrderStatusMutation, isPending: false }),
  useUpdateOrderPaymentStatus: () => ({ mutateAsync: state.updateOrderPaymentMutation, mutate: state.updateOrderPaymentMutation, isPending: false }),
  usePaymentQr: () => ({ data: state.getQrData(), isLoading: state.getQrLoading() }),
  useUpdatePaymentQr: () => ({ mutateAsync: state.updateQrMutation, mutate: state.updateQrMutation, isPending: false }),
}));

function renderPage() {
  return renderWithProviders(<BookStorePage />);
}

describe('BookStorePage', () => {
  beforeEach(() => {
    state.reset();
  });

  it('renders the page header and all four tabs with counts', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Book Store Control Center' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Books Listing (2)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Discount Coupons (2)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Orders Management (1)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'QR Settings' })).toBeTruthy();
  });

  it('shows the empty state when there are no books', () => {
    state.setBooksData({ data: [] });
    renderPage();
    expect(screen.getByText('No books uploaded to the store yet.')).toBeTruthy();
  });

  it('renders book cards with metadata and action buttons', () => {
    const { container } = renderPage();

    expect(screen.getByText('Study Books Inventory')).toBeTruthy();
    expect(screen.getAllByText('E-Books').length).toBe(2);
    expect(screen.getByText('Quantitative Aptitude')).toBeTruthy();
    expect(screen.getByText('Author: R.S. Aggarwal')).toBeTruthy();
    expect(screen.getByText('₹350 (Stock: 25)')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('General Studies Manual')).toBeTruthy();
    expect(screen.getByText('Inactive')).toBeTruthy();

    expect(container.querySelector('.lucide-pen')).toBeTruthy();
    expect(container.querySelector('.lucide-trash-2')).toBeTruthy();
  });

  it('shows a spinner while books are loading', () => {
    state.setBooksLoading(true);
    const { container } = renderPage();
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('validates the add book form before submitting', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Add Book' }));
    expect(screen.getByRole('heading', { name: 'Add New Book' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Save Book' }));

    expect(screen.getByText('Title is required')).toBeTruthy();
    expect(screen.getByText('Author is required')).toBeTruthy();
    expect(screen.getByText('Category is required')).toBeTruthy();
    expect(state.createBookMutation).not.toHaveBeenCalled();
  });

  it('creates a book through the add book modal', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Add Book' }));

    await user.type(screen.getByPlaceholderText('Enter book title'), 'Indian Polity');
    await user.type(screen.getByPlaceholderText('Enter author name'), 'M. Laxmikanth');
    await user.selectOptions(screen.getByRole('combobox'), 'c1');
    await user.type(screen.getByPlaceholderText('Physical book price'), '450');
    await user.type(screen.getByPlaceholderText('Available stock'), '30');
    await user.type(screen.getByPlaceholderText('Enter book description'), 'Polity essentials.');

    await user.click(screen.getByRole('button', { name: 'Save Book' }));

    expect(state.createBookMutation).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Indian Polity', author: 'M. Laxmikanth', categoryId: 'c1' })
    );
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Add New Book' })).toBeNull();
    });
  });

  it('edits an existing book through the modal', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const editButton = container.querySelector('.lucide-pen')!.closest('button')!;
    await user.click(editButton);

    expect(screen.getByRole('heading', { name: 'Edit Book Details' })).toBeTruthy();
    const titleInput = screen.getByPlaceholderText('Enter book title') as HTMLInputElement;
    expect(titleInput.value).toBe('Quantitative Aptitude');

    await user.clear(titleInput);
    await user.type(titleInput, 'Quantitative Aptitude (Revised)');
    await user.click(screen.getByRole('button', { name: 'Save Book' }));

    expect(state.updateBookMutation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'b1', title: 'Quantitative Aptitude (Revised)' })
    );
  });

  it('deletes a book after confirmation', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    const deleteButton = container.querySelector('.lucide-trash-2')!.closest('button')!;
    await user.click(deleteButton);

    const modalDeleteBtn = screen.getByRole('button', { name: 'Delete' });
    await user.click(modalDeleteBtn);
    expect(state.deleteBookMutation).toHaveBeenCalledWith('b1');
  });

  it('shows the empty state when there are no coupons', async () => {
    state.setCouponsData({ data: [] });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Discount Coupons (0)' }));

    expect(screen.getByText('No coupons created yet.')).toBeTruthy();
  });

  it('renders coupon cards with discount details', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Discount Coupons (2)' }));

    expect(screen.getByText('Checkout Discount Coupons')).toBeTruthy();
    expect(screen.getByText('WELCOME10')).toBeTruthy();
    expect(screen.getByText('10%')).toBeTruthy();
    expect(screen.getByText('₹500')).toBeTruthy();
    expect(screen.getByText('4 (No limit)')).toBeTruthy();
    expect(screen.getByText('FLAT50')).toBeTruthy();
    expect(screen.getByText('₹50')).toBeTruthy();
    expect(screen.getByText('12 / 100')).toBeTruthy();
  });

  it('validates the coupon form before submitting', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Discount Coupons (2)' }));
    await user.click(screen.getByRole('button', { name: 'Create Coupon' }));
    expect(screen.getByRole('heading', { name: 'Create Discount Coupon' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Save Coupon' }));

    expect(screen.getByText('Code must be at least 3 characters')).toBeTruthy();
    expect(state.createCouponMutation).not.toHaveBeenCalled();
  });

  it('creates a coupon and uppercases the code', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Discount Coupons (2)' }));
    await user.click(screen.getByRole('button', { name: 'Create Coupon' }));

    await user.type(screen.getByPlaceholderText('e.g. WELCOME10'), 'festive25');
    await user.type(screen.getByPlaceholderText('Value'), '25');
    await user.type(screen.getByPlaceholderText('Min amount'), '1000');
    await user.type(screen.getByPlaceholderText('Optional total limit'), '50');
    const dateInputs = container.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0] as HTMLInputElement, { target: { value: '2026-09-01' } });
    fireEvent.change(dateInputs[1] as HTMLInputElement, { target: { value: '2026-12-31' } });

    await user.click(screen.getByRole('button', { name: 'Save Coupon' }));

    expect(state.createCouponMutation).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'FESTIVE25', discountType: 'PERCENTAGE', discountValue: 25, minPurchaseAmount: 1000 })
    );
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Create Discount Coupon' })).toBeNull();
    });
  });

  it('shows the empty state when there are no orders', async () => {
    state.setOrdersData({ data: [] });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Orders Management (0)' }));

    expect(screen.getByText('No orders placed yet.')).toBeTruthy();
  });

  it('renders order details and updates payment and order statuses', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Orders Management (1)' }));

    expect(screen.getByText('COD Order Processing')).toBeTruthy();
    expect(screen.getByText('ID: ord_1234')).toBeTruthy();
    expect(screen.getByText('COD')).toBeTruthy();
    expect(screen.getByText('HARD COPY')).toBeTruthy();
    expect(screen.getByText('₹350')).toBeTruthy();
    expect(screen.getAllByText('Karthik').length).toBe(2);
    expect(screen.getByText('karthik@test.com')).toBeTruthy();
    expect(screen.getByText('9876543210')).toBeTruthy();
    expect(screen.getByText('Chennai, TN')).toBeTruthy();
    expect(screen.getByText('₹700')).toBeTruthy();
    expect(screen.getByText('₹60')).toBeTruthy();
    expect(screen.getByText('-₹50')).toBeTruthy();
    expect(screen.getByText('₹710')).toBeTruthy();

    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(2);

    await user.selectOptions(selects[0], 'PAID');
    expect(state.updateOrderPaymentMutation).toHaveBeenCalledWith({ id: 'ord_12345678', paymentStatus: 'PAID' });

    await user.selectOptions(selects[1], 'SHIPPED');
    expect(state.updateOrderStatusMutation).toHaveBeenCalledWith({ id: 'ord_12345678', orderStatus: 'SHIPPED' });
  });

  it('renders the payment screenshot lightbox when present', async () => {
    state.setOrdersData({
      data: [
        {
          id: 'ord_99999999',
          studentId: 'st_11111111',
          couponId: null,
          orderDate: '2026-08-06T10:00:00.000Z',
          subTotal: 350,
          shippingCharge: 60,
          discountAmount: 0,
          payableAmount: 410,
          paymentMethod: 'UPI',
          paymentStatus: 'PAID',
          orderStatus: 'CONFIRMED',
          shippingName: 'Meena',
          shippingPhone: null,
          shippingAddress: null,
          paymentScreenshotUrl: '/screenshots/pay1.png',
          createdAt: '2026-08-06T10:00:00.000Z',
          updatedAt: '2026-08-06T10:00:00.000Z',
          items: [],
          coupon: null,
          student: { name: 'Meena', email: 'meena@test.com' },
        },
      ],
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Orders Management (1)' }));

    expect(screen.getByText('Payment Verification')).toBeTruthy();
    await user.click(screen.getByAltText('Payment Screenshot'));
    expect(screen.getByAltText('Verification Proof')).toBeTruthy();
  });

  it('shows the empty QR state and disables submit without a file', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'QR Settings' }));

    expect(screen.getByText('Global Payment UPI QR Code')).toBeTruthy();
    expect(screen.getByText('No payment QR Code uploaded yet.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Update Payment QR Code' })).toBeDisabled();
  });

  it('uploads a new payment QR code and confirms via alert', async () => {
    const user = userEvent.setup();
    const { container } = renderPage();

    await user.click(screen.getByRole('button', { name: 'QR Settings' }));

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['qr-data'], 'qr.png', { type: 'image/png' });
    await user.upload(fileInput, file);

    await user.click(screen.getByRole('button', { name: 'Update Payment QR Code' }));

    expect(state.updateQrMutation).toHaveBeenCalledWith(file);
    expect(screen.getByText('Payment QR Code updated successfully!')).toBeTruthy();
  });

  it('shows the current active QR code when one is configured', async () => {
    state.setQrData({ paymentQrUrl: '/qr/current.png' });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'QR Settings' }));

    expect(screen.getByAltText('Payment QR')).toBeTruthy();
    expect(screen.getByText('Current Active QR Code')).toBeTruthy();
  });
});
