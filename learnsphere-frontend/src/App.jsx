import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomeLandingPage from './pages/HomeLandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import CourseMarketplace from './pages/CourseMarketplace';
import CourseLandingPage from './pages/CourseLandingPage';
import LearningPlayer from './pages/LearningPlayer';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import QuizPlayer from './pages/QuizPlayer';
import Profile from './pages/Profile';
import { AuthProvider, useAuth } from './context/AuthContext';
import CourseraNavbar from './components/CourseraNavbar';
import CourseraFooter from './components/CourseraFooter';

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  if (user?.role === 'INSTRUCTOR') {
    return <Navigate to="/instructor" replace />;
  }
  return <Dashboard />;
};

const AppShell = () => {
  const location = useLocation();
  const isLearning = location.pathname.startsWith('/learning');
  const isQuiz = location.pathname.startsWith('/quiz');
  const hideFooter = isLearning || isQuiz;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <CourseraNavbar />
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<HomeLandingPage />} />
          <Route path="/home" element={<HomeLandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/courses" element={<CourseMarketplace />} />
          <Route path="/courses/:id" element={<CourseLandingPage />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Profile />} />
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/instructor/*" element={<InstructorDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/learning/:id" element={<LearningPlayer />} />
          <Route path="/learning/:courseId" element={<LearningPlayer />} />
          <Route path="/quiz/:quizId" element={<QuizPlayer />} />
          <Route path="/my-courses" element={<Navigate to="/dashboard?tab=mylearning" replace />} />
          <Route path="/my-learning" element={<Navigate to="/dashboard?tab=mylearning" replace />} />
          <Route path="/student/dashboard" element={<DashboardRedirect />} />
          <Route path="/student/courses" element={<CourseMarketplace />} />
          <Route path="/student/courses/:id" element={<CourseLandingPage />} />
          <Route path="/student/learning/:id" element={<LearningPlayer />} />
          <Route path="/student/learning/:courseId" element={<LearningPlayer />} />
          <Route path="/student/my-learning" element={<Navigate to="/dashboard?tab=mylearning" replace />} />
          <Route path="/student/my-courses" element={<Navigate to="/dashboard?tab=mylearning" replace />} />
          <Route path="/student/mylearning" element={<Navigate to="/dashboard?tab=mylearning" replace />} />
          <Route path="/student/certificates" element={<Navigate to="/dashboard?tab=certificates" replace />} />
          <Route path="/student/achievements" element={<Navigate to="/dashboard?tab=achievements" replace />} />
          <Route path="/student/profile" element={<Profile />} />
          <Route path="/student/settings" element={<Profile />} />
        </Routes>
      </main>
      {!hideFooter && <CourseraFooter />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}

export default App;
