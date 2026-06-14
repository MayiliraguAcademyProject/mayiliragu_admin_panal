import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Trash2,
  Edit2,
  Loader2,
  AlertTriangle,
  Sparkles,
  Newspaper,
  BookOpen,
  Calendar,
  HelpCircle,
  FileText,
  FileDown,
  ExternalLink
} from 'lucide-react';
import {
  useCurrentAffairsAdminList,
  useCreateCurrentAffair,
  useUpdateCurrentAffair,
  useDeleteCurrentAffair,
  useCurrentAffairQuizzes,
  useCreateCurrentAffairQuizzes,
  useMagazinesList,
  useUploadMagazine,
  useSchemesList,
  useCreateScheme,
  useUpdateScheme,
  useDatesList,
  useCreateDate
} from '../../../core/api/endpoints';
import type { CurrentAffair, GovernmentScheme, CurrentAffairQuiz, ImportantDate } from '../../../core/types';
import { ApiConstants } from '../../../core/constants/api_constants';
import ConfirmModal from '../../../shared/components/ConfirmModal';

// Import extracted modals and schemas
import ArticleModal from '../components/ArticleModal';
import QuizModal from '../components/QuizModal';
import MagazineModal from '../components/MagazineModal';
import SchemeModal from '../components/SchemeModal';
import DateModal from '../components/DateModal';
import { articleSchema, quizFormSchema, magazineSchema, schemeSchema, dateSchema, quizQuestionSchema } from '../components/schemas';

