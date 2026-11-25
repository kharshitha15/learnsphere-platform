import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CertificateModal from '../components/CertificateModal';

const Profile = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);

  // Danger Zone / Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== 'delete') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }
    setIsDeleting(true);
    setDeleteError('');
    try {
      const endpoint = user?.role === 'INSTRUCTOR' ? '/instructor/account' : '/student/account';
      await api.delete(endpoint);
      localStorage.clear();
      window.location.href = '/login?deleted=true';
    } catch (err) {
      console.error('Account deletion error', err);
      // Fallback to /users/account
      try {
        await api.delete('/users/account');
        localStorage.clear();
        window.location.href = '/login?deleted=true';
      } catch (err2) {
        setDeleteError(err.response?.data?.message || err2.response?.data?.message || 'Failed to delete account. Please try again.');
        setIsDeleting(false);
      }
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const [dashRes, myCoursesRes, certsRes] = await Promise.all([
          api.get('/student/dashboard'),
          api.get('/student/my-learning'),
          api.get('/student/certificates')
        ]);
        setDashboardData(dashRes.data);
        setMyCourses(myCoursesRes.data || []);
        setCertificates(certsRes.data || []);
      } catch (error) {
        console.error("Error fetching profile", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfileData();
  }, [user]);

  if (loading) return <div className="p-16 text-center text-gray-500 font-bold">Loading profile...</div>;

  const stats = dashboardData?.stats;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900"></div>

        <div className="relative z-10 w-28 h-28 rounded-full border-4 border-white bg-white shadow-xl flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-4xl font-black text-white">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
        </div>

        <div className="relative z-10 flex-1 text-center md:text-left mt-10 md:mt-0 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900">{user?.fullName}</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{user?.email}</p>
            </div>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black uppercase px-3 py-1 rounded-full self-center md:self-auto">
              {user?.role || 'STUDENT'}
            </span>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
            <span className="px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center">
              🏆 {stats?.certificatesEarned || 0} Certificates
            </span>
            <span className="px-3.5 py-1.5 bg-green-50 text-green-800 border border-green-200 rounded-xl text-xs font-bold flex items-center">
              ✓ {stats?.completed || 0} Courses Completed
            </span>
            <span className="px-3.5 py-1.5 bg-orange-50 text-orange-800 border border-orange-200 rounded-xl text-xs font-bold flex items-center">
              🔥 {stats?.currentStreak || 1} Day Streak
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Details Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-4 border-b border-gray-100 pb-3">
              Account Overview
            </h3>
            <div className="space-y-4 text-xs">
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Email Address</p>
                <p className="font-semibold text-gray-800 mt-0.5">{user?.email}</p>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Learning Hours</p>
                <p className="font-semibold text-gray-800 mt-0.5">{stats?.learningHours || 0} Total Hours</p>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Average Quiz Mastery</p>
                <p className="font-semibold text-blue-600 mt-0.5">{stats?.avgQuizScore || 0}% Score</p>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Active Enrolled Courses</p>
                <p className="font-semibold text-gray-800 mt-0.5">{stats?.totalEnrolled || 0} Courses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Accomplishments & Certificates */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h3 className="text-base font-black text-gray-900 mb-4 flex items-center">
              <span className="mr-2 text-xl">🏆</span>
              <span>Earned Credentials & Certificates</span>
            </h3>

            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    onClick={() => setSelectedCert(cert)}
                    className="border border-amber-200 bg-amber-50/40 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition cursor-pointer"
                  >
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        Verified
                      </span>
                      <h4 className="font-black text-gray-900 text-sm mt-2 leading-snug">{cert.courseTitle}</h4>
                      <p className="text-[11px] text-gray-500 mt-1 font-mono">{cert.certificateId}</p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-amber-200/50 flex justify-between items-center text-xs text-blue-600 font-bold">
                      <span>{new Date(cert.issueDate).toLocaleDateString()}</span>
                      <span>View →</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-xs italic">
                Complete all course modules and pass assessments to earn your verified credential certificates.
              </p>
            )}
          </div>

          {/* Enrolled Courses Status */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h3 className="text-base font-black text-gray-900 mb-4">Course Enrolment Status</h3>
            <div className="space-y-3">
              {myCourses.length > 0 ? (
                myCourses.map((enrollment) => (
                  <div
                    key={enrollment.enrollmentId}
                    className="flex justify-between items-center p-3.5 border border-gray-100 rounded-2xl bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">{enrollment.courseTitle}</h4>
                      <p className="text-[10px] text-gray-500">{enrollment.category} • {enrollment.completedLessons}/{enrollment.totalLessons} Lessons</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          enrollment.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {enrollment.status === 'COMPLETED' ? 'Completed' : `${Math.round(enrollment.progressPercentage)}%`}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-xs italic">No courses enrolled yet.</p>
              )}
            </div>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="bg-white rounded-3xl shadow-sm border border-red-200 p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h3 className="text-base font-black text-red-600">Danger Zone</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Permanently delete your LearnSphere account. All of your course enrollments, learning progress, quiz submissions, and verified certificates will be permanently erased. This action cannot be undone.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setDeleteConfirmText('');
                  setDeleteError('');
                }}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm shadow-red-600/20"
              >
                <span>🗑️</span>
                <span>Delete My Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-red-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-2xl mx-auto">
              ⚠️
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-lg font-black text-gray-900">Delete Account Permanently?</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                This action is <strong className="text-red-600">irreversible</strong>. Your profile, all {user?.role?.toLowerCase()} credentials, course records, and certificates will be completely deleted from our servers.
              </p>
            </div>

            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs">
                {deleteError}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <label className="text-xs text-gray-700 block font-bold">
                Type <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">DELETE</span> below to confirm:
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText.trim().toLowerCase() !== 'delete'}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Permanently Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCert && (
        <CertificateModal certificate={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </div>
  );
};

export default Profile;
