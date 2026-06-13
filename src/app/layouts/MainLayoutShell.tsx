import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth-store';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  GraduationCap, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  ChevronRight,
  Image,
  Newspaper,
  Library,
  TrendingUp,
  ShoppingBag,
  Download
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function MainLayoutShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Courses', path: '/courses', icon: BookOpen },
    { name: 'Students', path: '/student-management', icon: Users },
    { name: 'Tests & Question Bank', path: '/tests', icon: GraduationCap },
    { name: 'Banners', path: '/banners', icon: Image },
    { name: 'Current Affairs', path: '/current-affairs', icon: Newspaper },
    { name: 'Study Library', path: '/study-materials', icon: Library },
    { name: 'Book Store', path: '/book-store', icon: ShoppingBag },
    { name: 'Video Downloads', path: '/video-downloads', icon: Download },
    { name: 'Performance Analytics', path: '/performance-analytics', icon: TrendingUp },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper to generate dynamic breadcrumbs
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    return (
      <div className="flex items-center space-x-1 text-xs text-text-secondary font-medium">
        <span className="hover:text-accent cursor-pointer" onClick={() => navigate('/dashboard')}>
          Home
        </span>
        {paths.map((p, idx) => {
          const routeTo = `/${paths.slice(0, idx + 1).join('/')}`;
          const isLast = idx === paths.length - 1;
          const displayLabel = p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' ');
          return (
            <React.Fragment key={p}>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              {isLast ? (
                <span className="text-text-primary font-bold">{displayLabel}</span>
              ) : (
                <span className="hover:text-accent cursor-pointer" onClick={() => navigate(routeTo)}>
                  {displayLabel}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-gradient-to-br from-background-start via-[#EFF5FF] to-background-end">
      {/* Sidebar - Desktop */}
      <aside 
        className={`bg-primary-container text-white transition-all duration-300 ease-in-out flex flex-col z-20 shadow-xl ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } hidden md:flex`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-5 border-b border-[#1E293B]">
          <Link to="/dashboard" className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-secondary-container to-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <span className="text-primary font-black text-lg">M</span>
            </div>
            {isSidebarOpen && (
              <span className="text-base font-extrabold tracking-wider bg-gradient-to-r from-white via-secondary to-accent bg-clip-text text-transparent transition-opacity duration-300">
                EDUCATION_APP
              </span>
            )}
          </Link>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? 'bg-accent text-white shadow-md shadow-accent/30 font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                  {isSidebarOpen && <span className="ml-3 text-sm tracking-wide">{item.name}</span>}
                  
                  {/* Left indicator line */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-md" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer User & Logout */}
        <div className="p-4 border-t border-[#1E293B] bg-slate-950/20">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-4 py-3 text-sm rounded-xl text-red-400 hover:text-red-350 hover:bg-red-950/20 transition-all duration-200 group ${
              isSidebarOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            {isSidebarOpen && <span className="ml-3 font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile Drawer */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 w-64 bg-primary-container text-white z-40 flex flex-col md:hidden transition-transform duration-300 ease-in-out shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#1E293B]">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-secondary-container to-accent flex items-center justify-center">
              <span className="text-primary font-black text-lg">M</span>
            </div>
            <span className="text-base font-extrabold tracking-wider bg-gradient-to-r from-white to-secondary bg-clip-text text-transparent">
              EDUCATION_APP
            </span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? 'bg-accent text-white shadow-lg shadow-accent/20 font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="ml-3 text-sm">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1E293B] bg-slate-950/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="ml-3 font-semibold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar Header */}
        <header className="h-16 bg-cardBg border-b border-border/80 flex items-center justify-between px-6 z-10 shadow-sm">
          {/* Collapse sidebar controls */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-background-end text-text-primary transition-colors focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Dynamic Breadcrumbs */}
            {getBreadcrumbs()}
          </div>

          {/* User Section dropdown */}
          <div className="flex items-center space-x-4">
            {/* User details card */}
            <div className="flex items-center space-x-3 border-l border-border/85 pl-4 py-1.5">
              <div className="w-9 h-9 rounded-full bg-[#E5EEFF] flex items-center justify-center text-accent font-semibold shadow-inner">
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-extrabold text-text-primary leading-tight">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-text-secondary leading-none capitalize mt-0.5">{user?.role?.toLowerCase() || 'Role'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet scroll Container */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="max-w-[1600px] mx-auto min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
