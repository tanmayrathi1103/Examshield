import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Eye, Cpu } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="py-20 px-6 max-w-5xl mx-auto space-y-16">
      {/* Title */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">
          About the Project
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          ExamShield AI implements cutting-edge Computer Vision algorithms to certify online assessment integrity.
        </p>
      </motion.div>

      {/* Concept Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Next-Generation Behavior Analysis</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Standard online testing relies on invasive screen locks or manually reviews video recordings, which is expensive and prone to omissions. ExamShield utilizes on-device neural nets to track real-time visual telemetry, detecting eye deviations, external devices, and secondary actors instant-by-instant.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            By running light models in sandboxed lockdown environments, we guarantee security while maintaining students' data privacy according to local regulations.
          </p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 flex flex-col gap-6">
          <div className="flex gap-4">
            <Cpu className="w-8 h-8 text-indigo-650 flex-shrink-0" />
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Lightweight On-Device Inference</h4>
              <p className="text-xs text-slate-500 mt-1">Runs convolutional face-mesh grids directly in the client sandbox, preventing large uploads.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Shield className="w-8 h-8 text-indigo-650 flex-shrink-0" />
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Decentralized Trust Auditing</h4>
              <p className="text-xs text-slate-500 mt-1">Saves encrypted, non-reconstructible telemetry hashes for student compliance logs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
