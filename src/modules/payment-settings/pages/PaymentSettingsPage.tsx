import React, { useState, useEffect, useRef } from 'react';
import { useGetPaymentSettings, useUpsertPaymentSettings } from '../../../core/api/endpoints';
import { 
  QrCode, 
  Save, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Loader2 
} from 'lucide-react';

export default function PaymentSettingsPage() {
  const { data: settings, isLoading } = useGetPaymentSettings();
  const upsertMutation = useUpsertPaymentSettings();

  const [instructions, setInstructions] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setInstructions(settings.instructions || '');
      if (settings.qrImageUrl) {
        setPreviewUrl(settings.qrImageUrl);
      }
    }
  }, [settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      if (previewUrl && !previewUrl.startsWith('http')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!previewUrl && !selectedFile) {
      setMessage({ type: 'error', text: 'Please upload a UPI QR code image.' });
      return;
    }

    if (!instructions.trim()) {
      setMessage({ type: 'error', text: 'Please enter payment instructions.' });
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        instructions,
        file: selectedFile || undefined,
      });
      setMessage({ type: 'success', text: 'Payment settings saved successfully.' });
      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save payment settings.' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <p className="text-xs font-semibold text-text-secondary">Loading payment settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-black text-text-primary tracking-tight">Global Payment Settings</h2>
        <p className="text-xs text-text-secondary mt-1 font-semibold">
          Configure the official UPI QR code and payment instructions shown to students upon purchase checkout.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border flex items-start space-x-3 text-xs font-bold leading-normal ${
          message.type === 'success' 
            ? 'bg-green-500/10 border-green-500/30 text-green-600' 
            : 'bg-red-500/10 border-red-500/30 text-red-650'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* QR Code Upload Card */}
        <div className="md:col-span-1 bg-cardBg border border-border/80 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col items-center">
          <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider self-start">
            UPI QR Code Image
          </label>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square max-w-[200px] border border-dashed border-border hover:bg-slate-50/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center cursor-pointer select-none relative"
          >
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="QR Preview" 
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="text-center p-4 space-y-1">
                <QrCode className="w-8 h-8 text-accent mx-auto" />
                <span className="text-[10px] text-text-secondary font-bold block">Upload QR Code</span>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center space-x-2 w-full py-2 bg-slate-100 hover:bg-slate-200 text-text-primary rounded-xl text-xs font-bold transition-all border border-border"
          >
            <Upload className="w-4.5 h-4.5" />
            <span>{previewUrl ? 'Change QR Image' : 'Select Image'}</span>
          </button>
          
          <p className="text-[9px] text-text-secondary font-medium text-center">
            Upload the official UPI QR code generated from your business account (GPay, PhonePe, Paytm, etc.).
          </p>
        </div>

        {/* Instructions and Details Card */}
        <div className="md:col-span-2 bg-cardBg border border-border/80 rounded-3xl p-6 shadow-sm flex flex-col space-y-4">
          <div className="space-y-1.5 flex-1 flex flex-col">
            <label className="block text-[10px] font-black text-text-primary uppercase tracking-wider">
              Payment Instructions
            </label>
            <textarea
              placeholder="e.g. Scan the QR code using any UPI app. Once payment is successful, upload a screenshot of the transaction receipt showing transaction ID and amount."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="flex-1 w-full p-4 rounded-2xl border text-xs font-semibold outline-none border-border focus:ring-accent focus:border-accent text-text-primary bg-slate-50/20 resize-none min-h-[200px]"
            />
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-border/40">
            <button
              type="submit"
              disabled={upsertMutation.isPending}
              className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-accent hover:bg-accent-onContainer text-white rounded-xl text-xs font-black shadow-md shadow-accent/15 disabled:opacity-50"
            >
              {upsertMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Settings...</span>
                </>
              ) : (
                <>
                  <Save className="w-4.5 h-4.5" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
