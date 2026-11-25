import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const InstructorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignmentsData, setAssignmentsData] = useState(null);
  const [quizzesData, setQuizzesData] = useState(null);
  const [reviewsData, setReviewsData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState({ text: '', type: 'success' });

  // Course Preview Modal
  const [previewCourse, setPreviewCourse] = useState(null);
  const [previewActiveLesson, setPreviewActiveLesson] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Student Profile Modal
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Assignment Grading Modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingMarks, setGradingMarks] = useState('');
  const [gradingFeedback, setGradingFeedback] = useState('');

  // Quiz Attempts Modal
  const [selectedQuizAttempts, setSelectedQuizAttempts] = useState(null);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState('');

  // Review Reply State
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Profile Edit State
  const [editProfile, setEditProfile] = useState({
    bio: '',
    location: '',
    skills: '',
    careerInterest: ''
  });

  // ==========================================================
  // COMPREHENSIVE COURSE BUILDER WIZARD STATE
  // ==========================================================
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [builderStep, setBuilderStep] = useState(1);
  
  const [newCourse, setNewCourse] = useState({
    title: '',
    category: 'Web Development',
    difficulty: 'BEGINNER',
    description: '',
    published: true,
    modules: [
      {
        title: 'Module 1: Getting Started & Foundations',
        lessons: [
          {
            title: 'Welcome & Course Roadmap',
            lessonType: 'VIDEO',
            duration: 12,
            learningObjectives: 'Understand core concepts, tools, and prerequisites.',
            content: 'Detailed text overview of the module content and setup requirements.',
            videoUrl: 'https://www.youtube.com/embed/9SGDpanrc8U',
            resources: [
              { title: 'Starter GitHub Repo', url: 'https://github.com', resourceType: 'GITHUB' },
              { title: 'Module Cheat Sheet PDF', url: 'https://learnsphere.io/docs/cheatsheet.pdf', resourceType: 'PDF' }
            ]
          }
        ],
        quizzes: [
          {
            title: 'Module 1 Knowledge Check',
            description: 'Assess understanding of foundational concepts.',
            passingPercentage: 80,
            questions: [
              {
                text: 'What is the primary architectural purpose of this module?',
                optionA: 'Establish project setup and core fundamentals',
                optionB: 'Directly deploy to production with zero tests',
                optionC: 'Delete existing repositories',
                optionD: 'None of the above',
                correctOption: 'A'
              }
            ]
          }
        ],
        activities: [
          {
            title: 'Module 1 Practical Action Task',
            description: 'Setup your environment, build the initial project scaffold, and submit your GitHub repo link and screenshot proof.',
            maxMarks: 100,
            requiredProofType: 'DOCUMENT_OR_IMAGE'
          }
        ]
      }
    ]
  });

  const showToast = (text, type = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg({ text: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      loadTabData(tabParam, false);
    }
  }, [searchParams]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashRes, coursesRes, notifsRes] = await Promise.all([
        api.get('/instructor/dashboard'),
        api.get('/instructor/courses'),
        api.get('/instructor/notifications')
      ]);
      setDashboardData(dashRes.data);
      setCourses(coursesRes.data);
      setNotifications(notifsRes.data || []);
      
      const tabParam = searchParams.get('tab');
      if (tabParam && tabParam !== 'dashboard') {
        loadTabData(tabParam, false);
      }
    } catch (err) {
      console.error('Failed to load instructor dashboard:', err);
      showToast('Error loading instructor metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab, updateUrl = true) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (updateUrl) {
      setSearchParams({ tab });
    }
    try {
      if (tab === 'students') {
        const res = await api.get('/instructor/students');
        setStudents(res.data);
      } else if (tab === 'assignments') {
        const res = await api.get('/instructor/assignments');
        setAssignmentsData(res.data);
      } else if (tab === 'quizzes') {
        const res = await api.get('/instructor/quizzes');
        setQuizzesData(res.data);
      } else if (tab === 'reviews') {
        const res = await api.get('/instructor/reviews');
        setReviewsData(res.data);
      } else if (tab === 'analytics') {
        const res = await api.get('/instructor/analytics');
        setAnalyticsData(res.data);
      } else if (tab === 'profile' || tab === 'settings') {
        const res = await api.get('/instructor/profile');
        setProfileData(res.data);
        setEditProfile({
          bio: res.data.bio || '',
          location: res.data.location || '',
          skills: res.data.skills || '',
          careerInterest: res.data.careerInterest || ''
        });
      }
    } catch (err) {
      console.error(`Error loading ${tab}:`, err);
    }
  };

  // Preview Course
  const handlePreviewCourse = async (courseId) => {
    setPreviewLoading(true);
    try {
      const res = await api.get(`/instructor/courses/${courseId}/preview`);
      setPreviewCourse(res.data);
      setPreviewActiveLesson(res.data.modules?.[0]?.lessons?.[0] || null);
    } catch (err) {
      showToast('Could not load course preview', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Student Profile
  const handleViewStudent = async (studentId) => {
    try {
      const res = await api.get(`/instructor/students/${studentId}`);
      setSelectedStudent(res.data);
    } catch (err) {
      showToast('Failed to load student profile', 'error');
    }
  };

  // Grade Assignment
  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    try {
      const res = await api.put(`/instructor/assignments/submissions/${selectedSubmission.id}/grade`, {
        marks: Number(gradingMarks),
        feedback: gradingFeedback
      });
      showToast(res.data.message || 'Grade saved! Student notified.');
      setSelectedSubmission(null);
      loadTabData('assignments');
      fetchDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving grade.', 'error');
    }
  };

  // Return Submission
  const handleReturnSubmission = async () => {
    if (!selectedSubmission) return;
    try {
      const res = await api.put(`/instructor/assignments/submissions/${selectedSubmission.id}/return`, {
        feedback: gradingFeedback || 'Please revise and resubmit.'
      });
      showToast(res.data.message || 'Returned for revision!');
      setSelectedSubmission(null);
      loadTabData('assignments');
    } catch (err) {
      showToast('Error returning submission.', 'error');
    }
  };

  // Review Reply
  const handleSaveReviewReply = async (reviewId) => {
    if (!replyText.trim()) return;
    try {
      await api.post(`/instructor/reviews/${reviewId}/reply`, { reply: replyText });
      showToast('Reply published successfully!');
      setReplyingReviewId(null);
      setReplyText('');
      loadTabData('reviews');
    } catch (err) {
      showToast('Failed to send reply', 'error');
    }
  };

  // Create Full Course with Modules, Lessons, Resources, Quizzes, Activities
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.title.trim()) {
      showToast('Please enter a course title', 'error');
      return;
    }
    try {
      const res = await api.post('/instructor/courses', newCourse);
      showToast(res.data.message || 'Course published successfully! 🎉');
      setShowCourseModal(false);
      setBuilderStep(1);
      fetchDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create course.', 'error');
    }
  };

  // Module & Lesson Builder Handlers
  const addModule = () => {
    const nextOrder = newCourse.modules.length + 1;
    setNewCourse({
      ...newCourse,
      modules: [
        ...newCourse.modules,
        {
          title: `Module ${nextOrder}: New Subject Module`,
          lessons: [
            {
              title: 'Lesson 1: Overview',
              lessonType: 'VIDEO',
              duration: 15,
              learningObjectives: 'Objectives for this lesson',
              content: 'Lesson content overview',
              videoUrl: 'https://www.youtube.com/embed/9SGDpanrc8U',
              resources: []
            }
          ],
          quizzes: [],
          activities: []
        }
      ]
    });
  };

  const removeModule = (mIdx) => {
    if (newCourse.modules.length <= 1) return;
    const updated = newCourse.modules.filter((_, idx) => idx !== mIdx);
    setNewCourse({ ...newCourse, modules: updated });
  };

  const addLessonToModule = (mIdx) => {
    const updated = [...newCourse.modules];
    const lCount = (updated[mIdx].lessons || []).length + 1;
    updated[mIdx].lessons.push({
      title: `Lesson ${lCount}: Next Topic`,
      lessonType: 'VIDEO',
      duration: 15,
      learningObjectives: 'Core takeaways for students',
      content: 'Detailed explanation and reference notes',
      videoUrl: 'https://www.youtube.com/embed/9SGDpanrc8U',
      resources: []
    });
    setNewCourse({ ...newCourse, modules: updated });
  };

  const removeLesson = (mIdx, lIdx) => {
    const updated = [...newCourse.modules];
    updated[mIdx].lessons = updated[mIdx].lessons.filter((_, idx) => idx !== lIdx);
    setNewCourse({ ...newCourse, modules: updated });
  };

  const addResourceToLesson = (mIdx, lIdx) => {
    const updated = [...newCourse.modules];
    if (!updated[mIdx].lessons[lIdx].resources) {
      updated[mIdx].lessons[lIdx].resources = [];
    }
    updated[mIdx].lessons[lIdx].resources.push({
      title: 'Project Files & Reference',
      url: 'https://github.com',
      resourceType: 'GITHUB'
    });
    setNewCourse({ ...newCourse, modules: updated });
  };

  const addQuizToModule = (mIdx) => {
    const updated = [...newCourse.modules];
    if (!updated[mIdx].quizzes) updated[mIdx].quizzes = [];
    updated[mIdx].quizzes.push({
      title: `Module ${mIdx + 1} Assessment`,
      description: 'Test your understanding of the concepts covered in this module.',
      passingPercentage: 80,
      questions: [
        {
          text: 'Sample Question: Which statement best describes this concept?',
          optionA: 'Option 1 (Correct choice)',
          optionB: 'Option 2 (Incorrect)',
          optionC: 'Option 3 (Incorrect)',
          optionD: 'Option 4 (Incorrect)',
          correctOption: 'A'
        }
      ]
    });
    setNewCourse({ ...newCourse, modules: updated });
  };

  const addQuestionToQuiz = (mIdx, qIdx) => {
    const updated = [...newCourse.modules];
    updated[mIdx].quizzes[qIdx].questions.push({
      text: 'New Question: What is the expected outcome?',
      optionA: 'Primary choice',
      optionB: 'Alternative choice',
      optionC: 'Secondary choice',
      optionD: 'Fallback choice',
      correctOption: 'A'
    });
    setNewCourse({ ...newCourse, modules: updated });
  };

  const addActivityToModule = (mIdx) => {
    const updated = [...newCourse.modules];
    if (!updated[mIdx].activities) updated[mIdx].activities = [];
    updated[mIdx].activities.push({
      title: `Module ${mIdx + 1} Practical Action Task`,
      description: 'Implement the project guidelines, run test cases, and submit your documentation / image screenshot proof.',
      maxMarks: 100,
      requiredProofType: 'DOCUMENT_OR_IMAGE'
    });
    setNewCourse({ ...newCourse, modules: updated });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold text-sm">Loading Instructor Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row -mt-8 -mx-4 md:-mx-8">
      {toastMsg.text && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center space-x-2 animate-bounce ${
          toastMsg.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-30">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md">
              LS
            </div>
            <div>
              <h2 className="font-extrabold text-gray-900 text-base leading-tight">Instructor Hub</h2>
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                Faculty Portal
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: '📊' },
            { key: 'courses', label: 'My Courses', icon: '📚' },
            { key: 'students', label: 'Students', icon: '👥' },
            { key: 'assignments', label: 'Assignments & Proofs', icon: '📝', badge: dashboardData?.pendingAssignments },
            { key: 'quizzes', label: 'Quizzes & Attempts', icon: '🎯' },
            { key: 'reviews', label: 'Reviews & Feedback', icon: '⭐' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => loadTabData(item.key)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === item.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => setShowCourseModal(true)}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
          >
            <span>+</span>
            <span>Create New Course</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 p-6 md:p-10 space-y-8 overflow-y-auto">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-900 capitalize">
              {activeTab === 'dashboard' ? 'Instructor Command Center' : activeTab.replace('-', ' ')}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Welcome back, <span className="font-bold text-gray-800">{user?.fullName}</span> • Manage courses, student submissions, and assessments.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCourseModal(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-1.5"
            >
              <span>+</span>
              <span>New Curriculum</span>
            </button>
          </div>
        </div>

        {/* TAB 1: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Courses</p>
                <p className="text-2xl font-black text-gray-900">{dashboardData.totalCourses}</p>
                <span className="text-[10px] text-green-600 font-bold">{dashboardData.publishedCourses} Published</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Students</p>
                <p className="text-2xl font-black text-blue-600">{dashboardData.totalStudents}</p>
                <span className="text-[10px] text-gray-500 font-medium">Active Learners</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Enrollments</p>
                <p className="text-2xl font-black text-indigo-600">{dashboardData.totalEnrollments}</p>
                <span className="text-[10px] text-indigo-600 font-bold">Total seats</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Rating</p>
                <p className="text-2xl font-black text-amber-500">★ {dashboardData.averageRating}</p>
                <span className="text-[10px] text-amber-600 font-bold">Feedback</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Pending Review</p>
                <p className="text-2xl font-black text-red-500">{dashboardData.pendingAssignments}</p>
                <span className="text-[10px] text-red-600 font-bold">Action Needed</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Graduates</p>
                <p className="text-2xl font-black text-emerald-600">{dashboardData.completedLearners}</p>
                <span className="text-[10px] text-emerald-600 font-bold">100% Completed</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Avg Quiz</p>
                <p className="text-2xl font-black text-teal-600">{dashboardData.averageQuizScore}%</p>
                <span className="text-[10px] text-teal-600 font-bold">Mastery</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Quick Action</p>
                <button
                  onClick={() => setShowCourseModal(true)}
                  className="mt-1 text-xs font-black text-blue-700 hover:underline block"
                >
                  + Add Course
                </button>
              </div>
            </div>

            {/* Courses Overview List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900">Your Active Courses</h3>
                <button onClick={() => loadTabData('courses')} className="text-xs font-bold text-blue-600 hover:underline">
                  View All Courses →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(c => (
                  <div key={c.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">
                          {c.category}
                        </span>
                        <span className="text-xs font-bold text-amber-500">★ {c.rating || 4.8}</span>
                      </div>
                      <h4 className="text-base font-black text-gray-900 mb-1">{c.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-4">{c.description}</p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <button
                        onClick={() => handlePreviewCourse(c.id)}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        👁 Instructor Preview
                      </button>
                      <button
                        onClick={() => loadTabData('assignments')}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
                      >
                        Manage Proofs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY COURSES */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900">Course Management ({courses.length})</h3>
              <button
                onClick={() => setShowCourseModal(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                + Create Course
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(c => (
                <div key={c.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">
                        {c.category}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${c.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {c.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-gray-900 mb-2">{c.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{c.description}</p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => handlePreviewCourse(c.id)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Preview Syllabus →
                    </button>
                    <span className="text-xs font-bold text-gray-400">ID: #{c.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STUDENTS */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-gray-900">Enrolled Students ({students.length})</h3>
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Course</th>
                    <th className="p-4">Progress</th>
                    <th className="p-4">Quiz Avg</th>
                    <th className="p-4">Activity Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {students.map((s, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{s.email}</p>
                      </td>
                      <td className="p-4 text-gray-700">{s.courseTitle}</td>
                      <td className="p-4">
                        <span className="font-bold text-blue-600">{Math.round(s.progress)}%</span>
                      </td>
                      <td className="p-4 font-bold text-teal-600">{s.quizAverage}%</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          s.assignmentStatus === 'GRADED' ? 'bg-green-100 text-green-800' :
                          s.assignmentStatus === 'SUBMITTED' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {s.assignmentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleViewStudent(s.studentId)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg hover:bg-blue-100 transition"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ASSIGNMENTS & PROOFS WITH LIVE GRADING */}
        {activeTab === 'assignments' && assignmentsData && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-gray-900">Student Proofs & Submissions</h3>
                <p className="text-xs text-gray-500">Review homework, project documents, screenshots, and award points</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {assignmentsData.submissions?.map(sub => (
                <div key={sub.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">
                        {sub.courseTitle}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        sub.status === 'GRADED' ? 'bg-green-100 text-green-800' :
                        sub.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {sub.status}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-gray-900">{sub.assignmentTitle}</h4>
                    <p className="text-xs text-gray-600">
                      Submitted by: <span className="font-bold text-gray-900">{sub.studentName}</span> ({sub.studentEmail})
                    </p>

                    {/* Proof Link & Notes */}
                    {sub.submissionUrl && (
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center space-x-2 text-xs">
                        <span className="text-blue-600 font-bold">🔗 Proof URL:</span>
                        <a href={sub.submissionUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono break-all">
                          {sub.submissionUrl}
                        </a>
                      </div>
                    )}

                    {sub.studentNotes && (
                      <p className="text-xs text-gray-700 italic bg-gray-50 p-2.5 rounded-xl">
                        "{sub.studentNotes}"
                      </p>
                    )}

                    {sub.feedback && (
                      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
                        <span className="font-bold text-blue-900">Your Feedback: </span>
                        <span className="text-blue-800">{sub.feedback}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Score</p>
                      <p className="text-xl font-black text-gray-900">
                        {sub.marksObtained !== null ? `${sub.marksObtained} / ${sub.maxMarks}` : `-- / ${sub.maxMarks}`}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setGradingMarks(sub.marksObtained || sub.maxMarks);
                        setGradingFeedback(sub.feedback || '');
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                    >
                      {sub.status === 'GRADED' ? 'Edit Grade' : 'Grade Submission →'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: QUIZZES */}
        {activeTab === 'quizzes' && quizzesData && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-gray-900">Quizzes & Assessment Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzesData.quizzes?.map(q => (
                <div key={q.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md">
                      {q.courseTitle}
                    </span>
                    <h4 className="text-base font-black text-gray-900 mt-2 mb-1">{q.title}</h4>
                    <p className="text-xs text-gray-500 mb-4">{q.description}</p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Pass Rate</p>
                      <p className="font-black text-green-600">{q.passRate}% ({q.totalAttempts} attempts)</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: REVIEWS */}
        {activeTab === 'reviews' && reviewsData && (
          <div className="space-y-6">
            <h3 className="text-lg font-black text-gray-900">Student Reviews & Instructor Replies</h3>
            <div className="space-y-4">
              {reviewsData.reviews?.map(r => (
                <div key={r.id} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900">{r.studentName}</p>
                      <p className="text-[10px] text-gray-400">{r.courseTitle}</p>
                    </div>
                    <span className="text-amber-500 font-bold">★ {r.rating} / 5</span>
                  </div>
                  <p className="text-xs text-gray-700">{r.reviewText}</p>

                  {r.instructorReply ? (
                    <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-xs">
                      <span className="font-bold text-blue-900">Your Response:</span>
                      <p className="text-blue-800 mt-0.5">{r.instructorReply}</p>
                    </div>
                  ) : (
                    <div>
                      {replyingReviewId === r.id ? (
                        <div className="space-y-2 pt-2">
                          <textarea
                            rows={2}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write your instructor reply to this student..."
                            className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveReviewReply(r.id)}
                              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs"
                            >
                              Post Reply
                            </button>
                            <button
                              onClick={() => setReplyingReviewId(null)}
                              className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-bold text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setReplyingReviewId(r.id);
                            setReplyText('');
                          }}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          + Reply to Student
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* COURSE CREATOR / BUILDER MODAL */}
      {/* ========================================================= */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-10 shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowCourseModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full"
            >
              ✕
            </button>

            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                Course Creator Studio
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-2">Create New Course with Modules, Quizzes & Activities</h2>
              <p className="text-xs text-gray-500">Design your comprehensive curriculum with media lessons, assessments, and practical tasks.</p>
            </div>

            {/* Stepper Header */}
            <div className="flex border-b border-gray-200 pb-3 mb-6 space-x-6 text-xs font-bold">
              <button
                onClick={() => setBuilderStep(1)}
                className={`pb-2 border-b-2 transition ${builderStep === 1 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
              >
                1. Course Overview
              </button>
              <button
                onClick={() => setBuilderStep(2)}
                className={`pb-2 border-b-2 transition ${builderStep === 2 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
              >
                2. Modules & Media Lessons ({newCourse.modules.length})
              </button>
              <button
                onClick={() => setBuilderStep(3)}
                className={`pb-2 border-b-2 transition ${builderStep === 3 ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
              >
                3. Module Quizzes & Action Tasks
              </button>
            </div>

            {/* Step Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {/* STEP 1: BASICS */}
              {builderStep === 1 && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Course Title *</label>
                    <input
                      type="text"
                      required
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                      placeholder="e.g. Master Spring Boot, Microservices & Docker"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Category</label>
                      <select
                        value={newCourse.category}
                        onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-medium focus:outline-none"
                      >
                        <option value="Web Development">Web Development</option>
                        <option value="Programming">Programming</option>
                        <option value="Databases">Databases</option>
                        <option value="Cloud & DevOps">Cloud & DevOps</option>
                        <option value="AI & Machine Learning">AI & Machine Learning</option>
                        <option value="Mobile Development">Mobile Development</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Difficulty Level</label>
                      <select
                        value={newCourse.difficulty}
                        onChange={(e) => setNewCourse({ ...newCourse, difficulty: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-medium focus:outline-none"
                      >
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Description & Overview</label>
                    <textarea
                      rows={3}
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      placeholder="Detailed synopsis of what students will achieve in this curriculum..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl font-medium focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: MODULES & LESSONS (WITH MEDIA, VIDEO & FILES) */}
              {builderStep === 2 && (
                <div className="space-y-6">
                  {newCourse.modules.map((m, mIdx) => (
                    <div key={mIdx} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => {
                            const updated = [...newCourse.modules];
                            updated[mIdx].title = e.target.value;
                            setNewCourse({ ...newCourse, modules: updated });
                          }}
                          className="font-black text-sm text-gray-900 bg-white border border-gray-300 px-3 py-1.5 rounded-xl flex-1 mr-3"
                        />
                        {newCourse.modules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeModule(mIdx)}
                            className="text-red-600 font-bold text-xs hover:underline"
                          >
                            Delete Module
                          </button>
                        )}
                      </div>

                      {/* Lessons List in Module */}
                      <div className="space-y-3 pl-2 border-l-2 border-blue-300">
                        {m.lessons?.map((l, lIdx) => (
                          <div key={lIdx} className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-700">Lesson {lIdx + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeLesson(mIdx, lIdx)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                ✕ Remove
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2">
                                <label className="block font-semibold text-gray-600 text-[11px] mb-1">Title</label>
                                <input
                                  type="text"
                                  value={l.title}
                                  onChange={(e) => {
                                    const updated = [...newCourse.modules];
                                    updated[mIdx].lessons[lIdx].title = e.target.value;
                                    setNewCourse({ ...newCourse, modules: updated });
                                  }}
                                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block font-semibold text-gray-600 text-[11px] mb-1">Type</label>
                                <select
                                  value={l.lessonType}
                                  onChange={(e) => {
                                    const updated = [...newCourse.modules];
                                    updated[mIdx].lessons[lIdx].lessonType = e.target.value;
                                    setNewCourse({ ...newCourse, modules: updated });
                                  }}
                                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                                >
                                  <option value="VIDEO">Video</option>
                                  <option value="ARTICLE">Article</option>
                                  <option value="CODING">Coding Lab</option>
                                </select>
                              </div>
                            </div>

                            {l.lessonType === 'VIDEO' && (
                              <div>
                                <label className="block font-semibold text-gray-600 text-[11px] mb-1">Video URL (YouTube embed or MP4)</label>
                                <input
                                  type="text"
                                  value={l.videoUrl}
                                  onChange={(e) => {
                                    const updated = [...newCourse.modules];
                                    updated[mIdx].lessons[lIdx].videoUrl = e.target.value;
                                    setNewCourse({ ...newCourse, modules: updated });
                                  }}
                                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg font-mono text-[11px]"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block font-semibold text-gray-600 text-[11px] mb-1">Lesson Content / Description</label>
                              <textarea
                                rows={2}
                                value={l.content}
                                onChange={(e) => {
                                  const updated = [...newCourse.modules];
                                  updated[mIdx].lessons[lIdx].content = e.target.value;
                                  setNewCourse({ ...newCourse, modules: updated });
                                }}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                              />
                            </div>

                            {/* Media Resources */}
                            <div className="pt-2 border-t border-gray-100">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-gray-600 text-[11px]">📎 Attached Media & Files ({l.resources?.length || 0})</span>
                                <button
                                  type="button"
                                  onClick={() => addResourceToLesson(mIdx, lIdx)}
                                  className="text-blue-600 font-bold text-[11px] hover:underline"
                                >
                                  + Attach File/Link
                                </button>
                              </div>
                              {l.resources?.map((r, rIdx) => (
                                <div key={rIdx} className="grid grid-cols-2 gap-2 mb-2">
                                  <input
                                    type="text"
                                    placeholder="Resource Title (e.g. Slide PDF)"
                                    value={r.title}
                                    onChange={(e) => {
                                      const updated = [...newCourse.modules];
                                      updated[mIdx].lessons[lIdx].resources[rIdx].title = e.target.value;
                                      setNewCourse({ ...newCourse, modules: updated });
                                    }}
                                    className="px-2 py-1 border border-gray-200 rounded text-[11px]"
                                  />
                                  <input
                                    type="text"
                                    placeholder="URL (e.g. https://...)"
                                    value={r.url}
                                    onChange={(e) => {
                                      const updated = [...newCourse.modules];
                                      updated[mIdx].lessons[lIdx].resources[rIdx].url = e.target.value;
                                      setNewCourse({ ...newCourse, modules: updated });
                                    }}
                                    className="px-2 py-1 border border-gray-200 rounded text-[11px] font-mono"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => addLessonToModule(mIdx)}
                          className="text-xs font-bold text-blue-600 hover:underline block pt-1"
                        >
                          + Add Another Lesson
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addModule}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-2xl text-xs transition border border-dashed border-gray-300"
                  >
                    + Add New Module
                  </button>
                </div>
              )}

              {/* STEP 3: MODULE QUIZZES & PRACTICAL TASKS */}
              {builderStep === 3 && (
                <div className="space-y-6">
                  {newCourse.modules.map((m, mIdx) => (
                    <div key={mIdx} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                      <h4 className="font-black text-sm text-gray-900">{m.title}</h4>

                      {/* Quizzes */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-amber-700">📝 Module Assessments ({m.quizzes?.length || 0})</span>
                          <button
                            type="button"
                            onClick={() => addQuizToModule(mIdx)}
                            className="text-amber-600 font-bold text-xs hover:underline"
                          >
                            + Add Quiz
                          </button>
                        </div>

                        {m.quizzes?.map((q, qIdx) => (
                          <div key={qIdx} className="bg-white p-4 rounded-xl border border-amber-200 space-y-3 text-xs">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="col-span-2">
                                <label className="block font-bold text-gray-700 text-[11px] mb-1">Quiz Title</label>
                                <input
                                  type="text"
                                  value={q.title}
                                  onChange={(e) => {
                                    const updated = [...newCourse.modules];
                                    updated[mIdx].quizzes[qIdx].title = e.target.value;
                                    setNewCourse({ ...newCourse, modules: updated });
                                  }}
                                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-gray-700 text-[11px] mb-1">Passing Score %</label>
                                <input
                                  type="number"
                                  value={q.passingPercentage}
                                  onChange={(e) => {
                                    const updated = [...newCourse.modules];
                                    updated[mIdx].quizzes[qIdx].passingPercentage = e.target.value;
                                    setNewCourse({ ...newCourse, modules: updated });
                                  }}
                                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                                />
                              </div>
                            </div>

                            {/* Questions */}
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-600 text-[11px]">Questions ({q.questions?.length || 0})</span>
                                <button
                                  type="button"
                                  onClick={() => addQuestionToQuiz(mIdx, qIdx)}
                                  className="text-blue-600 font-bold text-[11px] hover:underline"
                                >
                                  + Add Question
                                </button>
                              </div>

                              {q.questions?.map((qu, quIdx) => (
                                <div key={quIdx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Question statement"
                                    value={qu.text}
                                    onChange={(e) => {
                                      const updated = [...newCourse.modules];
                                      updated[mIdx].quizzes[qIdx].questions[quIdx].text = e.target.value;
                                      setNewCourse({ ...newCourse, modules: updated });
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded font-semibold text-xs"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    {['A', 'B', 'C', 'D'].map(opt => (
                                      <input
                                        key={opt}
                                        type="text"
                                        placeholder={`Option ${opt}`}
                                        value={qu[`option${opt}`]}
                                        onChange={(e) => {
                                          const updated = [...newCourse.modules];
                                          updated[mIdx].quizzes[qIdx].questions[quIdx][`option${opt}`] = e.target.value;
                                          setNewCourse({ ...newCourse, modules: updated });
                                        }}
                                        className="px-2 py-1 border border-gray-200 rounded text-[11px]"
                                      />
                                    ))}
                                  </div>
                                  <div className="flex items-center space-x-2 text-[11px]">
                                    <span className="font-bold text-gray-700">Correct Answer:</span>
                                    <select
                                      value={qu.correctOption}
                                      onChange={(e) => {
                                        const updated = [...newCourse.modules];
                                        updated[mIdx].quizzes[qIdx].questions[quIdx].correctOption = e.target.value;
                                        setNewCourse({ ...newCourse, modules: updated });
                                      }}
                                      className="px-2 py-0.5 border border-gray-300 rounded font-bold"
                                    >
                                      <option value="A">Option A</option>
                                      <option value="B">Option B</option>
                                      <option value="C">Option C</option>
                                      <option value="D">Option D</option>
                                    </select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Practical Activities */}
                      <div className="space-y-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-blue-700">🎯 Module Action Task / Project</span>
                          <button
                            type="button"
                            onClick={() => addActivityToModule(mIdx)}
                            className="text-blue-600 font-bold text-xs hover:underline"
                          >
                            + Add Activity Task
                          </button>
                        </div>

                        {m.activities?.map((a, aIdx) => (
                          <div key={aIdx} className="bg-white p-4 rounded-xl border border-blue-200 space-y-3 text-xs">
                            <input
                              type="text"
                              placeholder="Activity Title (e.g. Build CRUD API & Upload Proof)"
                              value={a.title}
                              onChange={(e) => {
                                const updated = [...newCourse.modules];
                                updated[mIdx].activities[aIdx].title = e.target.value;
                                setNewCourse({ ...newCourse, modules: updated });
                              }}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg font-bold"
                            />
                            <textarea
                              rows={2}
                              placeholder="Detailed task instructions and requirements for students..."
                              value={a.description}
                              onChange={(e) => {
                                const updated = [...newCourse.modules];
                                updated[mIdx].activities[aIdx].description = e.target.value;
                                setNewCourse({ ...newCourse, modules: updated });
                              }}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stepper Footer Controls */}
            <div className="pt-6 border-t border-gray-200 flex justify-between items-center">
              <div>
                {builderStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setBuilderStep(builderStep - 1)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition"
                  >
                    ← Previous Step
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                {builderStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setBuilderStep(builderStep + 1)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow transition"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateCourse}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-black text-xs shadow-lg transition"
                  >
                    Publish Course & Curriculum 🎉
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRADING MODAL */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-gray-900 mb-1">Grade Student Submission</h3>
            <p className="text-xs text-gray-500 mb-4">{selectedSubmission.assignmentTitle} • {selectedSubmission.studentName}</p>

            {selectedSubmission.submissionUrl && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                <span className="font-bold text-blue-900 block mb-1">Proof Document / Image / Repository:</span>
                <a href={selectedSubmission.submissionUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono break-all">
                  {selectedSubmission.submissionUrl}
                </a>
              </div>
            )}

            {selectedSubmission.studentNotes && (
              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs">
                <span className="font-bold text-gray-700 block mb-1">Student Notes:</span>
                <p className="text-gray-600">{selectedSubmission.studentNotes}</p>
              </div>
            )}

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Marks Obtained (Max: {selectedSubmission.maxMarks})</label>
                <input
                  type="number"
                  min="0"
                  max={selectedSubmission.maxMarks}
                  required
                  value={gradingMarks}
                  onChange={(e) => setGradingMarks(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Instructor Feedback</label>
                <textarea
                  rows={3}
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  placeholder="Provide constructive feedback on code quality, design, and adherence..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Save & Publish Grade
                </button>
                <button
                  type="button"
                  onClick={handleReturnSubmission}
                  className="px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-200 transition"
                >
                  Request Resubmission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSTRUCTOR PREVIEW MODAL */}
      {previewCourse && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setPreviewCourse(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full"
            >
              ✕
            </button>

            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md self-start">
              Curriculum Outline Preview
            </span>
            <h2 className="text-2xl font-black text-gray-900 mt-2">{previewCourse.title}</h2>
            <p className="text-xs text-gray-500 mb-4">{previewCourse.description}</p>

            <div className="flex-1 overflow-y-auto space-y-4 my-4 pr-1">
              {previewCourse.modules?.map((m, mIdx) => (
                <div key={mIdx} className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                  <h4 className="text-xs font-black text-gray-900 mb-2">{m.title}</h4>
                  <ul className="space-y-1.5 pl-3 border-l-2 border-blue-300 text-xs text-gray-600">
                    {m.lessons?.map((l, lIdx) => (
                      <li key={lIdx} className="flex justify-between items-center">
                        <span>▶ {l.title}</span>
                        <span className="text-[10px] text-gray-400 font-mono uppercase">{l.lessonType}</span>
                      </li>
                    ))}
                  </ul>
                  {m.quizzes?.length > 0 && (
                    <p className="mt-2 text-[11px] font-bold text-amber-700">📝 {m.quizzes.length} Quizzes configured</p>
                  )}
                  {m.assignments?.length > 0 && (
                    <p className="mt-1 text-[11px] font-bold text-blue-700">🎯 {m.assignments.length} Action Tasks configured</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STUDENT PROFILE MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-gray-900 mb-1">{selectedStudent.student?.fullName}</h3>
            <p className="text-xs text-gray-500 mb-4">{selectedStudent.student?.email} • {selectedStudent.student?.location}</p>

            <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-bold">
              <div className="p-3 bg-blue-50 text-blue-900 rounded-xl">
                Enrolled: {selectedStudent.learningSummary?.coursesEnrolled} Courses
              </div>
              <div className="p-3 bg-green-50 text-green-900 rounded-xl">
                Completed: {selectedStudent.learningSummary?.coursesCompleted} Courses
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">Skills & Bio</h4>
              <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl">{selectedStudent.student?.bio}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
