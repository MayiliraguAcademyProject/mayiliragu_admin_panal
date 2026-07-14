import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api/client';
import { ApiConstants } from '../../../core/constants';
import { 
  Smartphone, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  FileText 
} from 'lucide-react';

export default function AppConfigPage() {
  const [releaseTag, setReleaseTag] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const GITHUB_DOWNLOAD_PREFIX = 'https://github.com/MayiliraguAcademyProject/mayiliragu_student/releases/download/';
  const GITHUB_DOWNLOAD_SUFFIX = '/app-release.apk';

  const extractTag = (url: string) => {
    if (url && url.startsWith(GITHUB_DOWNLOAD_PREFIX) && url.endsWith(GITHUB_DOWNLOAD_SUFFIX)) {
      return url.substring(GITHUB_DOWNLOAD_PREFIX.length, url.length - GITHUB_DOWNLOAD_SUFFIX.length);
    }
    return url || '';
  };

  const buildUrl = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !trimmed.startsWith('http')) {
      return `${GITHUB_DOWNLOAD_PREFIX}${trimmed}${GITHUB_DOWNLOAD_SUFFIX}`;
    }
    return trimmed;
  };

  const extractVersionFromTag = (tag: string) => {
    const match = tag.trim().match(/^v?(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(ApiConstants.appConfig.base);
      if (response.data?.status === 'success') {
        const { apkDownloadUrl, releaseNotes } = response.data.data;
        setReleaseTag(extractTag(apkDownloadUrl));
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
    if (!releaseTag.trim()) {
      setValidationError('Release Tag is required.');
      return;
    }

    // Extract and validate version from tag
    const version = extractVersionFromTag(releaseTag);
    if (!version) {
      setValidationError('Release tag must contain a semantic version (e.g. v1.0.0-5 or 1.0.0)');
      return;
    }

    setSubmitLoading(true);
    try {
      const fullUrl = buildUrl(releaseTag);
      const response = await apiClient.put(ApiConstants.appConfig.base, {
        requiredVersion: version,
        apkDownloadUrl: fullUrl,
        releaseNotes: releaseNotes.trim() || null,
      });

      if (response.data?.status === 'success') {
        setMessage({ type: 'success', text: response.data.message || 'App configuration updated successfully!' });
        const { apkDownloadUrl, releaseNotes } = response.data.data;
        setReleaseTag(extractTag(apkDownloadUrl));
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
        <div className="p-3 bg-primary/10 text-primary rounded-xl">
          <Smartphone className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">App Configuration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage required app version, update releases and APK URLs</p>
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
      <div className="bg-white dark:bg-cardBg rounded-2xl border border-slate-100 dark:border-border/60 shadow-sm overflow-hidden">
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

            <div className="space-y-6">
              {/* Release Tag Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Release Tag / Version Tag
                </label>
                <div className="relative flex items-center">
                  <div className="flex items-stretch w-full">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-border/80 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs select-none max-w-[200px] truncate">
                      .../download/
                    </span>
                    <input
                      type="text"
                      value={releaseTag}
                      onChange={(e) => setReleaseTag(e.target.value)}
                      placeholder="v1.0.0-5"
                      disabled={submitLoading}
                      className="flex-1 min-w-0 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-r-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition disabled:opacity-50 font-mono"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between text-xs text-slate-400 dark:text-slate-500 gap-1">
                  <span>Enter only the release tag name (e.g. <span className="font-mono text-slate-600 dark:text-slate-300">v1.0.0-5</span>).</span>
                  <span>
                    Detected Version: <span className="font-mono font-semibold text-primary">{extractVersionFromTag(releaseTag) || 'None (must contain version like v1.0.0)'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Release Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Release Notes / Update Description
              </label>
              <div className="relative">
                <span className="absolute top-3 left-3 text-slate-400 dark:text-slate-500">
                  <FileText className="w-4 h-4" />
                </span>
                <textarea
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="Bug fixes and performance improvements..."
                  rows={4}
                  disabled={submitLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-border/80 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brandPurple/20 focus:border-brandPurple transition disabled:opacity-50 resize-none"
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Brief details on what's new in this version. Shown to the students on the update dialog.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-border/60">
              <button
                type="submit"
                disabled={submitLoading}
                className="flex items-center space-x-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
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
