import React, { useState, useEffect } from 'react';
import { X, Loader2, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import type { Student } from '../../../core/types';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; password?: string }) => Promise<void>;
  student: Student | null; // Null for create, non-null for edit
}

export default function StudentFormModal({
  isOpen,
  onClose,
  onSubmit,
  student,
}: StudentFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setEmail(student.email);
      setPassword('');
    } else {
      setName('');
      setEmail('');
      setPassword('');
    }
    setShowPassword(false);
    setError(null);
  }, [student, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('A valid email address is required');
      return;
    }
    if (!student && (!password || password.length < 6)) {
      setError('Password is required and must be at least 6 characters long');
      return;
    }
    if (student && password && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password ? password : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save student account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-cardBg border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border/45 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-text-primary tracking-tight">
              {student ? 'Edit Student Profile' : 'Register New Student'}
            </h3>
            <p className="text-xs text-text-secondary font-medium mt-0.5">
              {student ? 'Update login credential or profile name.' : 'Set up a new student account to enroll in courses.'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-gray-400 hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">
              Full Name
            </label>
            <div className="flex items-center bg-slate-50 border border-border/60 rounded-2xl px-4 py-3 focus-within:border-accent transition-colors">
              <User className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-transparent text-sm text-text-primary outline-none"
                required
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">
              Email Address
            </label>
            <div className="flex items-center bg-slate-50 border border-border/60 rounded-2xl px-4 py-3 focus-within:border-accent transition-colors">
              <Mail className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john.doe@email.com"
                className="w-full bg-transparent text-sm text-text-primary outline-none"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">
              Password
            </label>
            <div className="flex items-center bg-slate-50 border border-border/60 rounded-2xl px-4 py-3 focus-within:border-accent transition-colors relative">
              <Lock className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={student ? '•••••••• (leave blank to keep current)' : '•••••••• (minimum 6 characters)'}
                className="w-full bg-transparent text-sm text-text-primary outline-none pr-8"
                required={!student}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 p-0.5 rounded-lg text-gray-400 hover:text-text-primary transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border/40 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-text-primary font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 bg-accent hover:bg-accent-onContainer text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md shadow-accent/15 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{student ? 'Update Student' : 'Create Student'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
