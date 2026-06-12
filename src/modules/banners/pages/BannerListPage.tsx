import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Image as ImageIcon, 
  Loader2, 
  Link as LinkIcon, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { 
  useBannersAdminList, 
  useCreateBanner, 
  useUpdateBanner, 
  useToggleBannerStatus, 
  useDeleteBanner,
  useCoursesList
} from '../../../core/api/endpoints';
import type { Banner } from '../../../core/types';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import BannerModal from '../components/BannerModal';
import type { BannerFormValues } from '../components/BannerModal';

export default function BannerListPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);

  // Queries & Mutations
  const { data: banners, isLoading, error } = useBannersAdminList();
  const { data: coursesData } = useCoursesList(1, 100);
  
  const createBannerMutation = useCreateBanner();
  const updateBannerMutation = useUpdateBanner();
  const deleteBannerMutation = useDeleteBanner();
  const toggleStatusMutation = useToggleBannerStatus();

  const handleOpenAddDialog = () => {
    setEditingBanner(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (banner: Banner) => {
    setEditingBanner(banner);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBanner(null);
  };

  const onSubmit = async (values: BannerFormValues) => {
    try {
      if (editingBanner) {
        await updateBannerMutation.mutateAsync({
          id: editingBanner.id,
          data: {
            title: values.title,
            imageUrl: values.imageUrl,
            linkUrl: values.linkUrl || null,
            order: values.order,
            isActive: values.isActive,
          }
        });
      } else {
        await createBannerMutation.mutateAsync({
          title: values.title,
          imageUrl: values.imageUrl,
          linkUrl: values.linkUrl || null,
          order: values.order,
          isActive: values.isActive,
        });
      }
      handleCloseDialog();
    } catch (err) {
      console.error('Failed to save banner:', err);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleStatusMutation.mutateAsync(id);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (bannerToDelete) {
      await deleteBannerMutation.mutateAsync(bannerToDelete);
      setBannerToDelete(null);
    }
  };

  // Find course title by ID for displaying in listing
  const getCourseTitle = (courseId: string | null | undefined) => {
    if (!courseId) return null;
    const course = coursesData?.data?.find(c => c.id === courseId);
    return course ? course.title : courseId;
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" /> Banner Management
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-semibold">
            Create, update, and sort interactive promotion banners for the Student mobile application.
          </p>
        </div>
        <button
          onClick={handleOpenAddDialog}
          className="flex items-center justify-center space-x-2 px-5 py-3 bg-accent hover:bg-accent-onContainer text-white rounded-2xl text-xs font-black shadow-lg shadow-accent/20 active:scale-[0.98] transition-all duration-200"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Banner</span>
        </button>
      </div>

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-xs text-text-secondary font-semibold">Fetching banners...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center max-w-md mx-auto space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-650 mx-auto" />
          <h3 className="text-sm font-bold text-red-750">Failed to Load Banners</h3>
          <p className="text-xs text-red-600 font-medium">Please check backend database connection and try again.</p>
        </div>
      ) : banners?.length === 0 ? (
        <div className="bg-white/40 border border-dashed border-border/80 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-text-secondary">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-text-primary">No Active Banners</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed font-semibold">
              Banners created here will render as an auto-scrolling carousel on the student app home screen.
            </p>
          </div>
          <button
            onClick={handleOpenAddDialog}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-text-primary rounded-xl text-xs font-bold transition-all duration-200"
          >
            Create Your First Banner
          </button>
        </div>
      ) : (
        /* Grid list of banners */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners?.map((banner) => (
            <div 
              key={banner.id} 
              className={`bg-cardBg border border-border/80 rounded-3xl overflow-hidden shadow-md flex flex-col group hover:shadow-lg transition-all duration-300 relative ${
                !banner.isActive ? 'opacity-75' : ''
              }`}
            >
              {/* Banner Image Preview Container */}
              <div className="aspect-[2.5/1] bg-slate-100 relative overflow-hidden border-b border-border/40">
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=640&auto=format&fit=crop';
                  }}
                />
                
                {/* Actions Overlay */}
                <div className="absolute top-3 right-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900/60 p-1.5 rounded-xl backdrop-blur-sm">
                  <button
                    onClick={() => handleOpenEditDialog(banner)}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-text-primary transition-all duration-200"
                    title="Edit Banner"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setBannerToDelete(banner.id)}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-red-650 text-white transition-all duration-200"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Badge order */}
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-slate-900/60 text-white text-[10px] font-bold rounded-lg backdrop-blur-sm">
                  Seq: #{banner.order}
                </div>
              </div>

              {/* Banner Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-extrabold text-sm text-text-primary tracking-tight line-clamp-1">
                    {banner.title}
                  </h3>
                  
                  {/* Linked course/destination */}
                  <div className="mt-2 flex items-center space-x-1.5 text-xs text-text-secondary font-semibold">
                    <LinkIcon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                    <span className="truncate">
                      {banner.linkUrl ? (
                        <>Linked Course: <strong className="text-text-primary font-bold">{getCourseTitle(banner.linkUrl)}</strong></>
                      ) : (
                        <span className="italic text-gray-400">Non-clickable banner</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Active switch footer */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-text-secondary">
                    {banner.isActive ? 'Active & Visible' : 'Disabled'}
                  </span>
                  
                  {/* Toggle button */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(banner.id)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      banner.isActive ? 'bg-accent' : 'bg-slate-350'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        banner.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Overlay Dialog Modal */}
      <BannerModal
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={onSubmit}
        editingBanner={editingBanner}
        defaultOrder={(banners?.length || 0) + 1}
      />

      {/* Confirmation Modal for delete action */}
      <ConfirmModal
        isOpen={bannerToDelete !== null}
        onClose={() => setBannerToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Promotion Banner?"
        message="This action is permanent and will remove this banner from the student app carousel."
        confirmText="Delete Banner"
      />
    </div>
  );
}
