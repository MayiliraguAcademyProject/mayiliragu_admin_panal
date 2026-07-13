import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api/client';
import { ApiConstants } from '../../../core/constants';
import { 
  Smartphone, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Download, 
  FileText 
} from 'lucide-react';

export default function AppConfigPage() {
  const [requiredVersion, setRequiredVersion] = useState('');
  const [apkDownloadUrl, setApkDownloadUrl] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(ApiConstants.appConfig.base);
      if (response.data?.status === 'success') {
        const { requiredVersion, apkDownloadUrl, releaseNotes } = response.data.data;
        setRequiredVersion(requiredVersion || '');
        setApkDownloadUrl(apkDownloadUrl || '');
        setReleaseNotes(releaseNotes || '');
      }
    } catch (error) {
      console.error('Failed to fetch app configuration:', error);
      setMessage({ type: 'error', text: 'Failed to fetch current app configuration.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setValidationError(null);

    // Validate empty values
    if (!requiredVersion.trim() || !apkDownloadUrl.trim()) {
      setValidationError('Required App Version and APK Download URL are required fields.');
      return;
    }

    // Validate semantic version format (x.y.z)
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(requiredVersion.trim())) {
      setValidationError('Version must be in semantic format (e.g. 1.0.0)');
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await apiClient.put(ApiConstants.appConfig.base, {
        requiredVersion: requiredVersion.trim(),
        apkDownloadUrl: apkDownloadUrl.trim(),
        releaseNotes: releaseNotes.trim() || null,
      });

      if (response.data?.status === 'success') {
        setMessage({ type: 'success', text: response.data.message || 'App configuration updated successfully!' });
        const { requiredVersion, apkDownloadUrl, releaseNotes } = response.data.data;
        setRequiredVersion(requiredVersion || '');
        setApkDownloadUrl(apkDownloadUrl || '');
        setReleaseNotes(releaseNotes || '');
      }
    } catch (error: any) {
      console.error('Failed to update app config:', error);
      const errMsg = error.response?.data?.message || 'Failed to update app configuration.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-brandPurple/10 text-brandPurple rounded-xl">
          <Smartphone className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">App Configuration</h1>
          <p className="text-sm text-slate-500">Manage required app version, update releases and APK URLs</p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`flex items-center space-x-2 p-4 rounded-xl mb-6 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-brandPurple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-6">
            {validationError && (
              <div className="flex items-center space-x-2 p-3 bg-rose-50 text-rose-800 rounded-lg text-xs font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Version Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Required Version String (x.y.z)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    v
                  </span>
                  <input
                    type="text"
                    value={requiredVersion}
                    onChange={(e) => setRequiredVersion(e.target.value)}
                    placeholder="1.0.0"
                    disabled={submitLoading}
                    className="w-full pl-7 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Students on versions older than this will be prompted to update. E.g. 1.0.2
                </p>
              </div>

              {/* APK URL Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  APK Download URL
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Download className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={apkDownloadUrl}
                    onChange={(e) => setApkDownloadUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    disabled={submitLoading}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Direct Firebase App Distribution link, server link, or shared drive link.
                </p>
              </div>
            </div>

            {/* Release Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Release Notes / Update Description
              </label>
              <div className="relative">
                <span className="absolute top-3 left-3 text-slate-400">
                  <FileText className="w-4 h-4" />
                </span>
                <textarea
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="Bug fixes and performance improvements..."
                  rows={4}
                  disabled={submitLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition disabled:opacity-50 resize-none"
                />
              </div>
              <p className="text-xs text-slate-400">
                Brief details on what's new in this version. Shown to the students on the update dialog.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitLoading}
                className="flex items-center space-x-2 px-6 py-3 bg-brandPurple hover:bg-brandPurple/90 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {submitLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Configuration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
