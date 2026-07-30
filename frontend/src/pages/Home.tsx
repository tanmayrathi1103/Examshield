import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, Eye, FileText, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full pt-32 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-primary-100 -z-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-primary-700 font-medium text-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
            </span>
            Next-Gen AI Proctoring
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Secure Online Exams with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Advanced AI</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Student Behaviour Detection Using Facial Recognition and Artificial Intelligence to ensure academic integrity in remote assessments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a href="/login" className="px-8 py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/30 flex items-center justify-center gap-2 hover:-translate-y-1">
              Get Started <ArrowRight className="w-5 h-5" />
            </a>
            <a href="/about" className="px-8 py-4 bg-white text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all shadow-lg flex items-center justify-center gap-2 hover:-translate-y-1 border border-slate-200">
              Learn More
            </a>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="w-full py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Comprehensive Integrity Checks</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Our AI continuously monitors multiple data points to detect and prevent suspicious behavior during examinations.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Face, title: "Facial Recognition", desc: "Verifies student identity before and during the exam continuously." },
              { icon: Eye, title: "Eye Tracking", desc: "Monitors gaze direction to ensure students are looking at the screen." },
              { icon: Brain, title: "Behaviour Analysis", desc: "Detects anomalous movements, secondary people, or prohibited items." },
              { icon: Shield, title: "Browser Locking", desc: "Prevents tab switching, copy-pasting, and unauthorized applications." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl glass hover:shadow-2xl transition-all duration-300 border border-slate-100 bg-slate-50/50"
              >
                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6 text-primary-600">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Need to define Face since it's not exported from lucide directly by that name in older versions, usually it's User or Smile. Let's fix that.
const Face = ({className}: {className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export default Home;
