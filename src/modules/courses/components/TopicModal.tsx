import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { topicSchema, type TopicFormValues } from '../../../core/validation';
import type { Topic } from '../../../core/types';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: TopicFormValues) => Promise<void>;
  editingTopic: Topic | null;
  isLoading?: boolean;
}

export default function TopicModal({
  isOpen,
  onClose,
  onSubmit,
  editingTopic,
  isLoading = false,
}: TopicModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<TopicFormValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: { title: '', description: '' },
  });

  const isSubmitting = isFormSubmitting || isLoading;

  useEffect(() => {
    if (isOpen) {
      if (editingTopic) {
        setValue('title', editingTopic.title);
        setValue('description', editingTopic.description || '');
      } else {
        reset({ title: '', description: '' });
      }
    }
  }, [isOpen, editingTopic, setValue, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <form 
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-border/40 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight">
              {editingTopic ? 'Edit Topic' : 'Add New Topic'}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Subject or chapter grouping within this module.
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
              Topic Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Indian Polity & Constitution"
              {...register('title')}
              disabled={isSubmitting}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all ${
                errors.title ? 'border-error focus:ring-error focus:border-error bg-red-50/10' : 'border-border focus:ring-accent focus:border-accent'
              } text-text-primary bg-slate-50/20`}
            />
            {errors.title && (
              <p className="text-[11px] text-error font-semibold pl-1">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of what this topic covers..."
              {...register('description')}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-accent focus:border-accent text-sm font-medium outline-none transition-all text-text-primary bg-slate-50/20 resize-none"
            />
            {errors.description && (
              <p className="text-[11px] text-error font-semibold pl-1">{errors.description.message}</p>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-border/40 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-2 bg-white border border-border hover:bg-slate-50 text-xs font-bold rounded-xl text-text-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-4 py-2 bg-accent hover:bg-accent-onContainer text-xs font-bold rounded-xl text-white shadow-md shadow-accent/15 transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <span>{editingTopic ? 'Save Changes' : 'Create Topic'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
