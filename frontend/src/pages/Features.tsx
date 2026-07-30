import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Shield, Cpu, AlertTriangle, Monitor, FileText } from 'lucide-react';

const Features: React.FC = () => {
  return (
    <div className="py-20 px-6 max-w-5xl mx-auto space-y-16">
      {/* Title */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">Proctoring Capabilities</h1>
        <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          Robust, customizable modules built to target various forms of remote academic dishonesty.
        </p>
      </div>

      {/* Grid of features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Eye, title: "Gaze Deviation Detection", desc: "Flags gaze coordinates that leave the screen zone, predicting if secondary monitors or notes are accessed." },
          { icon: Shield, title: "Lockdown Environment", desc: "Forces fullscreen, intercepting keyboard hooks for tab switching, copy-pasting, and print-screen bounds." },
          { icon: Cpu, title: "Mobile Object Classifier", desc: "Identifies cellular devices, electronic watches, and auxiliary monitors present in the proctored workspace." },
          { icon: AlertTriangle, title: "Secondary Person Flag", desc: "Triggers notifications when multiple faces enter camera acquisition boxes or if primary student disappears." },
          { icon: Monitor, title: "Live Proctor HUD", desc: "Allows university invigilators to watch student streams and receive behavioral events instantly." },
          { icon: FileText, title: "Biometric Compliance Log", desc: "Generates exportable audit scorecards calculating proctor trust indicators and compliance metrics." }
        ].map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4"
          >
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-650">
              <feat.icon className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm">{feat.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">{feat.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Features;
