import { useState, type ErrorInfo } from 'react';
import {
  AlertOctagon,
  RefreshCw,
  Home,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileQuestion
} from 'lucide-react';

interface GlobalErrorFallbackProps {
  error?: Error | null;
  errorInfo?: ErrorInfo | null;
  resetErrorBoundary?: () => void;
  is404?: boolean;
  title?: string;
  message?: string;
}

export default function GlobalErrorFallback({
  error,
  errorInfo,
  resetErrorBoundary,
  is404 = false,
  title,
  message,
}: GlobalErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGoDashboard = () => {
    window.location.href = '/dashboard';
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleClearCacheAndRestart = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.href = '/dashboard';
  };

  const handleCopyDiagnostics = () => {
    const diagnosticData = [
      `Timestamp: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
      `Error Name: ${error?.name || (is404 ? 'Page Not Found (404)' : 'Unknown Error')}`,
      `Error Message: ${error?.message || message || 'No message provided'}`,
      `Stack Trace:\n${error?.stack || 'No stack trace available'}`,
      `Component Stack:\n${errorInfo?.componentStack || 'N/A'}`,
    ].join('\n\n');

    navigator.clipboard.writeText(diagnosticData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-4 sm:p-6 md:p-8 animate-fade-in">
      <div className="w-full max-w-2xl bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-10 space-y-8 backdrop-blur-md">
        
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-4 rounded-3xl shadow-xl flex items-center justify-center ${
            is404 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {is404 ? (
              <FileQuestion className="w-12 h-12 stroke-[1.75]" />
            ) : (
              <AlertOctagon className="w-12 h-12 stroke-[1.75] animate-pulse" />
            )}
          </div>

          <div className="space-y-1.5 max-w-lg">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-text-primary">
              {title || (is404 ? '404 - Page Not Found' : 'Something Went Wrong')}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
              {message || (is404
                ? 'The requested page or resource could not be found. Please check the URL or return to the dashboard.'
                : 'An unexpected application error occurred in this view. Don\'t worry, your data is safe.')}
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="flex items-center space-x-2 px-5 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-lg shadow-accent/25 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          )}

          <button
            onClick={handleGoDashboard}
            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-text-primary rounded-xl text-xs font-bold transition-all duration-200 border border-border/50"
          >
            <Home className="w-4 h-4 text-accent" />
            <span>Go to Dashboard</span>
          </button>

          <button
            onClick={handleReload}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-text-primary rounded-xl text-xs font-bold transition-all duration-200 border border-border/50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-text-secondary" />
            <span>Reload Page</span>
          </button>
        </div>

        {/* Secondary Troubleshooting Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/40">
          <button
            onClick={handleClearCacheAndRestart}
            className="flex items-center space-x-1.5 text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Storage & Reset</span>
          </button>

          <button
            onClick={handleCopyDiagnostics}
            className="flex items-center space-x-1.5 text-[11px] font-bold text-accent hover:underline transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Diagnostics!' : 'Copy Error Details'}</span>
          </button>
        </div>

        {/* Collapsible Technical Details (Developer / Admin Diagnostics) */}
        {error && (
          <div className="border border-border/60 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/50">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-extrabold text-text-secondary hover:text-text-primary transition-colors"
            >
              <span>Technical Diagnostics</span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetails && (
              <div className="p-4 pt-0 border-t border-border/40 space-y-3 font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto max-h-60">
                <div>
                  <span className="font-bold text-red-500">{error.name}: </span>
                  <span className="font-semibold">{error.message}</span>
                </div>
                {error.stack && (
                  <pre className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 whitespace-pre-wrap bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-border/40">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
