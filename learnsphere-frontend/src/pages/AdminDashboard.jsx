import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get('tab') || 'dashboard';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // 1. Dashboard data
  const [dashboardData, setDashboardData] = useState(null);

  // 2. Users data
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // 3. Courses data
  const [courses, setCourses] = useState([]);
  const [courseStatusFilter, setCourseStatusFilter] = useState('ALL');
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({ open: false, courseId: null, reason: '' });

  // 4. Categories data
  const [categories, setCategories] = useState([]);
  const [categoryModal, setCategoryModal] = useState({ open: false, editingCat: null, name: '', description: '', icon: '📚', active: true });

  // 5. Enrollments data
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentSearch, setEnrollmentSearch] = useState('');

  // 6. Certificates data
  const [certificates, setCertificates] = useState([]);
  const [certSearch, setCertSearch] = useState('');
  const [previewCert, setPreviewCert] = useState(null);

  // 7. Reviews data
  const [reviews, setReviews] = useState([]);
  const [reviewSearch, setReviewSearch] = useState('');

  // 8. Notifications & Announcements
  const [notifications, setNotifications] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', targetAudience: 'ALL' });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // 9. Analytics data
  const [analytics, setAnalytics] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      setDashboardData(res.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/admin/courses');
      setCourses(res.data);
    } catch (err) {
      console.error("Failed to load courses", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const res = await api.get('/admin/enrollments');
      setEnrollments(res.data);
    } catch (err) {
      console.error("Failed to load enrollments", err);
    }
  };

  const fetchCertificates = async () => {
    try {
      const res = await api.get('/admin/certificates');
      setCertificates(res.data);
    } catch (err) {
      console.error("Failed to load certificates", err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get('/admin/reviews');
      setReviews(res.data);
    } catch (err) {
      console.error("Failed to load reviews", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/admin/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error("Failed to load analytics", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'courses') fetchCourses();
    else if (activeTab === 'categories') fetchCategories();
    else if (activeTab === 'enrollments') fetchEnrollments();
    else if (activeTab === 'certificates') fetchCertificates();
    else if (activeTab === 'reviews') fetchReviews();
    else if (activeTab === 'notifications') fetchNotifications();
    else if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab]);

  // Actions: User Management
  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/toggle-status`);
      showToast(res.data.message);
      await fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update user status");
    }
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.put(`/admin/users/${editingUser.id}`, editingUser);
      showToast("User details saved successfully!");
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update user");
    }
  };

  // Actions: Course Management
  const handleUpdateCourseStatus = async (courseId, status, reason = '') => {
    try {
      const res = await api.patch(`/admin/courses/${courseId}/status`, { status, reason });
      showToast(res.data.message);
      setRejectionModal({ open: false, courseId: null, reason: '' });
      await fetchCourses();
      await fetchDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update course status");
    }
  };

  const handleSaveCourseEdit = async (e) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      await api.put(`/admin/courses/${editingCourse.id}`, editingCourse);
      showToast("Course details updated successfully!");
      setEditingCourse(null);
      await fetchCourses();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update course");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to permanently delete this course and all its modules/quizzes?")) return;
    try {
      const res = await api.delete(`/admin/courses/${courseId}`);
      showToast(res.data.message);
      await fetchCourses();
      await fetchDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete course");
    }
  };

  // Actions: Category Management
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (categoryModal.editingCat) {
        await api.put(`/admin/categories/${categoryModal.editingCat.id}`, {
          name: categoryModal.name,
          description: categoryModal.description,
          icon: categoryModal.icon,
          active: categoryModal.active
        });
        showToast("Category updated successfully!");
      } else {
        await api.post('/admin/categories', {
          name: categoryModal.name,
          description: categoryModal.description,
          icon: categoryModal.icon,
          active: categoryModal.active
        });
        showToast("New category created successfully!");
      }
      setCategoryModal({ open: false, editingCat: null, name: '', description: '', icon: '📚', active: true });
      await fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save category");
    }
  };

  const handleToggleCategoryStatus = async (catId) => {
    try {
      await api.patch(`/admin/categories/${catId}/toggle-status`);
      showToast("Category status toggled");
      await fetchCategories();
    } catch (err) {
      showToast("Failed to toggle category");
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await api.delete(`/admin/categories/${catId}`);
      showToast("Category deleted");
      await fetchCategories();
    } catch (err) {
      showToast("Failed to delete category");
    }
  };

  // Actions: Certificate Management
  const handleToggleCertificate = async (certId) => {
    try {
      const res = await api.patch(`/admin/certificates/${certId}/toggle-status`);
      showToast(res.data.message);
      await fetchCertificates();
    } catch (err) {
      showToast("Failed to update certificate");
    }
  };

  // Actions: Review Moderation
  const handleDeleteReview = async (revId) => {
    if (!window.confirm("Delete this review as spam/inappropriate?")) return;
    try {
      const res = await api.delete(`/admin/reviews/${revId}`);
      showToast(res.data.message);
      await fetchReviews();
    } catch (err) {
      showToast("Failed to delete review");
    }
  };

  // Actions: Broadcast Announcement
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!announcementForm.message.trim()) {
      showToast("Please enter announcement message");
      return;
    }
    try {
      setIsBroadcasting(true);
      const res = await api.post('/admin/announcements/broadcast', announcementForm);
      showToast(res.data.message);
      setAnnouncementForm({ title: '', message: '', targetAudience: 'ALL' });
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to broadcast announcement");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'categories', label: 'Categories', icon: '🗂️' },
    { id: 'enrollments', label: 'Enrollments', icon: '🎓' },
    { id: 'certificates', label: 'Certificates', icon: '🏆' },
    { id: 'reviews', label: 'Reviews & Reports', icon: '⭐' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'analytics', label: 'Platform Analytics', icon: '📈' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)] -mt-6 mx-[-2rem] bg-gray-50 text-gray-800">
      {toastMsg && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center space-x-2 text-xs border border-gray-700">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
            ⚡
          </div>
          <div>
            <h2 className="text-sm font-black text-white leading-tight">Admin Control</h2>
            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">LearnSphere Master</p>
          </div>
        </div>

        <div className="p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 px-5 pt-4">
          Platform Management
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.id === 'courses' && dashboardData?.stats?.pendingCourses > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-amber-500 text-gray-950 font-black">
                    {dashboardData.stats.pendingCourses}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800/80 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-xl text-xs font-bold transition border border-slate-700/50"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        
        {/* ========================================================= */}
        {/* 1. DASHBOARD OVERVIEW TAB                                  */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-950/80 px-3 py-1 rounded-full border border-purple-800/60">
                  Platform Administrator
                </span>
                <h1 className="text-2xl sm:text-3xl font-black mt-2">Welcome to Admin Hub</h1>
                <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                  Real-time command center for LearnSphere. Monitor user growth, manage instructors & courses, verify credentials, and oversee system health.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2"
                >
                  <span>📢 Broadcast Announcement</span>
                </button>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center space-x-2"
                >
                  <span>📚 Manage Courses</span>
                </button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">Total Students</span>
                  <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">👨‍🎓</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900">{dashboardData?.stats?.totalStudents || 0}</div>
                <p className="text-[10px] text-green-600 font-bold mt-1">● Active Learners</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">Total Instructors</span>
                  <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">👨‍🏫</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900">{dashboardData?.stats?.totalInstructors || 0}</div>
                <p className="text-[10px] text-purple-600 font-bold mt-1">● Certified Educators</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">Total Courses</span>
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">📚</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900">{dashboardData?.stats?.totalCourses || 0}</div>
                <div className="flex items-center space-x-2 text-[10px] font-bold mt-1">
                  <span className="text-emerald-600">{dashboardData?.stats?.publishedCourses || 0} Published</span>
                  {dashboardData?.stats?.pendingCourses > 0 && (
                    <span className="text-amber-600 font-black">• {dashboardData.stats.pendingCourses} Pending</span>
                  )}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">Total Enrollments</span>
                  <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">🎓</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900">{dashboardData?.stats?.totalEnrollments || 0}</div>
                <p className="text-[10px] text-indigo-600 font-bold mt-1">🏆 {dashboardData?.stats?.certificatesIssued || 0} Certs Issued</p>
              </div>
            </div>

            {/* Pending Courses Alert if any */}
            {dashboardData?.stats?.pendingCourses > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">Action Required: Course Submissions Pending Approval</h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      There are {dashboardData.stats.pendingCourses} courses submitted by instructors waiting for quality review and publication approval.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCourseStatusFilter('PENDING_APPROVAL');
                    setActiveTab('courses');
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow transition shrink-0"
                >
                  Review Courses →
                </button>
              </div>
            )}

            {/* Popular Categories & Registration Feeds */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Category Popularity Bar */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">Course Categories</h3>
                  <button onClick={() => setActiveTab('categories')} className="text-xs text-blue-600 font-bold hover:underline">
                    Manage →
                  </button>
                </div>

                <div className="space-y-3">
                  {dashboardData?.categoryStats?.map((cat, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-gray-700">
                        <span>{cat.category}</span>
                        <span className="font-mono text-gray-500">{cat.count} courses ({cat.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent User Registrations */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">Recent Registrations</h3>
                  <button onClick={() => setActiveTab('users')} className="text-xs text-blue-600 font-bold hover:underline">
                    View All →
                  </button>
                </div>

                <div className="divide-y divide-gray-100 space-y-2">
                  {dashboardData?.recentUsers?.map(u => (
                    <div key={u.id} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-gray-900">{u.fullName}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{u.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                        u.role === 'INSTRUCTOR' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Enrollments */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">Live Enrollments</h3>
                  <button onClick={() => setActiveTab('enrollments')} className="text-xs text-blue-600 font-bold hover:underline">
                    Monitor →
                  </button>
                </div>

                <div className="divide-y divide-gray-100 space-y-2">
                  {dashboardData?.recentEnrollments?.map(e => (
                    <div key={e.id} className="pt-2 space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-gray-800">
                        <span className="truncate pr-2">{e.studentName}</span>
                        <span className="text-emerald-600 shrink-0 font-mono">{e.progressPercentage}%</span>
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{e.courseTitle}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. USERS MANAGEMENT TAB                                   */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">User Management</h1>
                <p className="text-xs text-gray-500 mt-0.5">Manage students, instructors, account authorizations and statuses.</p>
              </div>

              {/* Sub-Filters */}
              <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl border border-gray-200 shadow-sm text-xs font-bold">
                {['ALL', 'STUDENT', 'INSTRUCTOR'].map(r => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-xl transition ${
                      userRoleFilter === r ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {r === 'ALL' ? 'All Users' : r === 'STUDENT' ? 'Students' : 'Instructors'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Box */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name, email, skills or city..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
              />
              <span className="text-xs font-bold text-gray-500 shrink-0">
                {users.filter(u => userRoleFilter === 'ALL' || u.role === userRoleFilter).length} Accounts
              </span>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Courses / Enrollments</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Registered</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users
                      .filter(u => (userRoleFilter === 'ALL' || u.role === userRoleFilter))
                      .filter(u => !userSearch || (
                        u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                        (u.location && u.location.toLowerCase().includes(userSearch.toLowerCase()))
                      ))
                      .map(u => (
                        <tr key={u.id} className="hover:bg-gray-50/60 transition">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                                {u.fullName ? u.fullName.charAt(0) : 'U'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{u.fullName}</p>
                                <p className="text-[10px] text-gray-500 font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${
                              u.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-200' :
                              u.role === 'INSTRUCTOR' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-gray-700">
                            {u.role === 'INSTRUCTOR' ? `${u.coursesCount} Courses` : `${u.enrollmentsCount} Enrolled`}
                          </td>
                          <td className="p-4 text-gray-600">
                            {u.location || '—'}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {u.active ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500 font-mono text-[10px]">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition"
                            >
                              View
                            </button>
                            <button
                              onClick={() => setEditingUser(u)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition"
                            >
                              Edit
                            </button>
                            {u.role !== 'ADMIN' && (
                              <button
                                onClick={() => handleToggleUserStatus(u.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                  u.active
                                    ? 'bg-red-50 hover:bg-red-100 text-red-700'
                                    : 'bg-green-50 hover:bg-green-100 text-green-700'
                                }`}
                              >
                                {u.active ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. COURSES MANAGEMENT TAB                                 */}
        {/* ========================================================= */}
        {activeTab === 'courses' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">Course Management</h1>
                <p className="text-xs text-gray-500 mt-0.5">Review, approve, publish, edit or moderate courses across all instructors.</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl border border-gray-200 shadow-sm text-xs font-bold">
                {['ALL', 'PENDING_APPROVAL', 'PUBLISHED', 'DRAFT', 'REJECTED'].map(s => (
                  <button
                    key={s}
                    onClick={() => setCourseStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-xl transition ${
                      courseStatusFilter === s ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {s === 'ALL' ? 'All' : s === 'PENDING_APPROVAL' ? 'Pending Approval' : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Box */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search courses by title, instructor, or category..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
              />
              <span className="text-xs font-bold text-gray-500 shrink-0">
                {courses.filter(c => courseStatusFilter === 'ALL' || c.status === courseStatusFilter).length} Courses
              </span>
            </div>

            {/* Courses Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Course</th>
                      <th className="p-4">Instructor</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Enrolled Students</th>
                      <th className="p-4">Rating</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {courses
                      .filter(c => courseStatusFilter === 'ALL' || c.status === courseStatusFilter)
                      .filter(c => !courseSearch || (
                        c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
                        (c.instructor?.fullName && c.instructor.fullName.toLowerCase().includes(courseSearch.toLowerCase())) ||
                        (c.category && c.category.toLowerCase().includes(courseSearch.toLowerCase()))
                      ))
                      .map(c => (
                        <tr key={c.id} className="hover:bg-gray-50/60 transition">
                          <td className="p-4">
                            <p className="font-bold text-gray-900">{c.title}</p>
                            <span className="text-[10px] font-mono text-gray-500 uppercase">{c.difficulty}</span>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-gray-800">{c.instructor?.fullName || 'Instructor'}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{c.instructor?.email}</p>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-gray-100 rounded-md text-[10px] font-bold text-gray-700">
                              {c.category}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-gray-800">
                            {c.studentsCount} Students
                          </td>
                          <td className="p-4">
                            <span className="text-amber-500 font-bold">★ {c.rating}</span>
                            <span className="text-[10px] text-gray-500 ml-1 font-mono">({c.reviewsCount})</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${
                              c.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' :
                              c.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              c.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-gray-100 text-gray-700 border-gray-200'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {c.status === 'PENDING_APPROVAL' ? (
                              <>
                                <button
                                  onClick={() => handleUpdateCourseStatus(c.id, 'PUBLISHED')}
                                  className="px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => setRejectionModal({ open: true, courseId: c.id, reason: '' })}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition"
                                >
                                  ✕ Reject
                                </button>
                              </>
                            ) : c.status === 'PUBLISHED' ? (
                              <button
                                onClick={() => handleUpdateCourseStatus(c.id, 'UNPUBLISHED')}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition"
                              >
                                Unpublish
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateCourseStatus(c.id, 'PUBLISHED')}
                                className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-800 rounded-lg text-xs font-bold transition"
                              >
                                Publish
                              </button>
                            )}

                            <button
                              onClick={() => setEditingCourse(c)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c.id)}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-700 rounded-lg text-xs font-bold transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. CATEGORIES TAB                                         */}
        {/* ========================================================= */}
        {activeTab === 'categories' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">Course Categories</h1>
                <p className="text-xs text-gray-500 mt-0.5">Organize course topics, taxonomy, and curriculum domains.</p>
              </div>

              <button
                onClick={() => setCategoryModal({ open: true, editingCat: null, name: '', description: '', icon: '📚', active: true })}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center space-x-2"
              >
                <span>+ Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{cat.icon}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      cat.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {cat.active ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-gray-900">{cat.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description || 'No description provided.'}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-600 font-mono">{cat.coursesCount} Courses</span>
                    <div className="space-x-2">
                      <button
                        onClick={() => setCategoryModal({ open: true, editingCat: cat, name: cat.name, description: cat.description || '', icon: cat.icon || '📚', active: cat.active })}
                        className="text-blue-600 hover:underline font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleCategoryStatus(cat.id)}
                        className="text-gray-500 hover:text-gray-800 font-bold"
                      >
                        {cat.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-red-500 hover:underline font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. ENROLLMENTS MONITOR TAB                                */}
        {/* ========================================================= */}
        {activeTab === 'enrollments' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">Platform Enrollments</h1>
                <p className="text-xs text-gray-500 mt-0.5">Monitor all student course enrollments and real-time learning progress.</p>
              </div>
            </div>

            {/* Search Box */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <input
                type="text"
                value={enrollmentSearch}
                onChange={(e) => setEnrollmentSearch(e.target.value)}
                placeholder="Search enrollments by student name, email, course title, or instructor..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
              />
              <span className="text-xs font-bold text-gray-500 shrink-0 font-mono">
                {enrollments.length} Total Records
              </span>
            </div>

            {/* Enrollments Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Student</th>
                      <th className="p-4">Course</th>
                      <th className="p-4">Instructor</th>
                      <th className="p-4">Progress</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Enrolled Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {enrollments
                      .filter(e => !enrollmentSearch || (
                        e.studentName.toLowerCase().includes(enrollmentSearch.toLowerCase()) ||
                        e.studentEmail.toLowerCase().includes(enrollmentSearch.toLowerCase()) ||
                        e.courseTitle.toLowerCase().includes(enrollmentSearch.toLowerCase()) ||
                        e.instructorName.toLowerCase().includes(enrollmentSearch.toLowerCase())
                      ))
                      .map(e => (
                        <tr key={e.id} className="hover:bg-gray-50/60 transition">
                          <td className="p-4">
                            <p className="font-bold text-gray-900">{e.studentName}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{e.studentEmail}</p>
                          </td>
                          <td className="p-4 font-bold text-gray-800">{e.courseTitle}</td>
                          <td className="p-4 text-gray-600">{e.instructorName}</td>
                          <td className="p-4">
                            <div className="w-28 space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-gray-700">
                                <span>{e.progressPercentage}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-1.5 rounded-full"
                                  style={{ width: `${e.progressPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              e.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                              e.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {e.status}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500 font-mono text-[10px]">
                            {e.enrollmentDate ? new Date(e.enrollmentDate).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. CERTIFICATES REGISTRY TAB                              */}
        {/* ========================================================= */}
        {activeTab === 'certificates' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">Certificates Registry</h1>
                <p className="text-xs text-gray-500 mt-0.5">Verify and manage cryptographic graduation credentials issued by LearnSphere.</p>
              </div>
            </div>

            {/* Search Box */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <input
                type="text"
                value={certSearch}
                onChange={(e) => setCertSearch(e.target.value)}
                placeholder="Search certificates by ID, student name, or course..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
              />
              <span className="text-xs font-bold text-gray-500 shrink-0 font-mono">
                {certificates.length} Issued
              </span>
            </div>

            {/* Certificates Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Certificate ID</th>
                      <th className="p-4">Student</th>
                      <th className="p-4">Course</th>
                      <th className="p-4">Instructor</th>
                      <th className="p-4">Issue Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {certificates
                      .filter(c => !certSearch || (
                        c.certificateId.toLowerCase().includes(certSearch.toLowerCase()) ||
                        c.studentName.toLowerCase().includes(certSearch.toLowerCase()) ||
                        c.courseTitle.toLowerCase().includes(certSearch.toLowerCase())
                      ))
                      .map(c => (
                        <tr key={c.id} className="hover:bg-gray-50/60 transition">
                          <td className="p-4 font-mono font-black text-purple-700">
                            {c.certificateId}
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-gray-900">{c.studentName}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{c.studentEmail}</p>
                          </td>
                          <td className="p-4 font-bold text-gray-800">{c.courseTitle}</td>
                          <td className="p-4 text-gray-600">{c.instructorName}</td>
                          <td className="p-4 text-gray-500 font-mono text-[10px]">
                            {c.issueDate ? new Date(c.issueDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => setPreviewCert(c)}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleToggleCertificate(c.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                                c.status === 'ACTIVE'
                                  ? 'bg-red-50 hover:bg-red-100 text-red-700'
                                  : 'bg-green-50 hover:bg-green-100 text-green-700'
                              }`}
                            >
                              {c.status === 'ACTIVE' ? 'Revoke' : 'Re-activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 7. REVIEWS & REPORTS TAB                                  */}
        {/* ========================================================= */}
        {activeTab === 'reviews' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900">Reviews & Moderation</h1>
                <p className="text-xs text-gray-500 mt-0.5">Moderate platform feedback, ratings, and inspect reported comments.</p>
              </div>
            </div>

            {/* Search Box */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between gap-4">
              <input
                type="text"
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                placeholder="Search reviews by student, course, or text..."
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
              />
              <span className="text-xs font-bold text-gray-500 shrink-0 font-mono">
                {reviews.length} Reviews
              </span>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews
                .filter(r => !reviewSearch || (
                  r.studentName.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                  r.courseTitle.toLowerCase().includes(reviewSearch.toLowerCase()) ||
                  (r.comment && r.comment.toLowerCase().includes(reviewSearch.toLowerCase()))
                ))
                .map(r => (
                  <div key={r.id} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-gray-900 text-xs">{r.studentName}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-xs font-bold text-purple-700">{r.courseTitle}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1 text-amber-500 text-xs font-bold">
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                          <span className="text-gray-400 text-[10px] ml-2 font-mono">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteReview(r.id)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold transition"
                      >
                        Delete Review
                      </button>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed font-normal bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                      "{r.comment || r.reviewText}"
                    </p>

                    {r.instructorReply && (
                      <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs">
                        <span className="font-bold text-blue-900 text-[10px] uppercase">Instructor Response:</span>
                        <p className="text-blue-800 mt-0.5">{r.instructorReply}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 8. NOTIFICATIONS & BROADCAST TAB                          */}
        {/* ========================================================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">Notifications & Platform Broadcasts</h1>
              <p className="text-xs text-gray-500 mt-0.5">Send platform-wide announcements or view system alerts.</p>
            </div>

            {/* Broadcast Box */}
            <form onSubmit={handleBroadcast} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center space-x-2">
                <span>📢 Send Platform-Wide Announcement</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Target Audience</label>
                <select
                  value={announcementForm.targetAudience}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-purple-500"
                >
                  <option value="ALL">All Users (Students + Instructors)</option>
                  <option value="STUDENTS">Students Only</option>
                  <option value="INSTRUCTORS">Instructors Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Announcement Title</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Scheduled System Maintenance / New Hackathon Starting"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Write message to broadcast..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-lg transition disabled:opacity-40"
                >
                  {isBroadcasting ? 'Broadcasting...' : 'Broadcast to Users 🚀'}
                </button>
              </div>
            </form>

            {/* Admin Notifications Feed */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">Admin Activity Feed</h3>
              {notifications.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400 text-xs italic">
                  No notifications recorded.
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-start justify-between text-xs">
                    <div>
                      <p className="font-black text-gray-900">{n.title}</p>
                      <p className="text-gray-600 mt-0.5">{n.message}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono shrink-0 ml-4">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 9. PLATFORM ANALYTICS TAB                                 */}
        {/* ========================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">Platform Analytics</h1>
              <p className="text-xs text-gray-500 mt-0.5">Data-driven performance metrics, completion rates, and learning outcomes.</p>
            </div>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Course Completion Rate</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{analytics?.completionRate || 0}%</p>
                <p className="text-[10px] text-gray-400 mt-1 font-mono">Platform average</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Avg Quiz Score</p>
                <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">{analytics?.avgQuizScore || 0}%</p>
                <p className="text-[10px] text-gray-400 mt-1 font-mono">{analytics?.totalQuizzesTaken || 0} attempts</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Certificates Awarded</p>
                <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">{analytics?.certificatesCount || 0}</p>
                <p className="text-[10px] text-gray-400 mt-1 font-mono">Verified graduates</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Graded Practical Tasks</p>
                <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">{analytics?.gradedAssignmentsCount || 0}</p>
                <p className="text-[10px] text-gray-400 mt-1 font-mono">Hands-on reviews</p>
              </div>
            </div>

            {/* Leaderboard & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Top Instructors */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center space-x-2">
                  <span>🏆 Top Active Instructors</span>
                </h3>

                <div className="divide-y divide-gray-100 space-y-2">
                  {analytics?.topInstructors?.map((inst, idx) => (
                    <div key={inst.id} className="pt-2 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-gray-900">{inst.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{inst.coursesCount} Active Courses</p>
                        </div>
                      </div>
                      <span className="font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg font-mono">
                        {inst.studentsCount} Students
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center space-x-2">
                  <span>📊 Category Distribution</span>
                </h3>

                <div className="space-y-3">
                  {analytics?.categoriesBreakdown?.map((cat, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-700">
                      <span>{cat.category}</span>
                      <span className="text-purple-600 font-mono">{cat.courses} Courses</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 10. ADMIN PROFILE TAB                                     */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center mx-auto shadow-lg">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">{user?.fullName || 'Administrator'}</h2>
                <p className="text-xs text-gray-500 font-mono">{user?.email}</p>
                <span className="mt-2 inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase border border-red-200">
                  Master Platform Administrator
                </span>
              </div>

              <div className="pt-6 border-t border-gray-100 text-left space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Role:</span>
                  <span className="font-bold text-gray-900">ADMIN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Security Clearance:</span>
                  <span className="font-bold text-green-600">Full Access (Root)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Platform System:</span>
                  <span className="font-bold text-gray-900">LearnSphere v2.6 Enterprise</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 11. PLATFORM SETTINGS TAB                                 */}
        {/* ========================================================= */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
              <h2 className="text-base font-black text-gray-900 uppercase tracking-wider">System Settings & Platform Rules</h2>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-gray-900">Public User Registrations</p>
                    <p className="text-[10px] text-gray-500">Allow new students and instructors to register publicly</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 font-black rounded-lg text-[10px] uppercase">Enabled</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-gray-900">Instructor Course Submission Review</p>
                    <p className="text-[10px] text-gray-500">Require admin approval before new courses go live</p>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 font-black rounded-lg text-[10px] uppercase">Active</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-gray-900">Automated Graduation Certificates</p>
                    <p className="text-[10px] text-gray-500">Generate unique certificate IDs upon 100% course completion</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 font-black rounded-lg text-[10px] uppercase">Enabled</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-gray-900">System Maintenance Mode</p>
                    <p className="text-[10px] text-gray-500">Lock platform for database maintenance</p>
                  </div>
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 font-black rounded-lg text-[10px] uppercase">Disabled</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* 1. Category Modal */}
      {categoryModal.open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-base font-black text-gray-900">
              {categoryModal.editingCat ? 'Edit Category' : 'Create Course Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryModal.name}
                  onChange={(e) => setCategoryModal(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Artificial Intelligence"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Icon Emoji</label>
                <input
                  type="text"
                  value={categoryModal.icon}
                  onChange={(e) => setCategoryModal(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={categoryModal.description}
                  onChange={(e) => setCategoryModal(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCategoryModal({ open: false, editingCat: null, name: '', description: '', icon: '📚', active: true })}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black shadow"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Course Rejection Modal */}
      {rejectionModal.open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-base font-black text-red-900">Reject Course Submission</h3>
            <p className="text-xs text-gray-500">Provide constructive feedback explaining why this course was returned for revisions.</p>

            <textarea
              rows={4}
              value={rejectionModal.reason}
              onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Please add more module practical tasks or adjust the video resolution..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectionModal({ open: false, courseId: null, reason: '' })}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateCourseStatus(rejectionModal.courseId, 'REJECTED', rejectionModal.reason)}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black shadow"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. User Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl space-y-4">
            <h3 className="text-base font-black text-gray-900">Edit User Details</h3>
            <form onSubmit={handleSaveUserEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.fullName || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-1">Location</label>
                <input
                  type="text"
                  value={editingUser.location || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-1">Skills</label>
                <input
                  type="text"
                  value={editingUser.skills || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Certificate Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full p-8 rounded-3xl shadow-2xl space-y-6 text-center border-4 border-amber-400">
            <div className="text-4xl">🏆</div>
            <h2 className="text-xl font-black text-gray-900 tracking-wider uppercase">Official LearnSphere Credential</h2>
            <p className="text-xs text-gray-500">This verifies that the following certificate was issued by LearnSphere LMS:</p>

            <div className="bg-amber-50/60 p-6 rounded-2xl border border-amber-200 space-y-2 text-xs">
              <p className="font-mono text-purple-700 font-black text-base">{previewCert.certificateId}</p>
              <p className="text-base font-bold text-gray-900">{previewCert.studentName}</p>
              <p className="text-gray-600">has successfully completed</p>
              <p className="text-sm font-black text-indigo-900">{previewCert.courseTitle}</p>
              <p className="text-[10px] text-gray-500 font-mono mt-2">
                Instructor: {previewCert.instructorName} • Issued: {new Date(previewCert.issueDate).toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={() => setPreviewCert(null)}
              className="px-6 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold"
            >
              Close Verification
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
