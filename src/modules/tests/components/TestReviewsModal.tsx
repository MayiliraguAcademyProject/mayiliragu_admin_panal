import { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api/endpoints';
import { X, Star, MessageSquare, User, Calendar, Loader2 } from 'lucide-react';

interface ReviewItem {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  rating: number;
  suggestion: string | null;
  created_at: string;
}

interface ReviewsSummary {
  total_reviews: number;
  average_rating: number;
}

interface TestReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
  testTitle: string;
}

export default function TestReviewsModal({
  isOpen,
  onClose,
  testId,
  testTitle,
}: TestReviewsModalProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ReviewsSummary>({ total_reviews: 0, average_rating: 0 });
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    if (isOpen && testId) {
      fetchReviews();
    }
  }, [isOpen, testId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/tests/${testId}/reviews`);
      if (res.data && res.data.data) {
        const data = res.data.data;
        setSummary(data.summary || { total_reviews: 0, average_rating: 0 });
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to fetch test reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Student Reviews & Feedback</h3>
            <p className="text-xs text-slate-500 font-medium truncate max-w-md">{testTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 rounded-2xl border border-amber-200/50 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-md shadow-amber-500/20">
                {summary.average_rating > 0 ? summary.average_rating.toFixed(1) : '0.0'}
              </div>
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(summary.average_rating)
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-semibold text-slate-600">
                  Overall Rating out of 5 stars
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 bg-white border border-amber-200 rounded-full text-xs font-bold text-amber-700 shadow-sm">
                {summary.total_reviews} {summary.total_reviews === 1 ? 'Review' : 'Reviews'} Total
              </span>
            </div>
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <p className="text-sm font-medium">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-slate-600 font-semibold text-sm">No reviews yet</p>
              <p className="text-slate-400 text-xs mt-1">Students have not submitted ratings or suggestions for this test.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                All Submissions ({reviews.length})
              </h4>
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-accent/10 text-accent rounded-full flex items-center justify-center font-bold text-sm">
                        {rev.student_name ? rev.student_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-800">{rev.student_name || 'Anonymous Student'}</h5>
                        <p className="text-xs text-slate-400">{rev.student_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-1.5">{rev.rating}.0</span>
                    </div>
                  </div>

                  {rev.suggestion ? (
                    <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed italic">
                      "{rev.suggestion}"
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No suggestion text provided.</p>
                  )}

                  <div className="flex items-center justify-end text-[11px] text-slate-400 space-x-1 pt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(rev.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
