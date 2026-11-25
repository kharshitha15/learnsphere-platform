import React from 'react';
import { Link } from 'react-router-dom';

const CourseraFooter = () => (
  <footer className="bg-[#1a1a1a] text-[#f5f7f8] mt-auto">
    <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      <div>
        <h4 className="text-sm font-bold mb-4">LearnSphere</h4>
        <ul className="space-y-2 text-xs text-[#b0b0b0]">
          <li><Link to="/" className="hover:text-white transition">About</Link></li>
          <li><Link to="/courses" className="hover:text-white transition">Browse Courses</Link></li>
          <li><Link to="/register" className="hover:text-white transition">Join for Free</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-bold mb-4">Community</h4>
        <ul className="space-y-2 text-xs text-[#b0b0b0]">
          <li><span className="hover:text-white cursor-default">Learners</span></li>
          <li><span className="hover:text-white cursor-default">Partners</span></li>
          <li><span className="hover:text-white cursor-default">Developers</span></li>
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-bold mb-4">More</h4>
        <ul className="space-y-2 text-xs text-[#b0b0b0]">
          <li><span className="hover:text-white cursor-default">Press</span></li>
          <li><span className="hover:text-white cursor-default">Investors</span></li>
          <li><span className="hover:text-white cursor-default">Terms</span></li>
          <li><span className="hover:text-white cursor-default">Privacy</span></li>
        </ul>
      </div>
      <div>
        <h4 className="text-sm font-bold mb-4">Mobile App</h4>
        <p className="text-xs text-[#b0b0b0] leading-relaxed">
          Learn on the go with unlimited access to video lectures, quizzes, and course materials.
        </p>
      </div>
    </div>
    <div className="border-t border-[#333] py-4 px-6 text-center text-xs text-[#888]">
      © {new Date().getFullYear()} LearnSphere Inc. All rights reserved.
    </div>
  </footer>
);

export default CourseraFooter;
