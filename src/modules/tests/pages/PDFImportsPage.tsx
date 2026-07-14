import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Trash2, ArrowRight } from 'lucide-react';
import { apiClient } from '../../../core/api/endpoints';
import LocalPDFParser from '../components/LocalPDFParser';

interface Batch {
  id: string;
  fileName: string;
  examCategory: string;
  status: 'QUEUED' | 'PROCESSING' | 'NEEDS_REVIEW' | 'APPROVED' | 'FAILED';
  totalParsed: number;
  totalApproved: number;
  errorLog?: string;
  createdAt: string;
}

export default function PDFImportsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'parser' | 'history'>('parser');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);

  // Fetch batches
  const fetchBatches = async () => {
    try {
      const res = await apiClient.get('/questions/parsed-batches');
      setBatches(res.data.data.batches || []);
    } catch (err) {
      console.error('Failed to fetch batches', err);
    } finally {
      setIsLoadingBatches(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Poll status every 5 seconds ONLY if there is a batch being processed or queued
  useEffect(() => {
    const isParsing = batches.some((b) => b.status === 'PROCESSING' || b.status === 'QUEUED');
    if (!isParsing) return;

    const interval = setInterval(fetchBatches, 5000);
    return () => clearInterval(interval);
  }, [batches]);

  const handleDeleteBatch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this PDF import batch?')) return;
    try {
      await apiClient.delete(`/questions/parsed-batches/${id}`);
      fetchBatches();
    } catch (err) {
      alert('Failed to delete batch');
    }
  };

  const handleReparseBatch = async (id: string) => {
    try {
      await apiClient.put(`/questions/parsed-batches/${id}/reparse`);
      fetchBatches();
    } catch (err) {
      alert('Failed to trigger reparsing');
    }
  };

  // Check if any batch is actively parsing or queued
  const isParsingActive = batches.some((b) => b.status === 'PROCESSING' || b.status === 'QUEUED');

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">File Test Import Wizard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Upload mock test PDFs to automatically extract, verify, and import questions locally in the browser.
          </p>
        </div>
        
        {/* Tab switchers */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start md:self-auto border border-border/10">
          <button
            onClick={() => setActiveTab('parser')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'parser' ? 'bg-white dark:bg-slate-900 text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Local PDF Parser
          </button>
          {/* <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'history' ? 'bg-white dark:bg-slate-900 text-text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Server Batches ({batches.length})
          </button> */}
        </div>
      </div>

      {activeTab === 'parser' ? (
        <LocalPDFParser onSuccess={fetchBatches} />
      ) : (
        <div className="space-y-6">
          {isParsingActive && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center space-x-4 animate-pulse">
              <RefreshCw className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-primary">File Ingestion & AI Parsing in Progress...</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Gemini is currently extracting questions, options, passages, and building rich layouts in the background. The status table below updates automatically.
                </p>
              </div>
            </div>
          )}

          {/* Batches Table */}
          <div className="bg-cardBg border border-border/80 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">Ingestion Batches</h2>
              <button onClick={fetchBatches} className="p-2 hover:bg-secondary rounded-lg text-text-secondary transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-xs font-bold text-text-secondary uppercase">
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Progress</th>
                    <th className="py-3 px-4">Created At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-sm text-text-primary">
                  {isLoadingBatches ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-text-secondary">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : batches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-text-secondary">
                        No ingestion batches found.
                      </td>
                    </tr>
                  ) : (
                    batches.map((b) => (
                      <tr key={b.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold max-w-[200px] truncate" title={b.fileName}>
                          {b.fileName}
                        </td>
                        <td className="py-3.5 px-4 capitalize">{b.examCategory.replace(/_/g, ' ')}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              b.status === 'APPROVED'
                                ? 'bg-green-500/10 text-green-600'
                                : b.status === 'NEEDS_REVIEW'
                                ? 'bg-amber-500/10 text-amber-600'
                                : b.status === 'PROCESSING'
                                ? 'bg-blue-500/10 text-blue-600'
                                : b.status === 'FAILED'
                                ? 'bg-red-500/10 text-red-600'
                                : 'bg-gray-500/10 text-gray-600'
                            }`}
                          >
                            {(b.status === 'PROCESSING' || b.status === 'QUEUED') && (
                              <RefreshCw className="w-3 h-3 animate-spin mr-1.5" />
                            )}
                            {b.status === 'NEEDS_REVIEW' ? 'Needs Review' : b.status}
                          </span>
                          {b.status === 'PROCESSING' && b.errorLog && (
                            <div className="text-[11px] text-text-secondary mt-1 max-w-[200px] truncate" title={b.errorLog}>
                              {b.errorLog}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold">
                          {b.totalApproved} / {b.totalParsed}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-text-secondary">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {b.status === 'NEEDS_REVIEW' && (
                            <button
                              onClick={() => navigate(`/tests/parsed-verification/${b.id}`)}
                              className="inline-flex items-center space-x-1 text-xs font-bold text-white bg-primary hover:bg-accent px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <span>Verify</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {b.status === 'FAILED' && (
                            <button
                              onClick={() => handleReparseBatch(b.id)}
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg"
                              title="Retry Ingestion"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBatch(b.id)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"
                            title="Delete Ingestion"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
