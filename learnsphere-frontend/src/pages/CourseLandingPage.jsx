import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import StarRating from '../components/ui/StarRating';
import { getCourseImage } from '../constants/courseAssets';

const courseMetadata = {
  "Spring Boot & REST API Development": {
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
    instructorImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    instructorRole: "Java & Spring Boot Lead | Ex-Enterprise Architect",
    partner: "LearnSphere Software Engineering Academy",
    partnerLogoText: "LEARNSPHERE ENTERPRISE",
    stack: ["Spring Boot 3", "Java 17", "Spring Data JPA", "MySQL", "Spring Security", "REST APIs"],
    competencies: [
      "Build production-grade REST APIs following OpenAPI standards and enterprise controller best practices.",
      "Implement robust persistence using Spring Data JPA, Hibernate, and optimized SQL queries.",
      "Secure endpoints with stateless JWT authentication, password hashing, and role-based permissions.",
      "Write automated unit and integration tests using JUnit 5, Mockito, and Spring MockMvc.",
      "Structure multi-tier scalable backend services using industry standard clean architecture.",
      "Deploy containerized microservices ready for continuous integration and cloud monitoring."
    ]
  },
  "Java Programming Fundamentals": {
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80",
    instructorImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    instructorRole: "Senior Java Architect & Technical Mentor",
    partner: "LearnSphere School of Computer Science",
    partnerLogoText: "LEARNSPHERE CS",
    stack: ["Java 17", "JVM Architecture", "OOP", "Collections Framework", "Streams API", "Multithreading"],
    competencies: [
      "Master core object-oriented principles: encapsulation, inheritance, polymorphism, and abstraction.",
      "Leverage Java Collections (List, Set, Map) and write high-efficiency stream pipelines.",
      "Handle exceptions resiliently using custom checked and unchecked exception strategies.",
      "Design clean, reusable classes and understand JVM memory allocation and garbage collection.",
      "Process input/output with modern Java NIO and JSON serialization frameworks.",
      "Build algorithmic problem-solving confidence for technical software engineering rounds."
    ]
  },
  "React.js for Beginners": {
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80",
    instructorImg: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
    instructorRole: "Frontend Lead & UI/UX Specialist",
    partner: "LearnSphere Interactive Media & Web Labs",
    partnerLogoText: "LEARNSPHERE WEB",
    stack: ["React 18", "Vite", "React Hooks", "Tailwind CSS", "React Router", "Axios"],
    competencies: [
      "Construct modular component trees utilizing modern functional React and JSX rendering.",
      "Master stateful React Hooks including useState, useEffect, useRef, and custom reusable hooks.",
      "Implement client-side navigation with dynamic route parameters using React Router.",
      "Integrate asynchronous backend REST services seamlessly with Axios and error boundaries.",
      "Style sleek, accessible, responsive user interfaces following design systems and Tailwind CSS.",
      "Debug and optimize web rendering performance using React Developer Tools."
    ]
  },
  "SQL & Database Management": {
    image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80",
    instructorImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    instructorRole: "Database Administrator & Data Architect",
    partner: "LearnSphere Data Systems Institute",
    partnerLogoText: "DATA INSTITUTE",
    stack: ["MySQL", "Relational Modeling", "Advanced JOINs", "Indexing", "ACID Transactions", "Normalization"],
    competencies: [
      "Design normalized relational databases that eliminate data redundancy and preserve integrity.",
      "Author complex multi-table queries utilizing INNER, LEFT, RIGHT, and FULL OUTER joins.",
      "Perform aggregation, data transformation, and window functions for actionable business insights.",
      "Implement indexing strategies and query execution plan analysis to eliminate latency bottlenecks.",
      "Manage ACID-compliant transactions with atomic commits and rollback safeguards.",
      "Apply security policies, user privileges, and automated data backup routines."
    ]
  },
  "Git & GitHub for Developers": {
    image: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&auto=format&fit=crop&q=80",
    instructorImg: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
    instructorRole: "DevOps Engineer & Open-Source Mentor",
    partner: "LearnSphere Developer Tooling Collective",
    partnerLogoText: "DEVOPS COLLECTIVE",
    stack: ["Git CLI", "GitHub", "Branching Workflows", "Merge Conflicts", "Pull Requests", "Git Rebase"],
    competencies: [
      "Master Git internals: commits, trees, blobs, working tree, and staging index.",
      "Manage professional Git flow branching, feature development, and release tags.",
      "Diagnose and resolve intricate three-way merge and rebase conflicts confidently.",
      "Collaborate effectively on GitHub through comprehensive pull requests and code reviews.",
      "Safely recover lost commits using git reflog, reset, and revert strategies.",
      "Automate testing and continuous deployment triggers using GitHub Actions workflows."
    ]
  },
  "Data Structures & Algorithms in Java": {
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
    instructorImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    instructorRole: "Competitive Programmer & Algorithms Instructor",
    partner: "LearnSphere Algorithmics Lab",
    partnerLogoText: "ALGORITHMICS",
    stack: ["Big-O Notation", "Arrays & Strings", "Linked Lists", "Trees & Graphs", "Dynamic Programming", "Recursion"],
    competencies: [
      "Formally analyze Big-O time and space complexities for algorithmic solutions.",
      "Implement fundamental data structures: dynamic arrays, linked lists, stacks, and queues.",
      "Traverse trees and graphs using BFS, DFS, and topological sorting techniques.",
      "Apply divide-and-conquer, two-pointer, and sliding window optimization patterns.",
      "Solve classic dynamic programming challenges with memoization and tabulation.",
      "Ace technical interview coding evaluations with structured problem breakdown methods."
    ]
  },
  "HTML, CSS & JavaScript": {
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80",
    instructorImg: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
    instructorRole: "Web Standards & Creative Frontend Lead",
    partner: "LearnSphere Interactive Web Academy",
    partnerLogoText: "WEB ACADEMY",
    stack: ["HTML5", "CSS3", "Flexbox & Grid", "ES6+ JavaScript", "DOM Events", "Responsive Design"],
    competencies: [
      "Write accessible, semantically valid HTML5 that adheres to WCAG standards.",
      "Create fluid responsive web layouts using modern CSS Flexbox, Grid, and media queries.",
      "Understand modern JavaScript syntax, async/await, closures, and the event loop.",
      "Manipulate browser DOM elements dynamically and handle user events smoothly.",
      "Interact with third-party web APIs using the Fetch API and localStorage persistence.",
      "Deploy cross-browser compatible websites optimized for both mobile and desktop screens."
    ]
  },
  "Python Programming Fundamentals": {
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
    instructorImg: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
    instructorRole: "Python Automation & Software Developer",
    partner: "LearnSphere Applied Computing Institute",
    partnerLogoText: "PYTHON LABS",
    stack: ["Python 3", "Data Structures", "Functions", "OOP in Python", "File Handling", "Automation Scripts"],
    competencies: [
      "Write clean, idiomatic Python code leveraging lists, dictionaries, tuples, and sets.",
      "Structure programs with modular functions, modules, and error-handling try-except blocks.",
      "Implement object-oriented designs using classes, inheritance, and Python dunder methods.",
      "Process file streams, parse JSON data, and automate operating system tasks.",
      "Leverage external Python packages via pip and manage virtual environments.",
      "Build automated data processing scripts for everyday technical developer workflows."
    ]
  }
};

const CourseLandingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [expandedModules, setExpandedModules] = useState({ 0: true });
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses/' + id + '/preview');
      const data = res.data || {};
      
      setCourse(data);
      setCurriculum(data.curriculum || []);
      setReviews(data.reviews || data.recentReviews || []);

      if (user) {
        try {
          const checkRes = await api.get('/enrollments/check/' + id);
          if (checkRes.data?.isEnrolled) {
            setIsEnrolled(true);
          } else {
            const expRes = await api.get('/student/explore');
            const found = (expRes.data || []).find(c => c.id === parseInt(id));
            if (found && found.isEnrolled) {
              setIsEnrolled(true);
            }
          }
        } catch (e) {
          console.error('Enrollment check failed', e);
        }
      }
    } catch (err) {
      console.warn('Backend course preview not found, using fallback data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [id, user]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isEnrolled) {
      navigate('/learning/' + (course?.id || id || 1));
      return;
    }
    setEnrolling(true);
    try {
      const courseIdToEnroll = course?.id || id || 1;
      await api.post('/enrollments/enroll/' + courseIdToEnroll);
      setIsEnrolled(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      showToast('🎉 Successfully enrolled! Redirecting to classroom...');
      setTimeout(() => {
        navigate('/learning/' + courseIdToEnroll);
      }, 1000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Enrollment completed!';
      if (msg.toLowerCase().includes('already')) {
        setIsEnrolled(true);
        navigate('/learning/' + (course?.id || id || 1));
      } else {
        showToast(msg);
      }
    } finally {
      setEnrolling(false);
    }
  };

  const toggleModule = (idx) => {
    setExpandedModules(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex flex-col items-center justify-center text-[#1f1f1f]">
        <div className="w-10 h-10 border-4 border-[#0056d2]/20 border-t-[#0056d2] rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-[#636363]">Loading course details...</p>
      </div>
    );
  }

  const courseTitle = course?.title || 'Spring Boot & REST API Development';
  const meta = courseMetadata[courseTitle] || courseMetadata["Spring Boot & REST API Development"];

  const desc = course?.description || 'Build production-ready backend microservices and RESTful APIs with Spring Boot, JPA, Hibernate, and Spring Security.';
  const category = course?.category || 'Web Development';
  const difficulty = course?.difficulty || course?.level || 'Intermediate';
  const rawInstructor = course?.instructorName || course?.instructor?.fullName || 'Suresh Babu';
  const instructorRole = meta.instructorRole || 'Senior Software Architect';
  const instructorBio = course?.instructor?.bio || course?.instructorBio || "Senior software architect and educator with 10+ years enterprise engineering experience.";
  const rating = course?.rating || course?.avgRating || 4.8;
  const totalReviews = course?.totalRatings || course?.reviewsCount || 1482;
  const learnersCount = course?.enrolledStudentsCount || course?.studentsCount || course?.learners || 2450;
  const totalLessons = course?.totalLessons || (curriculum.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)) || 24;
  const durationHours = course?.totalDurationHours || Math.max(4, Math.round(totalLessons * 25 / 60));
  const videoUrl = course?.previewVideoUrl || "https://www.youtube.com/embed/9SGDpanrc8U";

  const faqs = [
    {
      q: 'When will I have access to the course lectures and assignments?',
      a: 'Access to lectures and assignments begins immediately upon enrollment. You can proceed at your own pace from any computer or mobile device.'
    },
    {
      q: 'What do I receive when I complete this course?',
      a: 'Upon passing all module quizzes and hands-on coding labs, you will receive a verifiable, shareable digital Certificate of Completion with a unique verification code.'
    },
    {
      q: 'What prior programming experience is required?',
      a: 'This course starts with fundamental concepts and builds progressively. Basic computer literacy and fundamental logic concepts are all you need to start.'
    },
    {
      q: 'Can I practice coding directly in my browser?',
      a: 'Yes! Our course environment includes a full interactive code sandbox so you can write, run, and experiment with real code alongside video lectures.'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-[#1f1f1f] font-sans antialiased">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[9999] bg-[#0056d2] text-white px-5 py-3 rounded shadow-xl flex items-center space-x-3 text-sm font-semibold">
          <span>✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Video Preview Modal */}
      {videoModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setVideoModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-3xl bg-white rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 bg-[#002758] text-white">
              <span className="text-sm font-bold">Course Video Preview</span>
              <button 
                onClick={() => setVideoModalOpen(false)} 
                className="text-white/80 hover:text-white text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>
            
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                <iframe
                  src={videoUrl.replace('watch?v=', 'embed/')}
                  title="Course Teaser"
                  className="w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="p-4 bg-[#f5f7fa] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#1f1f1f]">{courseTitle}</p>
                <p className="text-xs text-[#636363]">Taught by {rawInstructor}</p>
              </div>
              <button
                onClick={() => {
                  setVideoModalOpen(false);
                  handleEnroll();
                }}
                className="bg-[#0056d2] hover:bg-[#00419e] text-white font-bold text-xs px-5 py-2.5 rounded transition"
              >
                {isEnrolled ? 'Go to Classroom' : 'Enroll for Free'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. COURSERA HERO BANNER (DEEP NAVY) */}
      <section className="bg-[#002758] text-white pt-8 pb-14 border-b border-[#001e47]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-xs text-white/70 mb-6">
            <Link to="/" className="hover:text-white transition">Home</Link>
            <span>&gt;</span>
            <Link to="/courses" className="hover:text-white transition">Browse</Link>
            <span>&gt;</span>
            <span className="text-white/90">{category}</span>
            <span>&gt;</span>
            <span className="text-white font-semibold truncate max-w-xs">{courseTitle}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Hero Column */}
            <div className="lg:col-span-8 space-y-4 text-left">
              
              {/* Partner Banner */}
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-white/10 px-2.5 py-1 rounded text-[11px] font-bold tracking-wider uppercase text-blue-200 border border-white/15">
                  {meta.partnerLogoText}
                </div>
                <span className="text-xs text-white/80 font-medium">
                  {meta.partner}
                </span>
              </div>

              {/* Course Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                {courseTitle}
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-white/90 leading-relaxed font-normal max-w-2xl">
                {desc}
              </p>

              {/* Instructor Line */}
              <div className="flex items-center space-x-2 text-sm text-white/85 pt-1">
                <span className="text-white/60">Taught by</span>
                <span className="font-semibold text-white underline cursor-pointer">{rawInstructor}</span>
                <span className="text-white/40">•</span>
                <span className="text-white/80">{instructorRole}</span>
              </div>

              {/* Rating & Learners Line */}
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded">
                  <span className="text-amber-300 font-bold text-sm">★ {rating}</span>
                  <span className="text-white/70">({totalReviews.toLocaleString()} reviews)</span>
                </div>
                <div className="text-white/80">
                  <span className="font-bold text-white">{Number(learnersCount).toLocaleString()}</span> already enrolled
                </div>
              </div>

              {/* Enroll Action Group */}
              <div className="pt-4 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="bg-[#0056d2] hover:bg-[#00419e] text-white font-bold text-base px-8 py-3.5 rounded transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {enrolling ? 'Enrolling...' : isEnrolled ? 'Go to Course 🚀' : 'Enroll for Free'}
                  </button>

                  <button
                    onClick={() => setVideoModalOpen(true)}
                    className="flex items-center space-x-2 bg-transparent hover:bg-white/10 text-white font-bold text-sm px-5 py-3.5 rounded border border-white/40 transition cursor-pointer"
                  >
                    <span>▶</span>
                    <span>Preview Course</span>
                  </button>
                </div>

                <p className="text-xs text-white/75 pt-1">
                  <span className="font-semibold text-white">Starts today</span> · Financial aid available for eligible students
                </p>
              </div>

            </div>

            {/* Right Hero Specs Card */}
            <div className="lg:col-span-4">
              <div className="bg-white text-[#1f1f1f] rounded-lg shadow-xl border border-[#e1e6eb] overflow-hidden">
                <div 
                  className="relative aspect-video bg-[#001e47] cursor-pointer group"
                  onClick={() => setVideoModalOpen(true)}
                >
                  <img
                    src={meta.image}
                    alt={courseTitle}
                    className="w-full h-full object-cover group-hover:opacity-90 transition"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition">
                    <div className="w-12 h-12 rounded-full bg-white text-[#0056d2] flex items-center justify-center text-base font-bold shadow-lg group-hover:scale-105 transition">
                      ▶
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Preview Video
                  </span>
                </div>

                <div className="p-5 space-y-4 text-left">
                  <div className="border-b border-[#e5e5e5] pb-3">
                    <p className="text-xs font-bold text-[#1f1f1f] uppercase tracking-wider">
                      Course Specifications
                    </p>
                  </div>

                  <ul className="space-y-3 text-xs text-[#636363]">
                    <li className="flex items-center space-x-3">
                      <span className="text-[#0056d2] text-sm">🎓</span>
                      <div>
                        <strong className="text-[#1f1f1f] block">Shareable Certificate</strong>
                        <span>Add to your LinkedIn profile or resume</span>
                      </div>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-[#0056d2] text-sm">🌐</span>
                      <div>
                        <strong className="text-[#1f1f1f] block">100% Online Learning</strong>
                        <span>Start instantly and learn at your own schedule</span>
                      </div>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-[#0056d2] text-sm">⏱️</span>
                      <div>
                        <strong className="text-[#1f1f1f] block">Approx. {durationHours} hours</strong>
                        <span>{totalLessons} lessons & hands-on quizzes</span>
                      </div>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-[#0056d2] text-sm">📊</span>
                      <div>
                        <strong className="text-[#1f1f1f] block">{difficulty} Level</strong>
                        <span>Recommended for learners with foundational skills</span>
                      </div>
                    </li>
                    <li className="flex items-center space-x-3">
                      <span className="text-[#0056d2] text-sm">💬</span>
                      <div>
                        <strong className="text-[#1f1f1f] block">English</strong>
                        <span>Subtitles & transcripts included</span>
                      </div>
                    </li>
                  </ul>

                  <button
                    onClick={handleEnroll}
                    className="w-full bg-[#0056d2] hover:bg-[#00419e] text-white font-bold text-xs py-3 rounded transition shadow-xs cursor-pointer"
                  >
                    {isEnrolled ? 'Go to Course' : 'Enroll Now'}
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 2. STICKY SUB-NAVIGATION BAR */}
      <div className="sticky top-16 z-30 bg-white border-b border-[#e1e6eb] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 text-sm font-semibold text-[#636363] overflow-x-auto py-3">
            <a href="#about" className="hover:text-[#0056d2] transition whitespace-nowrap">About</a>
            <a href="#outcomes" className="hover:text-[#0056d2] transition whitespace-nowrap">Outcomes</a>
            <a href="#skills" className="hover:text-[#0056d2] transition whitespace-nowrap">Skills</a>
            <a href="#syllabus" className="hover:text-[#0056d2] transition whitespace-nowrap">Syllabus</a>
            <a href="#instructors" className="hover:text-[#0056d2] transition whitespace-nowrap">Instructors</a>
            <a href="#reviews" className="hover:text-[#0056d2] transition whitespace-nowrap">Reviews</a>
            <a href="#faq" className="hover:text-[#0056d2] transition whitespace-nowrap">FAQ</a>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* 3. WHAT YOU WILL LEARN (SIGNATURE COURSERA 4-QUADRANT BOX) */}
        <section id="outcomes" className="text-left scroll-mt-28">
          <div className="bg-[#f5f7fa] border border-[#e1e6eb] rounded-lg p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1f1f1f] mb-6">
              What you'll learn
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {meta.competencies.map((point, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-xs sm:text-sm text-[#1f1f1f]">
                  <span className="text-[#1a7f37] font-bold text-base shrink-0">✓</span>
                  <span className="leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. SKILLS YOU'LL GAIN PILLS */}
        <section id="skills" className="text-left scroll-mt-28 border-b border-[#e1e6eb] pb-10">
          <h2 className="text-xl font-bold text-[#1f1f1f] mb-4">
            Skills you'll gain
          </h2>
          <div className="flex flex-wrap gap-2">
            {meta.stack.map((skill, idx) => (
              <span
                key={idx}
                className="bg-[#f5f7f8] text-[#1f1f1f] border border-[#dcdfe3] text-xs font-semibold px-3 py-1.5 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* 5. ABOUT THE COURSE */}
        <section id="about" className="text-left scroll-mt-28 border-b border-[#e1e6eb] pb-10">
          <h2 className="text-xl font-bold text-[#1f1f1f] mb-4">
            About this Course
          </h2>
          <div className="prose max-w-none text-sm text-[#636363] leading-relaxed space-y-4">
            <p>
              Welcome to <strong>{courseTitle}</strong>. In this course, you will acquire practical, industry-aligned software engineering capabilities designed to help you build, test, and deploy resilient applications.
            </p>
            <p>
              Through structured modules containing bite-sized video lectures, comprehensive reading assignments, and hands-on browser code labs, you will bridge the gap between academic theory and real enterprise standards.
            </p>
          </div>
        </section>

        {/* 6. SYLLABUS - WEEK BY WEEK ACCORDION */}
        <section id="syllabus" className="text-left scroll-mt-28 border-b border-[#e1e6eb] pb-10">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-6 gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#1f1f1f]">
                Syllabus - What you will learn from this course
              </h2>
              <p className="text-xs text-[#636363] mt-1">
                Content is organized into {curriculum.length || 2} structured modules.
              </p>
            </div>
            <div className="text-xs font-semibold text-[#0056d2]">
              {totalLessons} lessons · {durationHours} total hours
            </div>
          </div>

          <div className="space-y-4">
            {curriculum.map((module, mIdx) => {
              const isExpanded = !!expandedModules[mIdx];
              return (
                <div 
                  key={module.id || mIdx}
                  className="border border-[#e1e6eb] rounded-lg overflow-hidden bg-white"
                >
                  <div
                    onClick={() => toggleModule(mIdx)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#f5f7fa] transition select-none"
                  >
                    <div className="text-left">
                      <div className="text-xs font-bold text-[#0056d2] uppercase tracking-wide">
                        Module {mIdx + 1}
                      </div>
                      <h3 className="text-base font-bold text-[#1f1f1f] mt-0.5">
                        {module.title}
                      </h3>
                      <p className="text-xs text-[#636363] mt-1">
                        {(module.lessons || []).length} lessons • ~{Math.round(((module.lessons || []).length * 20) / 60)} hours to complete
                      </p>
                    </div>

                    <div className="text-[#0056d2] text-xl font-bold px-2">
                      {isExpanded ? '−' : '+'}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[#e1e6eb] bg-[#fafafa] p-4 divide-y divide-[#e5e5e5]">
                      {(module.lessons || []).map((lesson, lIdx) => (
                        <div key={lesson.id || lIdx} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-3">
                            <span className="w-5 h-5 rounded-full bg-white border border-[#dcdfe3] text-[#0056d2] flex items-center justify-center text-[10px] font-bold">
                              {lesson.lessonType === 'VIDEO' ? '▶' : lesson.lessonType === 'QUIZ' ? '?' : '📄'}
                            </span>
                            <div>
                              <span className="font-semibold text-[#1f1f1f]">{lesson.title}</span>
                              <span className="text-[11px] text-[#636363] ml-2">
                                ({lesson.lessonType === 'VIDEO' ? 'Video' : lesson.lessonType === 'QUIZ' ? 'Graded Quiz' : 'Reading'})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 text-[#636363]">
                            <span>{lesson.duration || 15}m</span>
                            {lesson.isPreview && (
                              <button
                                onClick={() => setVideoModalOpen(true)}
                                className="text-[#0056d2] hover:underline font-bold text-[11px] cursor-pointer"
                              >
                                Preview
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. INSTRUCTORS SECTION */}
        <section id="instructors" className="text-left scroll-mt-28 border-b border-[#e1e6eb] pb-10">
          <h2 className="text-xl font-bold text-[#1f1f1f] mb-6">
            Instructors
          </h2>

          <div className="flex flex-col sm:flex-row items-start gap-6 bg-[#f5f7fa] p-6 rounded-lg border border-[#e1e6eb]">
            <img
              src={meta.instructorImg}
              alt={rawInstructor}
              className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
            />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#1f1f1f]">
                {rawInstructor}
              </h3>
              <p className="text-xs font-semibold text-[#0056d2]">
                {instructorRole}
              </p>
              <p className="text-xs text-[#636363] leading-relaxed max-w-2xl">
                {instructorBio}
              </p>
              <div className="flex items-center space-x-4 pt-2 text-xs text-[#636363]">
                <span><strong>4.8</strong> Instructor Rating</span>
                <span>•</span>
                <span><strong>2,450+</strong> Learners</span>
                <span>•</span>
                <span><strong>8</strong> Courses</span>
              </div>
            </div>
          </div>
        </section>

        {/* 8. REVIEWS & RATING DISTRIBUTION */}
        <section id="reviews" className="text-left scroll-mt-28 border-b border-[#e1e6eb] pb-10">
          <h2 className="text-xl font-bold text-[#1f1f1f] mb-6">
            Learner Reviews & Ratings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mb-8">
            
            {/* Overall Rating */}
            <div className="md:col-span-4 bg-[#f5f7fa] p-6 rounded-lg border border-[#e1e6eb] text-center">
              <p className="text-5xl font-black text-[#1f1f1f]">{rating}</p>
              <div className="text-amber-500 text-lg my-1">
                {'★★★★★'}
              </div>
              <p className="text-xs text-[#636363]">
                Based on {totalReviews.toLocaleString()} ratings
              </p>
            </div>

            {/* Distribution Bars */}
            <div className="md:col-span-8 space-y-2 text-xs text-[#636363]">
              <div className="flex items-center space-x-3">
                <span className="w-12 text-right">5 stars</span>
                <div className="flex-1 bg-[#e5e5e5] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#f5b301] h-full w-[88%]"></div>
                </div>
                <span className="w-8 text-right font-semibold">88%</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-12 text-right">4 stars</span>
                <div className="flex-1 bg-[#e5e5e5] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#f5b301] h-full w-[9%]"></div>
                </div>
                <span className="w-8 text-right font-semibold">9%</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-12 text-right">3 stars</span>
                <div className="flex-1 bg-[#e5e5e5] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#f5b301] h-full w-[2%]"></div>
                </div>
                <span className="w-8 text-right font-semibold">2%</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-12 text-right">2 stars</span>
                <div className="flex-1 bg-[#e5e5e5] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#f5b301] h-full w-[0.5%]"></div>
                </div>
                <span className="w-8 text-right font-semibold">&lt;1%</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-12 text-right">1 star</span>
                <div className="flex-1 bg-[#e5e5e5] h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#f5b301] h-full w-[0.5%]"></div>
                </div>
                <span className="w-8 text-right font-semibold">&lt;1%</span>
              </div>
            </div>

          </div>

          {/* Review Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(reviews.length > 0 ? reviews.slice(0, 3) : [
              {
                studentName: "Ravi Kumar",
                rating: 5,
                comment: "The hands-on coding labs and video explanations gave me the exact confidence needed for my technical interview rounds."
              },
              {
                studentName: "Priya Sharma",
                rating: 5,
                comment: "Extremely clear syllabus and great real-world examples. The graded quizzes really ensure you absorb the key principles."
              },
              {
                studentName: "Raju Reddy",
                rating: 5,
                comment: "Best educational experience on the platform. The step-by-step progression made complex topics easy to grasp."
              }
            ]).map((rev, idx) => (
              <div key={idx} className="border border-[#e1e6eb] rounded-lg p-5 bg-white shadow-2xs space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#0056d2] text-white flex items-center justify-center font-bold text-xs">
                    {(rev.studentName || 'Learner').charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1f1f1f]">{rev.studentName || 'Verified Learner'}</p>
                    <p className="text-[10px] text-[#636363]">Completed Course</p>
                  </div>
                </div>
                <div className="text-amber-500 text-xs">
                  {'★'.repeat(rev.rating || 5)}
                </div>
                <p className="text-xs text-[#636363] leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 9. FAQ SECTION */}
        <section id="faq" className="text-left scroll-mt-28 border-b border-[#e1e6eb] pb-10">
          <h2 className="text-xl font-bold text-[#1f1f1f] mb-6">
            Frequently Asked Questions
          </h2>

          <div className="divide-y divide-[#e1e6eb] border border-[#e1e6eb] rounded-lg">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-5">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-[#1f1f1f] cursor-pointer"
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
        </section>

        {/* 10. BOTTOM ENROLL CTA BANNER */}
        <section className="bg-[#002758] text-white rounded-lg p-8 sm:p-12 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Start Learning {courseTitle} Today
          </h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto">
            Join thousands of learners advancing their careers. Lifetime access, graded quizzes, and shareable certificates included.
          </p>
          <div className="pt-2">
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="bg-[#0056d2] hover:bg-[#00419e] text-white font-bold text-sm px-8 py-3.5 rounded transition shadow-md cursor-pointer"
            >
              {isEnrolled ? 'Go to Course' : 'Enroll for Free'}
            </button>
          </div>
        </section>

      </div>

    </div>
  );
};

export default CourseLandingPage;
