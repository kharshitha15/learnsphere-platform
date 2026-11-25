import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import CourseCard from '../components/ui/CourseCard';
import { courseImageMap, coursePreviewVideoMap } from '../constants/courseAssets';

const CourseMarketplace = () => {
  const [courses, setCourses] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [minRating, setMinRating] = useState('ALL');
  const [sortBy, setSortBy] = useState('POPULAR');
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  
  // Preview Drawer Modal
  const [previewCourseId, setPreviewCourseId] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState('overview'); // overview, syllabus, reviews
  const [expandedModules, setExpandedModules] = useState({});

  const [toastMsg, setToastMsg] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const fetchCoursesAndWishlist = async () => {
    try {
      setLoading(true);
      const endpoint = user ? '/student/explore' : '/courses';
      const response = await api.get(endpoint);
      const courseList = response.data || [];
      setCourses(courseList);

      if (user && user.role === 'STUDENT') {
        try {
          const wRes = await api.get('/student/wishlist');
          const ids = new Set((wRes.data || []).map(item => item.courseId || item.id));
          setWishlistIds(ids);
        } catch (e) {
          console.error("Failed to load wishlist", e);
        }
      }
    } catch (error) {
      console.error("Error fetching courses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'INSTRUCTOR') {
      navigate('/instructor');
      return;
    }
    fetchCoursesAndWishlist();
  }, [user, navigate]);

  const handleToggleWishlist = async (e, courseId) => {
    if (e) e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post('/student/wishlist/' + courseId);
      const next = new Set(wishlistIds);
      if (res.data.wishlisted || res.data.isWishlisted) {
        next.add(courseId);
        showToast('Added to your Wishlist ❤️');
      } else {
        next.delete(courseId);
        showToast('Removed from your Wishlist');
      }
      setWishlistIds(next);
    } catch (err) {
      showToast('Could not update wishlist');
    }
  };

  const handleEnroll = async (courseId, e) => {
    if (e) e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setEnrolling(courseId);
    try {
      // Call enrollment API
      const res = await api.post('/enrollments/enroll/' + courseId);
      
      // Update local state immediately so user sees Enrolled status in real-time
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isEnrolled: true, progressPercentage: res.data?.progressPercentage || 0 } : c));
      if (previewData && (previewData.id === courseId || previewData.course?.id === courseId)) {
        setPreviewData(prev => ({ ...prev, isEnrolled: true }));
      }

      if (res.data?.alreadyEnrolled) {
        showToast('You are already enrolled! Opening course classroom...');
        setTimeout(() => navigate('/learning/' + courseId), 800);
        return;
      }

      // Fire festive celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast('🎉 Successfully enrolled! Classroom workspace is ready.');
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to enroll';
      // If already enrolled, still update state to enrolled
      if (errMsg.toLowerCase().includes('already')) {
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isEnrolled: true } : c));
        if (previewData) setPreviewData(prev => ({ ...prev, isEnrolled: true }));
        showToast('You are already enrolled! Opening workspace...');
        setTimeout(() => navigate('/learning/' + courseId), 1000);
      } else {
        showToast(errMsg);
      }
    } finally {
      setEnrolling(null);
    }
  };

  const openPreviewModal = async (courseId, e) => {
    if (e) e.stopPropagation();
    setPreviewCourseId(courseId);
    setLoadingPreview(true);
    setActivePreviewTab('overview');
    try {
      const res = await api.get('/courses/' + courseId + '/preview');
      const data = res.data || {};
      setPreviewData(data);

      // Auto-expand first module
      if (data.curriculum && data.curriculum.length > 0) {
        setExpandedModules({ [data.curriculum[0].id]: true });
      }
    } catch (err) {
      console.error("Failed to load course preview", err);
      // Fallback preview from current course list
      const fallback = courses.find(c => c.id === courseId);
      if (fallback) {
        setPreviewData({
          id: fallback.id,
          title: fallback.title,
          description: fallback.description,
          category: fallback.category,
          difficulty: fallback.difficulty || fallback.level || 'Beginner',
          instructorName: fallback.instructorName || 'Senior Instructor',
          rating: fallback.rating || 4.9,
          totalReviews: fallback.reviewsCount || 36,
          enrolledStudentsCount: fallback.learnersCount || 1200,
          curriculum: [],
          ratingDistribution: [
            { stars: 5, percentage: 85, count: 30 },
            { stars: 4, percentage: 15, count: 6 },
            { stars: 3, percentage: 0, count: 0 },
            { stars: 2, percentage: 0, count: 0 },
            { stars: 1, percentage: 0, count: 0 }
          ]
        });
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreviewModal = () => {
    setPreviewCourseId(null);
    setPreviewData(null);
  };

  const toggleModuleAccordion = (modId) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const categories = [
    'ALL',
    'Web Development',
    'Programming',
    'Databases',
    'Tools',
    'Data Structures'
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course.instructorName && course.instructorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course.instructor?.fullName && course.instructor.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || course.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesDifficulty = selectedDifficulty === 'ALL' || (course.level || course.difficulty)?.toUpperCase() === selectedDifficulty.toUpperCase();
    
    let matchesRating = true;
    if (minRating !== 'ALL') {
      const r = course.rating || 4.5;
      matchesRating = r >= parseFloat(minRating);
    }

    const matchesWishlist = !showWishlistOnly || wishlistIds.has(course.id);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesRating && matchesWishlist;
  }).sort((a, b) => {
    if (sortBy === 'RATING') return (b.rating || 4.5) - (a.rating || 4.5);
    if (sortBy === 'NEWEST') return (b.id || 0) - (a.id || 0);
    return (b.learnersCount || b.enrolledStudentsCount || b.totalEnrollments || 0) - (a.learnersCount || a.enrolledStudentsCount || a.totalEnrollments || 0);
  });

  // Modal active course properties helper
  const modalCourseId = previewData?.id || previewData?.course?.id || previewCourseId;
  const modalTitle = previewData?.title || previewData?.course?.title || 'Comprehensive Course';
  const modalDesc = previewData?.description || previewData?.course?.description || 'Learn and master industry skills with real-world hands-on projects and quizzes.';
  const modalCategory = previewData?.category || previewData?.course?.category || 'Development';
  const modalLevel = previewData?.level || previewData?.difficulty || previewData?.course?.difficulty || 'All Levels';
  const modalInstructor = previewData?.instructorName || previewData?.instructor?.fullName || previewData?.course?.instructor?.fullName || 'Senior Instructor';
  const modalInstructorBio = previewData?.instructor?.bio || previewData?.instructorBio || 'Experienced software architect and tech educator on LearnSphere.';
  const modalRating = previewData?.rating || previewData?.avgRating || 4.9;
  const modalReviewsCount = previewData?.totalReviews || previewData?.reviewsCount || 42;
  const modalStudents = previewData?.enrolledStudentsCount || previewData?.studentsCount || previewData?.learnersCount || 380;
  const modalLessonsCount = previewData?.totalLessons || previewData?.lessonsCount || (previewData?.curriculum?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)) || 12;
  const modalDurationHours = previewData?.totalDurationHours || previewData?.durationHours || 4;
  const modalCurriculum = previewData?.curriculum || [];
  const modalRatingDist = previewData?.ratingDistribution || [
    { stars: 5, percentage: 82, count: 28 },
    { stars: 4, percentage: 18, count: 6 },
    { stars: 3, percentage: 0, count: 0 },
    { stars: 2, percentage: 0, count: 0 },
    { stars: 1, percentage: 0, count: 0 }
  ];
  const modalReviews = previewData?.reviews || previewData?.recentReviews || [];
  
  // Find if modal course is enrolled
  const isModalEnrolled = previewData?.isEnrolled || courses.find(c => c.id === modalCourseId)?.isEnrolled;

  return (
    <div className="min-h-screen bg-[#f5f7f8] text-[#1a1a1a] font-sans pb-16">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0056d2] text-white px-5 py-3 rounded shadow-lg text-sm font-medium">
          {toastMsg}
        </div>
      )}

      <section className="bg-white border-b border-[#e5e5e5] pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a1a]">Explore courses</h1>
          <p className="mt-1 text-sm text-[#636363] max-w-2xl">
            Learn from industry experts with video lectures, readings, quizzes, and hands-on projects.
          </p>

          <div className="mt-6 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636363]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search courses, skills, or instructors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#f5f7f8] border border-[#e5e5e5] rounded text-sm focus:outline-none focus:border-[#0056d2] focus:bg-white"
              />
            </div>
            <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} className="border border-[#e5e5e5] rounded px-3 py-2.5 text-sm bg-white">
              <option value="ALL">All Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
            <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="border border-[#e5e5e5] rounded px-3 py-2.5 text-sm bg-white">
              <option value="ALL">All Ratings</option>
              <option value="4.5">4.5+ stars</option>
              <option value="4.0">4.0+ stars</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-[#e5e5e5] rounded px-3 py-2.5 text-sm bg-white">
              <option value="POPULAR">Most Popular</option>
              <option value="RATING">Highest Rated</option>
              <option value="NEWEST">Newest</option>
            </select>
          </div>

          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={'px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ' + (
                  selectedCategory === cat
                    ? 'bg-[#0056d2] text-white'
                    : 'bg-[#f5f7f8] text-[#636363] hover:bg-[#e8f0fe] border border-[#e5e5e5]'
                )}
              >
                {cat === 'ALL' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Course Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#0056d2]/20 border-t-[#0056d2] rounded-full animate-spin"></div>
            <p className="mt-4 text-[#636363] text-sm">Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#e5e5e5] rounded p-8 max-w-lg mx-auto">
            <h3 className="text-lg font-bold text-[#1a1a1a]">No courses found</h3>
            <p className="text-[#636363] text-sm mt-1">Try adjusting your filters or search terms.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedDifficulty('ALL');
                setMinRating('ALL');
                setShowWishlistOnly(false);
              }}
              className="mt-4 btn-c-primary text-sm"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCourses.map((course) => {
              const isWishlisted = wishlistIds.has(course.id);
              const isEnrolled = course.isEnrolled || (course.progressPercentage != null && course.progressPercentage > 0);
              return (
                <CourseCard
                  key={course.id}
                  course={{
                    ...course,
                    thumbnailUrl: course.thumbnailUrl || courseImageMap[course.title]
                  }}
                  onClick={openPreviewModal}
                  onEnroll={handleEnroll}
                  onWishlist={user?.role === 'STUDENT' ? handleToggleWishlist : null}
                  isWishlisted={isWishlisted}
                  isEnrolled={isEnrolled}
                  enrolling={enrolling}
                  showProgress
                />
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================== */}
      {/* UDEMY-STYLE COURSE PREVIEW MODAL */}
      {/* ========================================== */}
      {previewCourseId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          onClick={closePreviewModal}
        >
          <div
            className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                  Course Preview
                </span>
                <span className="text-slate-400 text-xs">• 100% Free Sample Available</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    closePreviewModal();
                    navigate('/courses/' + modalCourseId);
                  }}
                  className="px-3 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <span>🌟 Full Masterclass Page</span>
                  <span>→</span>
                </button>
                <button
                  onClick={closePreviewModal}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {loadingPreview ? (
              <div className="p-20 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400 text-xs">Loading course syllabus and media previews...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Course Banner Info */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-indigo-400 mb-1 uppercase tracking-wider">{modalCategory}</div>
                    <h2 className="text-2xl font-extrabold text-white leading-tight">
                      {modalTitle}
                    </h2>
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                      {modalDesc}
                    </p>

                    {/* Metadata Badges */}
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <div className="flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                        <span>★</span>
                        <span>{Number(modalRating).toFixed(1)}</span>
                        <span className="text-slate-400 font-normal">({modalReviewsCount} ratings)</span>
                      </div>
                      <div className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">
                        👥 {modalStudents} learners
                      </div>
                      <div className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">
                        🎓 {modalLevel}
                      </div>
                      <div className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">
                        ⏱️ {modalLessonsCount} Lessons ({modalDurationHours} hrs)
                      </div>
                    </div>
                  </div>

                  {/* Teaser Video Preview Box */}
                  <div className="w-full md:w-80 bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-inner">
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900 flex items-center justify-center">
                      <iframe
                        src={coursePreviewVideoMap[modalTitle] || "https://www.youtube.com/embed/9SGDpanrc8U"}
                        title="Course Teaser Preview"
                        className="w-full h-full object-cover"
                        allowFullScreen
                      />
                    </div>
                    <div className="mt-3">
                      {isModalEnrolled ? (
                        <button
                          onClick={() => {
                            closePreviewModal();
                            navigate('/learning/' + modalCourseId);
                          }}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
                        >
                          <span>✓ Resume Workspace</span>
                          <span>→</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnroll(modalCourseId)}
                          disabled={enrolling === modalCourseId}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
                        >
                          {enrolling === modalCourseId ? (
                            <span>Enrolling...</span>
                          ) : (
                            <span>⚡ Enroll Free Full Access</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs Nav */}
                <div className="border-b border-slate-800 flex items-center gap-6 text-sm font-semibold">
                  <button
                    onClick={() => setActivePreviewTab('overview')}
                    className={'pb-3 transition relative ' + (
                      activePreviewTab === 'overview' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    What You'll Learn
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('syllabus')}
                    className={'pb-3 transition relative ' + (
                      activePreviewTab === 'syllabus' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    Course Curriculum ({modalCurriculum.length} Modules)
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('reviews')}
                    className={'pb-3 transition relative ' + (
                      activePreviewTab === 'reviews' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'
                    )}
                  >
                    Ratings & Reviews
                  </button>
                </div>

                {/* Tab 1: Overview */}
                {activePreviewTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
                      <h4 className="text-sm font-bold text-white mb-3">Key Highlights & Learning Objectives</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Complete hands-on architectural blueprints and design patterns</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Interactive live coding sandbox with real-time test execution</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Industry-standard security, authentication, and database design</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Official verified LearnSphere graduation certificate upon completion</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-800/30 border border-slate-700/40 rounded-2xl p-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-lg font-bold text-white shadow">
                        {modalInstructor.charAt(0) || 'I'}
                      </div>
                      <div>
                        <div className="text-xs text-indigo-400 font-semibold">Lead Instructor</div>
                        <div className="text-sm font-bold text-white">{modalInstructor}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{modalInstructorBio}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Syllabus Accordion */}
                {activePreviewTab === 'syllabus' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs text-slate-400 pb-2">
                      <span>{modalCurriculum.length} Modules • {modalLessonsCount} Lessons</span>
                      <button
                        onClick={() => {
                          const allOpen = {};
                          modalCurriculum.forEach(m => allOpen[m.id] = true);
                          setExpandedModules(allOpen);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        Expand All Modules
                      </button>
                    </div>

                    {modalCurriculum.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 bg-slate-800/30 rounded-2xl border border-slate-800">
                        Curriculum modules are being initialized. Check back shortly.
                      </div>
                    ) : (
                      modalCurriculum.map((module, idx) => {
                        const isOpen = expandedModules[module.id];
                        return (
                          <div key={module.id} className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-800/40">
                            <button
                              onClick={() => toggleModuleAccordion(module.id)}
                              className="w-full flex items-center justify-between p-4 bg-slate-800/80 hover:bg-slate-800 text-left transition"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                                  Section {idx + 1}
                                </span>
                                <span className="text-sm font-bold text-white">{module.title}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span>{module.lessons?.length || 0} lessons</span>
                                <span>{isOpen ? '▲' : '▼'}</span>
                              </div>
                            </button>

                            {isOpen && (
                              <div className="divide-y divide-slate-800/60 p-2 space-y-1">
                                {(module.lessons || []).map((l, lIdx) => (
                                  <div key={l.id} className="flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-800/50">
                                    <div className="flex items-center gap-2.5 text-slate-300">
                                      <span className="text-slate-500 font-mono text-[11px]">{lIdx + 1}.</span>
                                      <span className="font-medium text-slate-200">{l.title}</span>
                                      {lIdx === 0 && (
                                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                                          Free Preview
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-slate-500 text-[11px] font-mono">{l.duration || 12} min</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Tab 3: Ratings Breakdown */}
                {activePreviewTab === 'reviews' && (
                  <div className="space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 flex flex-col sm:flex-row gap-6 items-center">
                      <div className="text-center sm:border-r sm:border-slate-700/80 sm:pr-8">
                        <div className="text-4xl font-extrabold text-amber-400">{Number(modalRating).toFixed(1)}</div>
                        <div className="flex items-center justify-center gap-1 text-amber-400 text-sm mt-1">
                          {'★'.repeat(5)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Course Rating</div>
                      </div>

                      <div className="flex-1 w-full space-y-2">
                        {modalRatingDist.map((item) => (
                          <div key={item.stars} className="flex items-center gap-3 text-xs">
                            <span className="w-12 text-slate-400 font-medium">{item.stars} stars</span>
                            <div className="flex-1 bg-slate-950 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                                style={{ width: (item.percentage || 0) + '%' }}
                              ></div>
                            </div>
                            <span className="w-8 text-right text-slate-400 font-mono">{item.percentage || 0}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-white">Student Feedback</h4>
                      {modalReviews.length === 0 ? (
                        <div className="text-xs text-slate-400 p-4 bg-slate-800/30 rounded-xl">
                          Be among the first learners to leave a review after graduation!
                        </div>
                      ) : (
                        modalReviews.slice(0, 5).map((rev) => (
                          <div key={rev.id} className="bg-slate-800/30 border border-slate-800 rounded-2xl p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-600/50 flex items-center justify-center text-xs font-bold text-white">
                                  {rev.studentName?.charAt(0) || 'S'}
                                </div>
                                <span className="text-xs font-bold text-slate-200">{rev.studentName}</span>
                              </div>
                              <div className="text-amber-400 text-xs">{'★'.repeat(rev.rating || 5)}</div>
                            </div>
                            <p className="text-xs text-slate-300">{rev.comment || 'Excellent course content and clear step-by-step practical examples.'}</p>
                            {rev.instructorReply && (
                              <div className="mt-2 bg-indigo-950/40 border-l-2 border-indigo-500 p-2.5 rounded-r-xl text-xs text-indigo-200">
                                <div className="font-bold text-[11px] text-indigo-400">Instructor Response:</div>
                                <div>{rev.instructorReply}</div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseMarketplace;
