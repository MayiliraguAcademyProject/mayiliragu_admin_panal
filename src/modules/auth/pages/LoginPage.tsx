import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, type User } from '../../../store/auth-store';
import { apiClient } from '../../../core/api/client';
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';

import { loginSchema, type LoginFormValues } from '../../../core/validation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await apiClient.post('/auth/login', values);
      const { user, accessToken, refreshToken } = response.data;
      
      if (user.role !== 'ADMIN') {
        throw new Error('Access denied. Admin portal is restricted to administrator accounts only.');
      }

      login(user as User, accessToken, refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please verify your credentials.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center font-sans bg-gradient-to-br from-[#F8F9FF] via-[#EAEFFF] to-[#E3EEFF] p-4">
      {/* Back glow decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-container/30 rounded-full blur-3xl -z-10" />

      {/* Main card */}
      <div className="w-full max-w-md bg-cardBg rounded-3xl border border-border/70 shadow-2xl shadow-[#131B2E]/5 overflow-hidden transform transition-all duration-300 hover:scale-[1.01]">
        <div className="p-8 sm:p-10 flex flex-col items-center">
          
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent to-accent/80 flex items-center justify-center shadow-lg shadow-accent/20 mb-5">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary text-center tracking-tight">
            EducationApp LMS
          </h2>
          <p className="text-text-secondary text-sm font-medium mt-1.5 text-center">
            Admin Management Portal
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="w-full mt-8 space-y-5">
            
            {/* Error banner */}
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center shadow-inner">
                <span className="flex-1">{errorMsg}</span>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@education_app.com"
                {...register('email')}
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-xl border font-medium text-sm transition-all outline-none ${
                  errors.email
                    ? 'border-error bg-red-50/20 focus:border-error focus:ring-1 focus:ring-error'
                    : 'border-border focus:border-accent focus:ring-1 focus:ring-accent bg-slate-50/30'
                } text-text-primary placeholder-gray-400`}
              />
              {errors.email && (
                <p className="text-[11px] text-error font-semibold pl-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-extrabold text-text-primary uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  disabled={isLoading}
                  className={`w-full pl-4 pr-11 py-3 rounded-xl border font-medium text-sm transition-all outline-none ${
                    errors.password
                      ? 'border-error bg-red-50/20 focus:border-error focus:ring-1 focus:ring-error'
                      : 'border-border focus:border-accent focus:ring-1 focus:ring-accent bg-slate-50/30'
                  } text-text-primary placeholder-gray-400`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-error font-semibold pl-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent-onContainer text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transition-all duration-200 flex items-center justify-center space-x-2 text-sm disabled:opacity-75 disabled:cursor-not-allowed group active:scale-[0.99]"
            >
              {isLoading ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
