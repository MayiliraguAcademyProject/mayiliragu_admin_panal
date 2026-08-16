import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefetching: boolean;
  label?: string;
  className?: string;
  title?: string;
}

export default function RefreshButton({
  onRefresh,
  isRefetching,
  label,
  className = '',
  title = 'Refresh',
}: RefreshButtonProps) {
  return (
    <button
      onClick={onRefresh}
      disabled={isRefetching}
      aria-label="Refresh"
      title={title}
      className={`flex items-center justify-center space-x-2 border border-border/60 hover:border-border rounded-xl bg-cardBg hover:bg-slate-50 dark:hover:bg-white/5 text-text-secondary hover:text-text-primary px-3 py-2.5 transition-all duration-200 active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none group ${className}`}
    >
      <RefreshCw
        className={`w-4 h-4 transition-transform duration-500 group-hover:rotate-180 ${
          isRefetching ? 'animate-spin text-accent' : ''
        }`}
      />
      {label && <span className="text-xs font-bold">{label}</span>}
    </button>
  );
}
