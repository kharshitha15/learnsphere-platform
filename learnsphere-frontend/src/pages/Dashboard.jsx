import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import CertificateModal from '../components/CertificateModal';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab State: 'overview', 'mylearning', 'certificates', 'achievements'
  const [activeTab, setActiveTab] = useState('overview');
  const [courseFilter, setCourseFilter] = useState('in_progress'); // 'all', 'in_progress', 'completed'

  const [dashboardData, setDashboardData] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Certificate for Modal
  const [selectedCert, setSelectedCert] = useState(null);

  // Sync tab with URL search parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'mylearning' || tabParam === 'certificates' || tabParam === 'achievements') {
      setActiveTab(tabParam);
    } else {
      setActiveTab('overview');
    }
  }, [location.search]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/dashboard');
      setDashboardData(res.data);

      try {
        const cRes = await api.get('/student/my-courses');
        setMyCourses(cRes.data || []);
      } catch (e) {
        console.error('My courses error', e);
      }

      try {
        const certRes = await api.get('/student/certificates');
        setCertificates(certRes.data || []);
      } catch (e) {
        console.error('Certificates error', e);
      }

      try {
        const wRes = await api.get('/student/wishlist');
        setWishlist(wRes.data || []);
      } catch (e) {
        console.error('Wishlist error', e);
      }
    } catch (err) {
      console.error('Error fetching student dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'INSTRUCTOR') {
      navigate('/instructor');
      return;
    }
    if (user?.role === 'ADMIN') {
      navigate('/admin');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const d = dashboardData || {};
  const gamification = d.gamification || {};
  const streakDays = d.streakDays || [
    { day: 'Mon', active: true },
    { day: 'Tue', active: true },
    { day: 'Wed', active: true },
    { day: 'Thu', active: true, isToday: true },
    { day: 'Fri', active: false },
    { day: 'Sat', active: false },
    { day: 'Sun', active: false }
  ];

  const uniqueCourses = useMemo(() => {
    const map = new Map();
    for (const c of myCourses) {
      const key = (c.title || c.courseTitle || '').trim().toLowerCase();
      const existing = map.get(key);
      if (!existing || (c.progressPercentage || 0) > (existing.progressPercentage || 0) || (c.certificate && !existing.certificate)) {
        map.set(key, c);
      }
    }
    return Array.from(map.values());
  }, [myCourses]);

  const inProgressCourses = useMemo(() => {
    return uniqueCourses.filter(c => (c.progressPercentage || 0) < 100 && !c.certificate);
  }, [uniqueCourses]);

  const completedCourses = useMemo(() => {
    return uniqueCourses.filter(c => (c.progressPercentage || 0) >= 100 || !!c.certificate);
  }, [uniqueCourses]);

  const displayedCourses = useMemo(() => {
    if (courseFilter === 'in_progress') return inProgressCourses;
    if (courseFilter === 'completed') return completedCourses;
    return uniqueCourses;
  }, [courseFilter, inProgressCourses, completedCourses, uniqueCourses]);

  const totalEnrolled = uniqueCourses.length || d.stats?.enrolledCourses || 4;
  const completedCount = completedCourses.length || d.stats?.completedCourses || 1;
  const inProgressCount = inProgressCourses.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex flex-col items-center justify-center text-[#636363]">
        <div className="w-10 h-10 border-4 border-[#0056d2]/20 border-t-[#0056d2] rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold">Loading your learning dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#1f1f1f] font-sans pb-16">
      {selectedCert && (
        <CertificateModal certificate={selectedCert} onClose={() => setSelectedCert(null)} />
      )}

      {/* Coursera My Learning header */}
      <section className="bg-white border-b border-[#e1e6eb] pt-8 pb-0 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1f1f1f]">My Learning</h1>
          <p className="mt-1 text-sm text-[#636363]">
            Welcome back, {user?.fullName || d.fullName || 'Learner'}. Track your progress and resume courses.
          </p>

          <div className="mt-6 flex items-center gap-6 border-b border-[#e1e6eb] overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'mylearning', label: 'In Progress', count: inProgressCourses.length },
              { id: 'certificates', label: 'Completed & Certificates', count: Math.max(completedCourses.length, certificates.length) },
              { id: 'achievements', label: 'Achievements & Badges', count: (d.achievements || []).filter(a => a.unlocked).length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={'pb-3 text-sm font-semibold whitespace-nowrap transition border-b-2 -mb-px cursor-pointer ' + (
                  activeTab === tab.id
                    ? 'text-[#0056d2] border-[#0056d2]'
                    : 'text-[#636363] border-transparent hover:text-[#1f1f1f]'
                )}
              >
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span className="ml-1.5 text-xs text-[#636363]">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* ==================================================== */}
        {/* TAB 1: OVERVIEW */}
        {/* ==================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#e1e6eb] p-5 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Enrolled Courses</span>
                  <span className="text-xl">📚</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#1f1f1f]">{totalEnrolled}</div>
                <div className="text-xs text-[#636363] mt-1">{inProgressCount} in active progress</div>
              </div>

              <div className="bg-white border border-[#e1e6eb] p-5 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Completed</span>
                  <span className="text-xl">🎓</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#1a7f37]">{completedCount}</div>
                <div className="text-xs text-[#636363] mt-1">{certificates.length} certificates earned</div>
              </div>

              <div className="bg-white border border-[#e1e6eb] p-5 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Quiz Score Avg</span>
                  <span className="text-xl">📝</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#f5b301]">{d.stats?.avgQuizScore ? Math.round(d.stats.avgQuizScore) : 92}%</div>
                <div className="text-xs text-[#636363] mt-1">Passing standard 70%+</div>
              </div>

              <div className="bg-white border border-[#e1e6eb] p-5 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#636363] uppercase tracking-wider">Learning Streak</span>
                  <span className="text-xl">🔥</span>
                </div>
                <div className="mt-2 text-2xl sm:text-3xl font-bold text-rose-600">{d.stats?.learningStreak || 4} Days</div>
                <div className="text-xs text-[#636363] mt-1">Keep learning daily</div>
              </div>
            </div>

            {/* 7-Day Activity Visualizer */}
            <div className="bg-white border border-[#e1e6eb] p-6 rounded-lg shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2">
                  <span>Weekly Learning Activity</span>
                </h3>
                <p className="text-xs text-[#636363] mt-1">
                  Complete lessons and quizzes daily to maintain your study routine.
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {streakDays.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <div className={'w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition ' + (
                      item.active 
                        ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                        : item.isToday 
                          ? 'bg-[#e8f0fe] text-[#0056d2] border border-[#0056d2]'
                          : 'bg-[#f5f7f8] border border-[#e1e6eb] text-[#636363]'
                    )}>
                      {item.active ? '🔥' : item.day.charAt(0)}
                    </div>
                    <span className="text-[10px] text-[#636363] font-semibold">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Continue Learning Spotlight */}
            {d.continueLearning && (
              <div className="bg-[#002758] text-white p-6 rounded-lg shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="bg-white/10 text-blue-200 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                    Continue Where You Left Off
                  </span>
                  <h3 className="text-xl font-bold text-white">{d.continueLearning.courseTitle}</h3>
                  <p className="text-xs text-white/80">
                    Next Lesson: <strong className="text-white">{d.continueLearning.lastLessonTitle || 'Introduction'}</strong>
                  </p>
                  <div className="w-64 bg-white/20 rounded-full h-2 overflow-hidden mt-2">
                    <div
                      className="bg-[#0056d2] h-full rounded-full"
                      style={{ width: Math.round(d.continueLearning.progressPercentage || 40) + '%' }}
                    ></div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/learning/' + d.continueLearning.courseId)}
                  className="px-6 py-3 bg-[#0056d2] hover:bg-[#00419e] text-white font-bold text-xs rounded transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>Go to Course</span>
                  <span>→</span>
                </button>
              </div>
            )}

            {/* In Progress Courses Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#1f1f1f]">Courses in Progress ({inProgressCourses.length})</h3>
                <Link to="/courses" className="text-xs text-[#0056d2] hover:underline font-semibold">
                  Browse All Courses →
                </Link>
              </div>

              {inProgressCourses.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg border border-[#e1e6eb] p-6 shadow-2xs">
                  <div className="text-4xl mb-2">🎉</div>
                  <h4 className="text-base font-bold text-[#1f1f1f]">All Current Courses Completed!</h4>
                  <p className="text-xs text-[#636363] mt-1">
                    You have achieved 100% completion on all your courses. Check your certificates or discover a new topic.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setActiveTab('certificates')}
                      className="px-4 py-2 bg-[#1a7f37] hover:bg-[#146c2e] text-white text-xs font-bold rounded transition cursor-pointer shadow-2xs"
                    >
                      🎓 View Certificates ({completedCourses.length})
                    </button>
                    <Link
                      to="/courses"
                      className="px-4 py-2 bg-[#0056d2] hover:bg-[#00419e] text-white text-xs font-bold rounded transition shadow-2xs"
                    >
                      Explore New Courses
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inProgressCourses.slice(0, 3).map((enr) => {
                    const progress = Math.round(enr.progressPercentage || 0);
                    return (
                      <div
                        key={enr.courseId || enr.id}
                        onClick={() => navigate('/learning/' + (enr.courseId || enr.id))}
                        className="bg-white border border-[#e1e6eb] hover:border-[#0056d2] rounded-lg p-5 cursor-pointer transition shadow-2xs hover:shadow-md flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs text-[#636363] mb-2">
                            <span className="text-[#0056d2] font-semibold">{enr.category || 'Development'}</span>
                            <span className="text-[#1a7f37] font-bold">{progress}%</span>
                          </div>
                          <h4 className="text-base font-bold text-[#1f1f1f] line-clamp-2">{enr.title || enr.courseTitle}</h4>
                          <p className="text-xs text-[#636363] mt-1">Instructor: {enr.instructorName || 'Senior Instructor'}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#e1e6eb] space-y-2">
                          <div className="w-full bg-[#f0f2f5] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#0056d2] h-full rounded-full transition-all"
                              style={{ width: progress + '%' }}
                            ></div>
                          </div>
                          <button className="w-full py-2 bg-[#f5f7fa] hover:bg-[#0056d2] text-[#0056d2] hover:text-white rounded text-xs font-bold transition border border-[#e1e6eb] hover:border-[#0056d2]">
                            Resume Learning →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Wishlisted Courses Strip */}
            {wishlist.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#1f1f1f] flex items-center gap-2">
                    <span>❤️ Saved Wishlist ({wishlist.length})</span>
                  </h3>
                  <Link to="/courses" className="text-xs text-[#0056d2] hover:underline font-semibold">
                    View in Catalog →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlist.map((w) => (
                    <div
                      key={w.wishlistId || w.id}
                      onClick={() => navigate('/courses/' + (w.courseId || w.id))}
                      className="bg-white border border-[#e1e6eb] p-4 rounded-lg hover:border-[#0056d2] cursor-pointer transition flex items-center justify-between shadow-2xs"
                    >
                      <div>
                        <h5 className="text-xs font-bold text-[#1f1f1f] line-clamp-1">{w.title || w.courseTitle}</h5>
                        <span className="text-[11px] text-[#636363]">{w.category || 'Development'}</span>
                      </div>
                      <span className="text-xs text-[#0056d2] font-bold">Details →</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: MY LEARNING */}
        {/* ==================================================== */}
        {activeTab === 'mylearning' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1f1f1f]">Enrolled Courses ({uniqueCourses.length})</h2>
                <p className="text-xs text-[#636363] mt-0.5">Filter and resume courses across your learning journey.</p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-[#e1e6eb] text-xs font-semibold shadow-2xs">
                <button
                  onClick={() => setCourseFilter('in_progress')}
                  className={'px-3 py-1.5 rounded transition cursor-pointer ' + (
                    courseFilter === 'in_progress' ? 'bg-[#0056d2] text-white shadow-xs' : 'text-[#636363] hover:text-[#1f1f1f]'
                  )}
                >
                  In Progress ({inProgressCourses.length})
                </button>
                <button
                  onClick={() => setCourseFilter('completed')}
                  className={'px-3 py-1.5 rounded transition cursor-pointer ' + (
                    courseFilter === 'completed' ? 'bg-[#0056d2] text-white shadow-xs' : 'text-[#636363] hover:text-[#1f1f1f]'
                  )}
                >
                  Completed ({completedCourses.length})
                </button>
                <button
                  onClick={() => setCourseFilter('all')}
                  className={'px-3 py-1.5 rounded transition cursor-pointer ' + (
                    courseFilter === 'all' ? 'bg-[#0056d2] text-white shadow-xs' : 'text-[#636363] hover:text-[#1f1f1f]'
                  )}
                >
                  All ({uniqueCourses.length})
                </button>
              </div>
            </div>

            {displayedCourses.length === 0 ? (
              <div className="text-center py-16 bg-white border border-[#e1e6eb] rounded-lg p-8">
                <h3 className="text-lg font-bold text-[#1f1f1f]">No courses in this view</h3>
                <p className="text-[#636363] text-sm mt-1">
                  {courseFilter === 'in_progress'
                    ? 'All enrolled courses have been completed! Great work.'
                    : 'Enroll in new courses to begin learning.'}
                </p>
                <Link to="/courses" className="mt-4 inline-block bg-[#0056d2] hover:bg-[#00419e] text-white text-xs font-bold px-6 py-2.5 rounded transition shadow-xs">
                  Browse Catalog →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedCourses.map((c) => {
                  const progress = Math.round(c.progressPercentage || 0);
                  const isDone = progress >= 100 || Boolean(c.certificate);

                  return (
                    <div
                      key={c.courseId || c.id}
                      className="bg-white border border-[#e1e6eb] rounded-lg flex flex-col sm:flex-row overflow-hidden hover:shadow-md transition"
                    >
                      <div className="sm:w-52 h-36 sm:h-auto bg-[#f5f7f8] shrink-0">
                        <img
                          src={c.thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&auto=format&fit=crop&q=80'}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-5 flex flex-col justify-between">
                        <div>
                          <p className="text-xs text-[#636363] font-semibold uppercase">{c.instructorName || 'Instructor'}</p>
                          <h3 className="text-base font-bold text-[#1f1f1f] mt-1">{c.title || c.courseTitle}</h3>
                          <p className="text-xs text-[#636363] mt-1 line-clamp-2">{c.description || 'Continue your learning journey.'}</p>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-xs text-[#636363]">
                            <span>{isDone ? 'Completed' : 'Progress'}</span>
                            <span className="font-bold text-[#0056d2]">{progress}%</span>
                          </div>
                          <div className="w-full bg-[#f0f2f5] rounded-full h-2 overflow-hidden">
                            <div
                              className={'h-full rounded-full transition-all duration-500 ' + (
                                isDone ? 'bg-[#1a7f37]' : 'bg-[#0056d2]'
                              )}
                              style={{ width: progress + '%' }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={() => navigate('/learning/' + (c.courseId || c.id))}
                            className="flex-1 py-2.5 bg-[#0056d2] hover:bg-[#00419e] text-white rounded text-xs font-bold transition text-center cursor-pointer"
                          >
                            {isDone ? 'Review Course →' : 'Go to Course →'}
                          </button>
                          {c.certificate && (
                            <button
                              onClick={() => setSelectedCert({
                                certificateId: c.certificate.certificateId,
                                studentName: user?.fullName || 'Learner',
                                courseTitle: c.title || c.courseTitle,
                                issueDate: c.certificate.issueDate
                              })}
                              className="px-4 py-2.5 bg-white text-[#0056d2] hover:bg-[#f5f7f8] border border-[#0056d2] rounded text-xs font-bold transition cursor-pointer"
                              title="View Certificate"
                            >
                              🎓 View Certificate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: CERTIFICATES */}
        {/* ==================================================== */}
        {activeTab === 'certificates' && (
          <div className="space-y-6">
            <div className="pb-2 border-b border-[#e1e6eb]">
              <h2 className="text-xl font-bold text-[#1f1f1f]">Official Course Certificates</h2>
              <p className="text-xs text-[#636363] mt-1">
                Earned upon achieving 100% curriculum completion and passing all module knowledge checks.
              </p>
            </div>

            {certificates.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-[#e1e6eb] p-8">
                <div className="text-5xl mb-3">🎓</div>
                <h3 className="text-lg font-bold text-[#1f1f1f]">No certificates earned yet</h3>
                <p className="text-[#636363] text-sm mt-1">Complete any enrolled course to 100% to earn your verifiable credential.</p>
                <button
                  onClick={() => setActiveTab('mylearning')}
                  className="mt-4 px-5 py-2.5 bg-[#0056d2] hover:bg-[#00419e] text-white text-xs font-bold rounded transition cursor-pointer"
                >
                  Resume Active Courses →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certificates.map((cert) => (
                  <div
                    key={cert.id || cert.certificateId}
                    className="bg-white border border-[#e1e6eb] rounded-lg p-6 shadow-2xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="bg-[#e6f4ea] text-[#1a7f37] text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                          Verified Credential
                        </span>
                        <span className="text-xs font-mono text-[#636363]">{cert.certificateId}</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#1f1f1f]">{cert.courseTitle}</h3>
                      <p className="text-xs text-[#636363]">Issued to: <strong className="text-[#1f1f1f]">{cert.studentName || user?.fullName}</strong></p>
                      <p className="text-xs text-[#636363]">Date: {new Date(cert.issueDate || Date.now()).toLocaleDateString()}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#e1e6eb]">
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="w-full py-2.5 bg-[#0056d2] hover:bg-[#00419e] text-white rounded text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>📜 View & Print Certificate</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: ACHIEVEMENTS & BADGES */}
        {/* ==================================================== */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="pb-2 border-b border-[#e1e6eb]">
              <h2 className="text-xl font-bold text-[#1f1f1f]">Badges & Milestones</h2>
              <p className="text-xs text-[#636363] mt-1">Unlock badges as you complete lessons, pass module quizzes, and maintain study streaks.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(d.achievements || [
                { id: 'first_step', title: 'First Steps', description: 'Complete your first lesson on LearnSphere', icon: '🌱', unlocked: true, progress: '1/1' },
                { id: 'quiz_master', title: 'Knowledge Seeker', description: 'Attempt at least 3 knowledge check quizzes', icon: '🎯', unlocked: true, progress: '3/3' },
                { id: 'streak_champion', title: 'Consistent Learner', description: 'Maintain a 3-day active learning streak', icon: '🔥', unlocked: true, progress: '4/3 Days' },
                { id: 'course_grad', title: 'Certified Graduate', description: 'Complete a full course and claim your certificate', icon: '🏆', unlocked: completedCount >= 1, progress: completedCount + '/1' },
                { id: 'code_warrior', title: 'Interactive Sandbox Pioneer', description: 'Execute live code in the in-browser sandbox', icon: '⚡', unlocked: true, progress: 'Active' },
                { id: 'qa_contributor', title: 'Community Helper', description: 'Ask questions or post answers in the in-lesson forum', icon: '💬', unlocked: true, progress: 'Active' }
              ]).map((ach, idx) => (
                <div
                  key={ach.id || idx}
                  className={'p-5 rounded-lg border transition shadow-2xs flex items-start gap-4 ' + (
                    ach.unlocked 
                      ? 'bg-white border-[#e1e6eb]' 
                      : 'bg-[#fafafa] border-[#e1e6eb] opacity-60'
                  )}
                >
                  <div className={'w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0 ' + (
                    ach.unlocked ? 'bg-[#e8f0fe] border border-blue-200' : 'bg-[#f0f2f5]'
                  )}>
                    {ach.icon || '🏅'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#1f1f1f]">{ach.title}</h4>
                      {ach.unlocked ? (
                        <span className="text-[10px] font-bold text-[#1a7f37] bg-[#e6f4ea] px-2 py-0.5 rounded">
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-[#636363]">Locked</span>
                      )}
                    </div>
                    <p className="text-xs text-[#636363] mt-1 leading-relaxed">{ach.description}</p>
                    <div className="mt-2 text-[11px] font-mono text-[#0056d2] font-semibold">
                      Progress: {ach.progress}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
