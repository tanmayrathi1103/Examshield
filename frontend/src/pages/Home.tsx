import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Brain, Eye, FileText, ArrowRight, CheckCircle } from 'lucide-react';

const Home: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Hide the intro transition after 2 seconds
    const timer = setTimeout(() => setShowIntro(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center bg-orange-50 min-h-screen">
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="intro"
            initial={{ y: 0 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-primary-500 flex flex-col items-center justify-center origin-top shadow-2xl"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-white text-5xl md:text-7xl font-bold flex flex-col items-center gap-6"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-white p-6 rounded-2xl shadow-xl text-primary-600 relative"
              >
                <FileText className="w-20 h-20" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute -bottom-4 -right-4 bg-green-500 text-white rounded-full p-2"
                >
                  <CheckCircle className="w-8 h-8" />
                </motion.div>
              </motion.div>
              <span>Preparing Exam...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="w-full pt-32 pb-24 px-6 text-center relative overflow-hidden flex-grow flex flex-col justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-orange-100 -z-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 30 : 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/40 text-primary-700 font-semibold text-sm shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
            </span>
            Next-Gen AI Proctoring
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Secure Online Exams with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-amber-500">Advanced AI</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-700 max-w-2xl mx-auto font-medium">
            Student Behaviour Detection Using Facial Recognition and Artificial Intelligence to ensure academic integrity in remote assessments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <a href="/login" className="px-8 py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/30 flex items-center justify-center gap-2 hover:-translate-y-1">
              Start Exam <ArrowRight className="w-5 h-5" />
            </a>
            <a href="/about" className="px-8 py-4 bg-white/80 backdrop-blur text-slate-700 rounded-xl font-bold text-lg hover:bg-white transition-all shadow-lg flex items-center justify-center gap-2 hover:-translate-y-1 border border-orange-200">
              Learn More
            </a>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="w-full py-24 px-6 bg-white relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Comprehensive Integrity Checks</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Our AI continuously monitors multiple data points to detect and prevent suspicious behavior during examinations.</p>
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
                viewport={{ once: true, margin: "-50px" }}
                className="p-8 rounded-3xl bg-orange-50/50 hover:bg-orange-50 hover:shadow-2xl transition-all duration-300 border border-orange-100 group"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 text-primary-500 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8" />
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
const Face = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

export default Home;
