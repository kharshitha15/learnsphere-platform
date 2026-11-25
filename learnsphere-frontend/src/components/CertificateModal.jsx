import React from 'react';

const CertificateModal = ({ certificate, onClose }) => {
  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-10 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Certificate Frame */}
        <div 
          id="certificate-print-area"
          className="border-8 border-double border-amber-600/60 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 p-8 sm:p-12 rounded-2xl relative overflow-hidden text-center shadow-inner"
        >
          {/* Watermark Background Seal */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <svg className="w-96 h-96 text-amber-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>

          <div className="relative z-10">
            {/* Header / Brand */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-3xl font-black text-blue-600 tracking-tighter">Learn</span>
              <span className="text-3xl font-black text-gray-900 tracking-tighter">Sphere</span>
              <span className="text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 ml-2">
                Academy
              </span>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-800 mb-2">
              Official Certificate of Completion
            </p>
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto mb-6"></div>

            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">This is to certify that</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-gray-900 tracking-wide mb-3">
              {certificate.studentName || 'Learner'}
            </h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">has successfully mastered and completed all curriculum requirements for</p>

            <h3 className="text-xl sm:text-2xl font-black text-blue-700 max-w-2xl mx-auto mb-8 leading-tight">
              {certificate.courseTitle}
            </h3>

            {/* Verification Footer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-amber-200/80 items-end mt-4">
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Instructor Signature</p>
                <p className="font-serif italic text-base font-bold text-gray-800 mt-1">{certificate.instructorName || 'Lead Instructor'}</p>
                <div className="w-32 h-0.5 bg-gray-300 mt-1"></div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-2 border-dashed border-amber-100 flex flex-col items-center justify-center text-white">
                    <span className="text-xs">★</span>
                    <span className="text-[8px] font-black uppercase">Verified</span>
                  </div>
                </div>
              </div>

              <div className="text-right sm:text-right text-left">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Issued Date & ID</p>
                <p className="text-xs font-bold text-gray-800 mt-1">
                  {certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString() : new Date().toLocaleDateString()}
                </p>
                <p className="text-[10px] font-mono text-gray-500">{certificate.certificateId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400 font-medium">
            🔒 Public verification link: <span className="text-blue-600 font-mono text-[11px]">{window.location.origin}/verify/{certificate.certificateId}</span>
          </p>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
