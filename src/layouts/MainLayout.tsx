import React from 'react';
import { Outlet } from 'react-router-dom';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="text-xl font-bold text-primary-600 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center">E</span>
          ExamShield AI
        </div>
        <nav className="hidden md:flex gap-6 font-medium">
          <a href="/" className="hover:text-primary-600 transition-colors">Home</a>
          <a href="/about" className="hover:text-primary-600 transition-colors">About</a>
          <a href="/features" className="hover:text-primary-600 transition-colors">Features</a>
          <a href="/contact" className="hover:text-primary-600 transition-colors">Contact</a>
        </nav>
        <div className="flex gap-3">
          <a href="/login" className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors">Login</a>
          <a href="/register" className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium transition-colors shadow-lg shadow-primary-500/30">Register</a>
        </div>
      </header>
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 text-center">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-left mb-8">
          <div>
            <h3 className="text-white font-bold mb-4">ExamShield AI</h3>
            <p className="text-sm">Student Behaviour Detection Using Facial Recognition and Artificial Intelligence for Online Examination.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Features</a></li>
              <li><a href="#" className="hover:text-white">Pricing</a></li>
              <li><a href="#" className="hover:text-white">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Documentation</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Support</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <p className="text-sm border-t border-slate-800 pt-8">&copy; {new Date().getFullYear()} ExamShield AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainLayout;