export default function CurrentAffairsPage() {
  const [activeTab, setActiveTab] = useState<'articles' | 'magazines' | 'schemes' | 'dates'>('articles');

  // Modals status
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<CurrentAffair | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizArticleId, setQuizArticleId] = useState<string | null>(null);

  const [isMagazineModalOpen, setIsMagazineModalOpen] = useState(false);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);

  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<GovernmentScheme | null>(null);

  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // API Queries & Mutations
  const { data: articlesData, isLoading: isArticlesLoading, error: articlesError } = useCurrentAffairsAdminList();
  const createArtMutation = useCreateCurrentAffair();
  const updateArtMutation = useUpdateArticleForm();
  const deleteArtMutation = useDeleteCurrentAffair();

  const { refetch: refetchQuizzes } = useCurrentAffairQuizzes(quizArticleId || '');
  const saveQuizzesMutation = useCreateCurrentAffairQuizzes();

  const { data: magazinesData, isLoading: isMagazinesLoading } = useMagazinesList();
  const uploadMagMutation = useUploadMagazine();

  const { data: schemesData, isLoading: isSchemesLoading } = useSchemesList();
  const createSchemeMutation = useCreateScheme();
  const updateSchemeMutation = useUpdateScheme();

  const { data: datesData, isLoading: isDatesLoading } = useDatesList();
  const createDateMutation = useCreateDate();

  // Helper hook to resolve query updateArtMutation typing issue
  function useUpdateArticleForm() {
    return useUpdateCurrentAffair();
  }

  // React Hook Forms setup
  const articleForm = useForm<z.infer<typeof articleSchema>>({
    resolver: zodResolver(articleSchema),
    defaultValues: { isPublished: true }
  });

  const quizForm = useForm<z.infer<typeof quizFormSchema>>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: { questions: [] }
  });

  const magazineForm = useForm<z.infer<typeof magazineSchema>>({
    resolver: zodResolver(magazineSchema),
    defaultValues: { month: new Date().getMonth() + 1, year: new Date().getFullYear() }
  });

  const schemeForm = useForm<z.infer<typeof schemeSchema>>({
    resolver: zodResolver(schemeSchema)
  });

  const dateForm = useForm<z.infer<typeof dateSchema>>({
    resolver: zodResolver(dateSchema),
    defaultValues: { type: 'National' }
  });

  // Action Handlers
  const handleOpenAddArticle = () => {
    articleForm.reset({
      titleEn: '', titleTa: '',
      summaryEn: '', summaryTa: '',
      contentEn: '', contentTa: '',
      examImportanceEn: '', examImportanceTa: '',
      keyFactsEn: '', keyFactsTa: '',
      prelimsNotesEn: '', prelimsNotesTa: '',
      mainsNotesEn: '', mainsNotesTa: '',
      category: 'National Affairs',
      publishedDate: new Date().toISOString().split('T')[0],
      videoUrl: '',
      isPublished: true
    });
    setEditingArticle(null);
    setIsArticleModalOpen(true);
  };

  const handleOpenEditArticle = (art: CurrentAffair) => {
    articleForm.reset({
      titleEn: art.titleEn,
      titleTa: art.titleTa || '',
      summaryEn: art.summaryEn,
      summaryTa: art.summaryTa || '',
      contentEn: art.contentEn,
      contentTa: art.contentTa || '',
      examImportanceEn: art.examImportanceEn || '',
      examImportanceTa: art.examImportanceTa || '',
      keyFactsEn: art.keyFactsEn || '',
      keyFactsTa: art.keyFactsTa || '',
      prelimsNotesEn: art.prelimsNotesEn || '',
      prelimsNotesTa: art.prelimsNotesTa || '',
      mainsNotesEn: art.mainsNotesEn || '',
      mainsNotesTa: art.mainsNotesTa || '',
      category: art.category,
      publishedDate: new Date(art.publishedDate).toISOString().split('T')[0],
      videoUrl: art.videoUrl || '',
      isPublished: art.isPublished
    });
    setEditingArticle(art);
    setIsArticleModalOpen(true);
  };

  const onArticleSubmit = async (values: z.infer<typeof articleSchema>) => {
    try {
      if (editingArticle) {
        await updateArtMutation.mutateAsync({
          id: editingArticle.id,
          data: values
        });
      } else {
        await createArtMutation.mutateAsync(values as unknown as Omit<CurrentAffair, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setIsArticleModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteArticleConfirm = async () => {
    if (articleToDelete) {
      await deleteArtMutation.mutateAsync(articleToDelete);
      setArticleToDelete(null);
    }
  };

  // Quizzes modal
  const handleOpenQuizModal = async (artId: string) => {
    setQuizArticleId(artId);
    setIsQuizModalOpen(true);
    // Fetch quizzes and load into form
    const response = await refetchQuizzes();
    const existing = response.data?.data || [];
    if (existing.length > 0) {
      quizForm.reset({
        questions: existing.map(q => ({
          questionEn: q.questionEn,
          questionTa: q.questionTa || '',
          optionAEn: q.optionsEn[0] || '',
          optionATa: q.optionsTa?.[0] || '',
          optionBEn: q.optionsEn[1] || '',
          optionBTa: q.optionsTa?.[1] || '',
          optionCEn: q.optionsEn[2] || '',
          optionCTa: q.optionsTa?.[2] || '',
          optionDEn: q.optionsEn[3] || '',
          optionDTa: q.optionsTa?.[3] || '',
          correctAnswer: q.correctAnswer as 'A' | 'B' | 'C' | 'D',
          explanationEn: q.explanationEn || '',
          explanationTa: q.explanationTa || '',
        }))
      });
    } else {
      quizForm.reset({ questions: [] });
    }
  };

  const onQuizSubmit = async (values: z.infer<typeof quizFormSchema>) => {
    if (!quizArticleId) return;
    try {
      const formatted = values.questions.map((q: z.infer<typeof quizQuestionSchema>) => ({
        questionEn: q.questionEn,
        questionTa: q.questionTa || null,
        optionsEn: [q.optionAEn, q.optionBEn, q.optionCEn, q.optionDEn],
        optionsTa: q.optionATa || q.optionBTa || q.optionCTa || q.optionDTa
          ? [q.optionATa || '', q.optionBTa || '', q.optionCTa || '', q.optionDTa || '']
          : null,
        correctAnswer: q.correctAnswer,
        explanationEn: q.explanationEn || null,
        explanationTa: q.explanationTa || null,
      }));
      await saveQuizzesMutation.mutateAsync({
        articleId: quizArticleId,
        questions: formatted as Omit<CurrentAffairQuiz, 'id' | 'currentAffairId'>[]
      });
      setIsQuizModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Magazine submit
  const onMagazineSubmit = async (values: z.infer<typeof magazineSchema>) => {
    if (!selectedPdfFile) return;
    try {
      await uploadMagMutation.mutateAsync({
        title: values.title,
        month: values.month,
        year: values.year,
        file: selectedPdfFile
      });
      setIsMagazineModalOpen(false);
      setSelectedPdfFile(null);
      magazineForm.reset();
    } catch (err) {
      console.error(err);
    }
  };

  // Schemes submit
  const handleOpenAddScheme = () => {
    schemeForm.reset({ titleEn: '', titleTa: '', descriptionEn: '', descriptionTa: '', type: 'Central' });
    setEditingScheme(null);
    setIsSchemeModalOpen(true);
  };

  const handleOpenEditScheme = (sch: GovernmentScheme) => {
    schemeForm.reset({
      titleEn: sch.titleEn,
      titleTa: sch.titleTa || '',
      descriptionEn: sch.descriptionEn,
      descriptionTa: sch.descriptionTa || '',
      type: sch.type as 'Central' | 'State'
    });
    setEditingScheme(sch);
    setIsSchemeModalOpen(true);
  };

  const onSchemeSubmit = async (values: z.infer<typeof schemeSchema>) => {
    try {
      if (editingScheme) {
        await updateSchemeMutation.mutateAsync({
          id: editingScheme.id,
          data: values
        });
      } else {
        await createSchemeMutation.mutateAsync(values as Omit<GovernmentScheme, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setIsSchemeModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Dates submit
  const handleOpenAddDate = () => {
    dateForm.reset({
      titleEn: '', titleTa: '',
      date: new Date().toISOString().split('T')[0],
      type: 'National'
    });
    setIsDateModalOpen(true);
  };

  const onDateSubmit = async (values: z.infer<typeof dateSchema>) => {
    try {
      await createDateMutation.mutateAsync(values as Omit<ImportantDate, 'id' | 'createdAt' | 'updatedAt'>);
      setIsDateModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getMonthName = (m: number) => {
    const dates = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return dates[m - 1] || `${m}`;
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-fade-in text-text-primary">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" /> Current Affairs Hub
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-semibold">
            Publish daily bilingual current affairs briefs, quizzes, monthly magazines, scheme updates, and calendars.
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border/80 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('articles')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-xs transition-all ${activeTab === 'articles' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Daily Articles</span>
        </button>
        <button
          onClick={() => setActiveTab('magazines')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-xs transition-all ${activeTab === 'magazines' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Monthly Magazines</span>
        </button>
        <button
          onClick={() => setActiveTab('schemes')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-xs transition-all ${activeTab === 'schemes' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
        >
          <FileText className="w-4 h-4" />
          <span>Gov Schemes</span>
        </button>
        <button
          onClick={() => setActiveTab('dates')}
          className={`flex items-center space-x-2 px-5 py-3 border-b-2 font-black text-xs transition-all ${activeTab === 'dates' ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Important Dates</span>
        </button>
      </div>

      {/* TAB CONTENT: ARTICLES */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-text-secondary">Daily Articles Feed</h2>
            <button
              onClick={handleOpenAddArticle}
              className="flex items-center space-x-2 px-4 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-lg shadow-accent/20 transition-all duration-200"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Article</span>
            </button>
          </div>

          {isArticlesLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : articlesError ? (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center max-w-md mx-auto space-y-3">
              <AlertTriangle className="w-8 h-8 text-red-650 mx-auto" />
              <p className="text-xs text-red-600 font-medium">Failed to load current affairs.</p>
            </div>
          ) : !articlesData?.data || articlesData.data.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-white/40">
              <p className="text-xs text-text-secondary font-semibold">No daily articles published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {articlesData.data.map(art => (
                <div key={art.id} className="bg-cardBg border border-border/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-bold rounded-md">{art.category}</span>
                      <span className="text-[10px] text-text-secondary font-semibold">{new Date(art.publishedDate).toLocaleDateString()}</span>
                      {!art.isPublished && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-md">Draft</span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-sm text-text-primary mt-2">
                      {art.titleEn} {art.titleTa && <span className="text-text-secondary font-medium">/ {art.titleTa}</span>}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">{art.summaryEn}</p>
                  </div>
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      onClick={() => handleOpenQuizModal(art.id)}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-text-primary text-xs font-bold rounded-xl transition-all"
                      title="Manage quiz MCQs"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Quiz ({art._count?.quizzes || 0})</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditArticle(art)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-text-primary rounded-xl transition-all"
                      title="Edit article"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setArticleToDelete(art.id)}
                      className="p-2 bg-slate-100 hover:bg-red-50 text-red-650 rounded-xl transition-all"
                      title="Delete article"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: MONTHLY MAGAZINES */}
      {activeTab === 'magazines' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-text-secondary">Monthly Compilation Archives</h2>
            <button
              onClick={() => {
                setSelectedPdfFile(null);
                magazineForm.reset({
                  title: '',
                  month: new Date().getMonth() + 1,
                  year: new Date().getFullYear()
                });
                setIsMagazineModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-lg shadow-accent/20 transition-all duration-200"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Upload Magazine</span>
            </button>
          </div>

          {isMagazinesLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : !magazinesData?.data || magazinesData.data.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-white/40">
              <p className="text-xs text-text-secondary font-semibold">No magazines uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {magazinesData.data.map(mag => (
                <div key={mag.id} className="bg-cardBg border border-border/80 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-red-50 text-red-650 rounded-2xl">
                      <FileDown className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 text-text-secondary text-[10px] font-bold rounded-lg">
                      {getMonthName(mag.month)} {mag.year}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary">{mag.title}</h3>
                    <p className="text-[10px] text-text-secondary mt-1 font-semibold">Published: {new Date(mag.publishedAt).toLocaleDateString()}</p>
                  </div>
                  <a
                    href={ApiConstants.getAssetUrl(mag.pdfUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-1.5 w-full py-2.5 border border-border hover:bg-slate-50 text-text-primary rounded-xl text-xs font-bold transition-all"
                  >
                    <span>View PDF File</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: GOVERNMENT SCHEMES */}
      {activeTab === 'schemes' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-text-secondary">Scheme Database</h2>
            <button
              onClick={handleOpenAddScheme}
              className="flex items-center space-x-2 px-4 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-lg shadow-accent/20 transition-all duration-200"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Scheme</span>
            </button>
          </div>

          {isSchemesLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : !schemesData?.data || schemesData.data.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-white/40">
              <p className="text-xs text-text-secondary font-semibold">No schemes stored yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {schemesData.data.map(sch => (
                <div key={sch.id} className="bg-cardBg border border-border/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${sch.type === 'Central' ? 'bg-indigo-50 text-indigo-750' : 'bg-teal-50 text-teal-750'
                        }`}>{sch.type} Scheme</span>
                    </div>
                    <h3 className="font-extrabold text-sm text-text-primary mt-2">
                      {sch.titleEn} {sch.titleTa && <span className="text-text-secondary font-medium">/ {sch.titleTa}</span>}
                    </h3>
                    <p className="text-xs text-text-secondary mt-2 line-clamp-3 leading-relaxed">{sch.descriptionEn}</p>
                  </div>
                  <div className="flex items-center justify-end space-x-2 border-t border-border/40 pt-3">
                    <button
                      onClick={() => handleOpenEditScheme(sch)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-text-primary rounded-xl transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: IMPORTANT DATES */}
      {activeTab === 'dates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-text-secondary">Bilingual Exam Calendar Dates</h2>
            <button
              onClick={handleOpenAddDate}
              className="flex items-center space-x-2 px-4 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-lg shadow-accent/20 transition-all duration-200"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Event</span>
            </button>
          </div>

          {isDatesLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : !datesData?.data || datesData.data.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-white/40">
              <p className="text-xs text-text-secondary font-semibold">No calendar events added yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {datesData.data.map(dt => (
                <div key={dt.id} className="bg-cardBg border border-border/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center space-x-4">
                  <div className="p-3 bg-accent/5 text-accent rounded-xl">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-text-primary">
                      {dt.titleEn} {dt.titleTa && <span className="text-text-secondary font-medium">/ {dt.titleTa}</span>}
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 font-bold">{new Date(dt.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-100 text-text-secondary text-[9px] font-bold rounded-md">{dt.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EXTRACTED MODAL COMPONENTS */}
      <ArticleModal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        editingArticle={editingArticle}
        onSubmit={onArticleSubmit}
        form={articleForm}
      />

      <QuizModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        onSubmit={onQuizSubmit}
        form={quizForm}
      />

      <MagazineModal
        isOpen={isMagazineModalOpen}
        onClose={() => setIsMagazineModalOpen(false)}
        onSubmit={onMagazineSubmit}
        form={magazineForm}
        selectedFile={selectedPdfFile}
        onFileChange={setSelectedPdfFile}
        isPending={uploadMagMutation.isPending}
      />

      <SchemeModal
        isOpen={isSchemeModalOpen}
        onClose={() => setIsSchemeModalOpen(false)}
        editingScheme={editingScheme}
        onSubmit={onSchemeSubmit}
        form={schemeForm}
      />

      <DateModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        onSubmit={onDateSubmit}
        form={dateForm}
      />

      <ConfirmModal
        isOpen={articleToDelete !== null}
        onClose={() => setArticleToDelete(null)}
        onConfirm={handleDeleteArticleConfirm}
        title="Delete Current Affairs Article?"
        message="This will hide the article and its associated quiz questions from the student application feed."
        confirmText="Delete Article"
      />
    </div>
  );
}
