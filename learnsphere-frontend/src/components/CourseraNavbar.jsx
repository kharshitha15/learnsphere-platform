import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentNotificationCenter from './StudentNotificationCenter';

const CourseraNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exploreOpen, setExploreOpen] = useState(false);

  const isLearningPage = location.pathname.startsWith('/learning');

  const logoHref = !user
    ? '/'
    : user.role === 'INSTRUCTOR'
    ? '/instructor'
    : user.role === 'ADMIN'
    ? '/admin'
    : '/dashboard?tab=mylearning';

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  if (isLearningPage) return null;

  return (
    <header className="bg-white border-b border-[#e5e5e5] sticky top-0 z-50">
      <nav className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to={logoHref} className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-[#0056d2] rounded-sm flex items-center justify-center">
            <span className="text-white font-black text-lg leading-none">L</span>
          </div>
          <span className="hidden sm:block text-xl font-bold text-[#1a1a1a] tracking-tight">
            LearnSphere
          </span>
        </Link>

        {/* Explore dropdown */}
        <div className="relative hidden md:block">
          <button
            type="button"
            onClick={() => setExploreOpen(!exploreOpen)}
            className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-[#1a1a1a] hover:bg-[#f5f7f8] rounded transition"
          >
            Explore
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {exploreOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setExploreOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-[#e5e5e5] rounded shadow-xl z-50 py-2">
                {['Web Development', 'Programming', 'Databases', 'Data Structures', 'Tools'].map((cat) => (
                  <Link
                    key={cat}
                    to={`/courses?category=${encodeURIComponent(cat)}`}
                    onClick={() => setExploreOpen(false)}
                    className="block px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#f5f7f8] transition"
                  >
                    {cat}
                  </Link>
                ))}
                <div className="border-t border-[#e5e5e5] mt-1 pt-1">
                  <Link
                    to="/courses"
                    onClick={() => setExploreOpen(false)}
                    className="block px-4 py-2.5 text-sm font-bold text-[#0056d2] hover:bg-[#f5f7f8]"
                  >
                    Browse all courses →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:block">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636363]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="What do you want to learn?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#f5f7f8] border border-transparent rounded-full text-sm text-[#1a1a1a] placeholder-[#636363] focus:outline-none focus:bg-white focus:border-[#0056d2] transition"
            />
          </div>
        </form>

        {/* Right nav */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          {user?.role === 'STUDENT' && (
            <>
              <Link to="/courses" className="hidden lg:block px-3 py-2 text-sm font-semibold text-[#1a1a1a] hover:text-[#0056d2] transition">
                Explore Courses
              </Link>
              <Link to="/dashboard?tab=mylearning" className="hidden lg:block px-3 py-2 text-sm font-semibold text-[#1a1a1a] hover:text-[#0056d2] transition">
                My Learning
              </Link>
              <Link to="/dashboard?tab=certificates" className="hidden xl:block px-3 py-2 text-sm font-semibold text-[#1a1a1a] hover:text-[#0056d2] transition">
                Certificates
              </Link>
            </>
          )}

          {user?.role === 'INSTRUCTOR' && (
            <Link to="/instructor" className="hidden md:block px-3 py-2 text-sm font-semibold text-[#1a1a1a] hover:text-[#0056d2]">
              Instructor Dashboard
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="hidden md:block px-3 py-2 text-sm font-semibold text-[#1a1a1a] hover:text-[#0056d2]">
              Admin
            </Link>
          )}

          {!user && (
            <>
              <Link to="/login" className="px-3 py-2 text-sm font-semibold text-[#0056d2] hover:underline">
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-bold text-white bg-[#0056d2] rounded hover:bg-[#004bb5] transition"
              >
                Join for Free
              </Link>
            </>
          )}

          {user && <StudentNotificationCenter />}

          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded hover:bg-[#f5f7f8] transition"
              >
                <div className="w-8 h-8 rounded-full bg-[#0056d2] text-white flex items-center justify-center text-xs font-bold">
                  {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#e5e5e5] rounded shadow-xl z-50 py-1">
                    <div className="px-4 py-3 border-b border-[#e5e5e5]">
                      <p className="text-sm font-bold text-[#1a1a1a] truncate">{user.fullName}</p>
                      <p className="text-xs text-[#636363] truncate">{user.email}</p>
                    </div>

                    {user.role === 'STUDENT' && (
                      <>
                        <Link to="/dashboard?tab=mylearning" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#f5f7f8]">
                          My Learning
                        </Link>
                        <Link to="/dashboard?tab=certificates" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#f5f7f8]">
                          My Certificates
                        </Link>
                        <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#f5f7f8]">
                          Profile
                        </Link>
                      </>
                    )}

                    {user.role === 'INSTRUCTOR' && (
                      <Link to="/instructor" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#f5f7f8]">
                        Instructor Hub
                      </Link>
                    )}

                    {user.role === 'ADMIN' && (
                      <Link to="/admin" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-[#1a1a1a] hover:bg-[#f5f7f8]">
                        Admin Hub
                      </Link>
                    )}

                    <div className="border-t border-[#e5e5e5] mt-1">
                      <button
                        type="button"
                        onClick={() => { logout(); setDropdownOpen(false); }}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default CourseraNavbar;
