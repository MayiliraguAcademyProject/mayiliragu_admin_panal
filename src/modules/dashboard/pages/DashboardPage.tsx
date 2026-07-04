import { useAdminStats } from '../../../core/api/endpoints';
import {
  Users,
  BookOpen,
  Video,
  GraduationCap,
  ArrowRight,
  TrendingUp,
  BookMarked
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useAdminStats();

  const cards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents ?? 0,
      icon: Users,
      colorClass: 'from-blue-500 to-blue-600',
      shadowClass: 'shadow-blue-500/20',
      description: 'Active student enrollments',
    },
    {
      title: 'Total Courses',
      value: stats?.totalCourses ?? 0,
      icon: BookOpen,
      colorClass: 'from-[#008A7C] to-[#006A61]',
      shadowClass: 'shadow-accent/20',
      description: 'Published academic courses',
    },
    {
      title: 'Total Lessons',
      value: stats?.totalLessons ?? 0,
      icon: Video,
      colorClass: 'from-indigo-500 to-indigo-600',
      shadowClass: 'shadow-indigo-500/20',
      description: 'Recorded drive video lectures',
    },
  ];

  const shortcuts = [
    {
      name: 'Manage Courses',
      description: 'Create, update, and manage course curriculum structure.',
      path: '/courses',
      icon: BookMarked,
      color: 'text-accent border-accent/20 bg-accent/5',
    },
    {
      name: 'Manage Students',
      description: 'Configure student profiles and control course enrollments.',
      path: '/student-management',
      icon: Users,
      color: 'text-blue-600 border-blue-200 bg-blue-50/50',
    },
    {
      name: 'Tests & Assessment',
      description: 'Build test questionnaire collections and question repositories.',
      path: '/tests',
      icon: GraduationCap,
      color: 'text-purple-600 border-purple-200 bg-purple-50/50',
    },
  ];

  if (isError) {
    return (
      <div className="p-8 max-w-4xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-3xl text-center">
        <h2 className="text-xl font-bold text-red-800">Failed to Load Dashboard Data</h2>
        <p className="text-red-600 text-sm mt-2">
          An error occurred while connecting to the management backend servers.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-5 py-2 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-fade-in">

      {/* Header section */}
      <div>
        <h1 className="text-3xl font-black text-text-primary tracking-tight">
          System Overview
        </h1>
        <p className="text-text-secondary text-sm font-medium mt-1">
          Monitor your LMS portal performance and manage curriculum schedules.
        </p>
      </div>

      {/* Grid count cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-32 bg-cardBg border border-border/60 rounded-3xl p-6 flex flex-col justify-between animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="w-10 h-10 rounded-2xl bg-slate-200" />
              </div>
              <div className="h-8 w-16 bg-slate-200 rounded" />
            </div>
          ))
          : cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`bg-cardBg border border-border/70 rounded-3xl p-6 shadow-xl ${card.shadowClass} flex items-center justify-between hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 group`}
              >
                <div className="space-y-2.5">
                  <p className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">
                    {card.title}
                  </p>
                  <h3 className="text-3xl font-black text-text-primary">
                    {card.value}
                  </h3>
                  <p className="text-[11px] text-text-secondary font-medium">
                    {card.description}
                  </p>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${card.colorClass} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:rotate-6`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            );
          })}
      </div>

      {/* Main sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Quick actions panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center space-x-2.5">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-extrabold text-text-primary tracking-tight">
              Management Operations
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Link
                  key={shortcut.name}
                  to={shortcut.path}
                  className="bg-cardBg border border-border/60 rounded-3xl p-5 hover:border-accent/40 hover:shadow-xl transition-all duration-200 flex flex-col justify-between group h-40"
                >
                  <div className="space-y-2">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${shortcut.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-text-primary text-sm tracking-tight group-hover:text-accent transition-colors">
                      {shortcut.name}
                    </h4>
                    <p className="text-xs text-text-secondary leading-normal">
                      {shortcut.description}
                    </p>
                  </div>
                  <div className="flex items-center text-xs font-bold text-accent group-hover:translate-x-1 transition-transform self-end">
                    <span>Configure</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Info tips card */}
        <div className="bg-gradient-to-br from-primary-container to-slate-900 text-white rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-secondary-container" />
            </div>
            <h3 className="text-lg font-extrabold tracking-tight">Academic Clarity Design</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Maintain standard curriculum hierarchies. Ensure course structures contain modules and sequential lessons with valid drive video streamers.
            </p>
          </div>

          <div className="pt-6 border-t border-white/10 text-[11px] text-gray-400 font-medium">
            Mayiliragu LMS Panel v1.0 • React Web Migration
          </div>
        </div>

      </div>

    </div>
  );
}
