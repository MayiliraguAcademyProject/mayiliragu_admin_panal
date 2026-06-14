import { useState } from 'react';
import { useVideoDownloads } from '../../../core/api/endpoints';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Download,
  Calendar,
  User,
  BookOpen
} from 'lucide-react';

interface DownloadLog {
  id: string;
  studentName: string;
  studentEmail: string;
  lessonTitle: string;
  courseTitle: string;
  downloadedAt: string;
}

export default function VideoDownloadsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data, isLoading, isError, refetch } = useVideoDownloads({
    search: searchQuery,
    page,
    limit: 15
  });

  const rawLogs = data?.data || [];
  const logs: DownloadLog[] = rawLogs.map((log: any) => ({
    id: log.id,
    studentName: log.student?.name || 'Unknown',
    studentEmail: log.student?.email || 'N/A',
    lessonTitle: log.lesson?.title || 'Unknown Lesson',
    courseTitle: log.lesson?.module?.course?.title || 'N/A',
    downloadedAt: log.downloadedAt,
  }));
  const meta = { totalPages: 1, totalItems: logs.length };

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in relative">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">
            Video Download Tracking
          </h1>
          <p className="text-text-secondary text-sm font-medium mt-1">
            Track which students downloaded videos to watch offline and when.
          </p>
        </div>
      </div>

      {/* Filters & search */}
      <div className="flex items-center bg-cardBg border border-border/60 rounded-2xl px-4 py-2.5 max-w-md shadow-sm">
        <Search className="w-5 h-5 text-gray-400 mr-2.5 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search student or lesson..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="w-full bg-transparent text-sm text-text-primary placeholder-gray-400 outline-none"
        />
      </div>

      {/* Main content table */}
      {isLoading ? (
        <div className="p-8 text-center flex flex-col justify-center items-center h-64 space-y-3 bg-cardBg border border-border/60 rounded-3xl">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-text-secondary text-sm font-semibold">Loading download logs...</p>
        </div>
      ) : isError ? (
        <div className="p-8 max-w-lg mx-auto mt-12 bg-red-50 border border-red-200 rounded-3xl text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-red-800">Failed to Load Logs</h2>
          <p className="text-red-650 text-sm">Please check your backend connection and try again.</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl shadow-md"
          >
            Try Again
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-cardBg border border-border/50 rounded-3xl p-12 text-center space-y-3">
          <Download className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-extrabold text-text-primary text-lg">No Download Logs Found</h3>
          <p className="text-sm text-text-secondary">
            {searchQuery ? 'Adjust your search query.' : 'Logs will appear once students download offline-enabled videos.'}
          </p>
        </div>
      ) : (
        <div className="bg-cardBg border border-border/60 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border/60 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-extrabold text-text-primary uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-text-primary uppercase tracking-wider">Course & Lesson</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-text-primary uppercase tracking-wider">Downloaded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                    {/* Student details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-[#E5EEFF] flex items-center justify-center text-accent font-semibold shadow-inner">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">{log.studentName}</p>
                          <p className="text-xs text-text-secondary">{log.studentEmail}</p>
                        </div>
                      </div>
                    </td>
                    {/* Course/Lesson details */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-accent" />
                          <p className="text-sm font-bold text-text-primary">{log.lessonTitle}</p>
                        </div>
                        <p className="text-xs text-text-secondary pl-5">{log.courseTitle}</p>
                      </div>
                    </td>
                    {/* Date/Time */}
                    <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{new Date(log.downloadedAt).toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-border/60">
              <span className="text-xs text-text-secondary font-medium">
                Total {meta.totalItems} records
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 border border-border/60 rounded-xl bg-cardBg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 text-text-primary" />
                </button>
                <span className="text-xs font-bold text-text-primary">
                  Page {page} of {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="p-1.5 border border-border/60 rounded-xl bg-cardBg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4 text-text-primary" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
