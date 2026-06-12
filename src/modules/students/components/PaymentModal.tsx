import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  onClose: () => void;
  onSubmit: (data: { amountPaid: number; paymentMethod: string; installmentInfo?: string }) => Promise<void>;
}

export default function PaymentModal({ onClose, onSubmit }: PaymentModalProps) {
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [installmentInfo, setInstallmentInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountPaid || isNaN(Number(amountPaid))) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        amountPaid: Number(amountPaid),
        paymentMethod,
        installmentInfo: installmentInfo.trim() || undefined
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-cardBg border border-border/80 rounded-3xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-text-primary">Record Student Payment</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Amount Paid (₹)</label>
            <input
              type="number"
              required
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
            >
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="NetBanking">NetBanking</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary uppercase">Installment Info / Notes</label>
            <input
              type="text"
              value={installmentInfo}
              onChange={(e) => setInstallmentInfo(e.target.value)}
              placeholder="e.g. 1st Installment"
              className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="pt-3 flex items-center justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold flex items-center space-x-1">
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
