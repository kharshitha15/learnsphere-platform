import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import CourseCard from '../components/ui/CourseCard';
import { courseImageMap } from '../constants/courseAssets';

const HomeLandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState(null);
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const endpoint = user ? '/student/explore' : '/courses';
      const res = await api.get(endpoint);
      if (res.data && res.data.length > 0) {
        const validCourses = res.data.filter(c => c.id <= 8).map(c => ({
          ...c,
          thumbnailUrl: courseImageMap[c.title] || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
          rating: c.rating || 4.8,
          totalRatings: c.reviewsCount || 128 + c.id * 15,
          enrolledStudentsCount: c.learnersCount || 1200 + c.id * 95
        }));
        setCourses(validCourses);
      } else {
        throw new Error('No courses found');
      }
    } catch (err) {
      console.warn('Using standard courses for showcase', err);
      setCourses([
        {
          id: 1,
          title: "Spring Boot & REST API Development",
          description: "Build production-ready backend microservices and RESTful APIs with Spring Boot, JPA, Hibernate, and Spring Security.",
          category: "Web Development",
          difficulty: "Intermediate",
          rating: 4.9,
          totalRatings: 342,
          enrolledStudentsCount: 2450,
          thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
          instructorName: "Suresh Babu",
          isEnrolled: false
        },
        {
          id: 2,
          title: "Java Programming Fundamentals",
          description: "Master object-oriented programming, modern Java syntax, collections framework, and clean software design patterns.",
          category: "Programming",
          difficulty: "Beginner",
          rating: 4.9,
          totalRatings: 289,
          enrolledStudentsCount: 2180,
          thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
          instructorName: "Suresh Babu",
          isEnrolled: false
        },
        {
          id: 3,
          title: "React.js for Beginners",
          description: "Learn modern component architecture, hooks (useState, useEffect), state management, and production UI engineering.",
          category: "Web Development",
          difficulty: "Beginner",
          rating: 4.8,
          totalRatings: 215,
          enrolledStudentsCount: 1890,
          thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80",
          instructorName: "Lakshmi Devi",
          isEnrolled: false
        },
        {
          id: 4,
          title: "SQL & Database Management",
          description: "Master relational databases, SQL queries, multi-table JOINs, indexing, transactions, and schema normalization.",
          category: "Databases",
          difficulty: "Beginner",
          rating: 4.9,
          totalRatings: 180,
          enrolledStudentsCount: 1650,
          thumbnailUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80",
          instructorName: "Suresh Babu",
          isEnrolled: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId, e) => {
    if (e) e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setEnrollingCourseId(courseId);
    try {
      const res = await api.post('/enrollments/enroll/' + courseId);
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isEnrolled: true } : c));
      
      if (res.data?.alreadyEnrolled) {
        showToast('You are already enrolled! Opening classroom...');
        setTimeout(() => {
          navigate('/learning/' + courseId);
        }, 800);
        return;
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      showToast('🎉 Successfully enrolled! Opening classroom...');
      
      setTimeout(() => {
        navigate('/learning/' + courseId);
      }, 1000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Enrollment processed';
      if (msg.toLowerCase().includes('already')) {
        navigate('/learning/' + courseId);
      } else {
        showToast(msg);
      }
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const filteredCourses = courses.filter(c => {
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.instructorName && c.instructorName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const faqs = [
    {
      q: "Are the courses and learning materials free for students?",
      a: "Yes! All courses on LearnSphere are fully open and accessible to enrolled students, including video lessons, interactive code sandbox, downloadable documentation, and quizzes."
    },
    {
      q: "How do quizzes, assignments, and certificates work?",
      a: "Each course module includes interactive quizzes with real-time feedback and assignments where you upload your code solutions. Once you reach 100% completion and pass your assessments, you earn a verified LearnSphere digital certificate."
    },
    {
      q: "Can I practice coding directly in my web browser?",
      a: "Absolutely! The LearnSphere classroom features an integrated live code sandbox where you can write HTML, CSS, JavaScript, and Java snippets and view live output side-by-side with the lesson video."
    },
    {
      q: "How can I ask questions if I get stuck on a topic?",
      a: "Every lesson features a dedicated Q&A forum and private timestamped notes panel. Our instructors and community peers review questions and provide guidance."
    }
  ];

  return (
    <div className="w-full bg-white text-[#1f1f1f] font-sans antialiased">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[9999] bg-[#0056d2] text-white px-5 py-3 rounded shadow-lg text-sm font-semibold">
          {toastMsg}
        </div>
      )}

      {/* 1. COURSERA HERO BANNER */}
      <section id="hero" className="relative pt-12 pb-16 overflow-hidden bg-[#0056d2] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6 text-left">
              <p className="text-xs font-bold text-blue-100 uppercase tracking-widest">
                Learn Without Limits
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight leading-[1.12]">
                Start, switch, or advance your career with top courses
              </h1>

              <p className="text-white/90 text-lg leading-relaxed max-w-xl font-normal">
                Video lectures, readings, quizzes, and hands-on projects from leading software architects. Earn shareable certificates.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to={user ? "/courses" : "/register"}
                  className="bg-white text-[#0056d2] font-bold text-sm px-8 py-3.5 rounded hover:bg-[#f5f7f8] transition shadow-xs"
                >
                  {user ? "Explore Courses" : "Join for Free"}
                </Link>
                <Link
                  to="/courses"
                  className="border-2 border-white text-white font-bold text-sm px-8 py-3.5 rounded hover:bg-white/10 transition"
                >
                  Browse Catalog
                </Link>
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <div className="flex -space-x-2.5 overflow-hidden">
                  <img className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Student" />
                  <img className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Student" />
                  <img className="inline-block h-9 w-9 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="Student" />
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold text-white ring-2 ring-white">
                    +2.5k
                  </div>
                </div>

                <div className="text-left text-xs text-white/90">
                  <div className="text-amber-300">★★★★★</div>
                  <p className="mt-0.5">
                    Join <span className="font-bold text-white">2,500+ students</span> mastering modern software engineering
                  </p>
                </div>
              </div>
            </div>

            {/* Hero Right Preview Card */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="bg-white rounded-lg shadow-2xl border border-white/20 p-4 w-full max-w-md text-left text-[#1f1f1f]">
                <div className="relative aspect-video rounded overflow-hidden mb-4 bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80"
                    alt="LearnSphere Learning Environment"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white text-[#0056d2] flex items-center justify-center font-bold text-lg shadow-lg">
                      ▶
                    </div>
                  </div>
                </div>
                
                <span className="text-[10px] font-bold uppercase text-[#0056d2] bg-blue-50 px-2 py-0.5 rounded">
                  Interactive Classroom
                </span>
                <h3 className="text-base font-bold text-[#1f1f1f] mt-1">
                  Spring Boot & REST API Development
                </h3>
                <p className="text-xs text-[#636363] mt-1">
                  Taught by Suresh Babu • Ex-Enterprise Architect
                </p>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#e5e5e5] text-xs">
                  <span className="font-bold text-[#1a7f37]">✓ 100% Online & Self-Paced</span>
                  <Link
                    to="/courses/1"
                    className="text-[#0056d2] font-bold hover:underline"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. PARTNERS / INSTITUTIONS STRIP */}
      <section className="py-8 bg-[#f5f7fa] border-b border-[#e1e6eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold text-[#636363] uppercase tracking-wider mb-5">
            We collaborate with industry leaders and academic institutes
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-[#636363] font-bold text-sm sm:text-base">
            <span className="hover:text-[#0056d2] transition cursor-default">Google</span>
            <span className="hover:text-[#0056d2] transition cursor-default">Stanford Online</span>
            <span className="hover:text-[#0056d2] transition cursor-default">IBM</span>
            <span className="hover:text-[#0056d2] transition cursor-default">Meta</span>
            <span className="hover:text-[#0056d2] transition cursor-default">Duke University</span>
            <span className="hover:text-[#0056d2] transition cursor-default">LearnSphere Enterprise</span>
          </div>
        </div>
      </section>

      {/* 3. VALUE PILLARS (ACHIEVE YOUR GOALS) */}
      <section className="py-16 bg-white border-b border-[#e1e6eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1f1f1f] tracking-tight">
            Achieve your goals with LearnSphere
          </h2>
          <p className="text-sm text-[#636363] mt-2 max-w-xl mx-auto">
            Everything you need to go from fundamentals to production software engineer.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 text-left">
            <div className="p-6 bg-[#f5f7fa] border border-[#e1e6eb] rounded-lg">
              <div className="w-10 h-10 rounded bg-[#e8f0fe] text-[#0056d2] flex items-center justify-center font-bold text-lg mb-4">
                🎯
              </div>
              <h3 className="text-base font-bold text-[#1f1f1f] mb-1.5">
                Learn the latest skills
              </h3>
              <p className="text-xs text-[#636363] leading-relaxed">
                Master modern frameworks like Spring Boot 3, Java 17, and React 18 through practical code examples.
              </p>
            </div>

            <div className="p-6 bg-[#f5f7fa] border border-[#e1e6eb] rounded-lg">
              <div className="w-10 h-10 rounded bg-[#e8f0fe] text-[#0056d2] flex items-center justify-center font-bold text-lg mb-4">
                💻
              </div>
              <h3 className="text-base font-bold text-[#1f1f1f] mb-1.5">
                Interactive Code Sandbox
              </h3>
              <p className="text-xs text-[#636363] leading-relaxed">
                Run code directly inside your web browser side-by-side with video lectures. No local setup friction.
              </p>
            </div>

            <div className="p-6 bg-[#f5f7fa] border border-[#e1e6eb] rounded-lg">
              <div className="w-10 h-10 rounded bg-[#e8f0fe] text-[#0056d2] flex items-center justify-center font-bold text-lg mb-4">
                📝
              </div>
              <h3 className="text-base font-bold text-[#1f1f1f] mb-1.5">
                Graded Assessments
              </h3>
              <p className="text-xs text-[#636363] leading-relaxed">
                Reinforce concept retention with multiple-choice quizzes, instant feedback, and anti-cheat tracking.
              </p>
            </div>

            <div className="p-6 bg-[#f5f7fa] border border-[#e1e6eb] rounded-lg">
              <div className="w-10 h-10 rounded bg-[#e8f0fe] text-[#0056d2] flex items-center justify-center font-bold text-lg mb-4">
                🎓
              </div>
              <h3 className="text-base font-bold text-[#1f1f1f] mb-1.5">
                Verified Certificates
              </h3>
              <p className="text-xs text-[#636363] leading-relaxed">
                Earn verifiable digital credentials with unique verification codes to showcase on your LinkedIn profile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COURSE CATALOG SECTION */}
      <section id="courses" className="py-16 bg-[#f5f7fa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1f1f1f]">
                Explore Courses & Specializations
              </h2>
              <p className="text-xs text-[#636363] mt-1">
                Choose from curriculum-backed courses designed for students and professionals.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px]">
                <input
                  type="text"
                  placeholder="Search courses or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#e1e6eb] rounded px-3.5 py-2 pl-8 text-xs focus:outline-none focus:border-[#0056d2]"
                />
                <span className="absolute left-2.5 top-2.5 text-xs text-[#636363]">🔍</span>
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-[#e1e6eb] rounded px-3 py-2 text-xs font-semibold text-[#1f1f1f] focus:outline-none focus:border-[#0056d2]"
              >
                <option value="ALL">All Topics</option>
                <option value="Web Development">Web Development</option>
                <option value="Programming">Programming</option>
                <option value="Databases">Databases</option>
                <option value="Tools">Tools & Git</option>
                <option value="Data Structures">Data Structures</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {filteredCourses.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                onClick={(id) => navigate('/courses/' + id)}
                onEnroll={(id, e) => handleEnroll(id, e)}
                enrolling={enrollingCourseId}
                isEnrolled={c.isEnrolled}
              />
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/courses"
              className="inline-block bg-white border border-[#0056d2] text-[#0056d2] hover:bg-[#0056d2] hover:text-white font-bold text-xs px-8 py-3 rounded transition"
            >
              View All Courses in Catalog →
            </Link>
          </div>

        </div>
      </section>

      {/* 5. TESTIMONIALS & OUTCOMES */}
      <section id="testimonials" className="py-16 bg-white border-y border-[#e1e6eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-[#0056d2] uppercase tracking-wider">Learner Outcomes</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1f1f1f] mt-1">
            Real stories from the LearnSphere community
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 text-left">
            <div className="bg-[#f5f7fa] p-6 rounded-lg border border-[#e1e6eb] space-y-3">
              <div className="text-amber-500 text-xs">★★★★★</div>
              <p className="text-xs text-[#636363] leading-relaxed italic">
                "The Spring Boot & REST API course gave me the exact hands-on architecture skills needed for my backend interview. The integrated sandbox made practicing seamless!"
              </p>
              <div className="flex items-center space-x-3 pt-3 border-t border-[#e5e5e5]">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" className="w-8 h-8 rounded-full object-cover" alt="Ravi Kumar" />
                <div>
                  <p className="text-xs font-bold text-[#1f1f1f]">Ravi Kumar</p>
                  <p className="text-[10px] text-[#636363]">Java Full Stack Developer</p>
                </div>
              </div>
            </div>

            <div className="bg-[#f5f7fa] p-6 rounded-lg border border-[#e1e6eb] space-y-3">
              <div className="text-amber-500 text-xs">★★★★★</div>
              <p className="text-xs text-[#636363] leading-relaxed italic">
                "Lakshmi's React.js for Beginners made component lifecycle, hooks, and responsive design click for me. I built 3 production portfolio apps in 4 weeks."
              </p>
              <div className="flex items-center space-x-3 pt-3 border-t border-[#e5e5e5]">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" className="w-8 h-8 rounded-full object-cover" alt="Priya Sharma" />
                <div>
                  <p className="text-xs font-bold text-[#1f1f1f]">Priya Sharma</p>
                  <p className="text-[10px] text-[#636363]">Frontend Engineer</p>
                </div>
              </div>
            </div>

            <div className="bg-[#f5f7fa] p-6 rounded-lg border border-[#e1e6eb] space-y-3">
              <div className="text-amber-500 text-xs">★★★★★</div>
              <p className="text-xs text-[#636363] leading-relaxed italic">
                "The Data Structures & Algorithms course with quizzes and anti-cheat tracking kept me disciplined. I cracked my campus placement technical rounds!"
              </p>
              <div className="flex items-center space-x-3 pt-3 border-t border-[#e5e5e5]">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" className="w-8 h-8 rounded-full object-cover" alt="Raju Reddy" />
                <div>
                  <p className="text-xs font-bold text-[#1f1f1f]">Raju Reddy</p>
                  <p className="text-[10px] text-[#636363]">Software Engineer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section id="faq" className="py-16 bg-[#f5f7fa]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1f1f1f] mb-8">
            Frequently Asked Questions
          </h2>

          <div className="divide-y divide-[#e1e6eb] border border-[#e1e6eb] rounded-lg bg-white">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-5 text-left">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-[#1f1f1f]"
                >
                  <span>{faq.q}</span>
                  <span className="text-[#0056d2] text-lg font-bold ml-4">
                    {activeFaq === idx ? '−' : '+'}
                  </span>
                </button>
                {activeFaq === idx && (
                  <p className="mt-3 text-xs text-[#636363] leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomeLandingPage;
