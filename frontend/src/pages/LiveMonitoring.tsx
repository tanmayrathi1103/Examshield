import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Video, ShieldAlert, Award, AlertTriangle, PlayCircle, Ban, CheckCircle } from 'lucide-react';

const LiveMonitoring: React.FC = () => {
  const { students, violations, setStudents, activeExamId } = useApp();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(students[0]?.name || null);

  const activeStudent = students.find(s => s.name === selectedStudent);
  const activeStudentViolations = violations.filter(v => v.studentName === selectedStudent);

  const handleForceSubmit = (name: string) => {
    alert(`Forced submission command triggered for student: ${name}`);
  };

  const handleSuspend = (id: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'suspended' ? 'active' : 'suspended' };
      }
      return s;
    }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">Proctor Live Monitoring</h1>
        <p className="text-slate-500">Real-time telemetry and video acquisition feeds from active proctored rooms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Student Active Rooms List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Examinations ({students.length})</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((student) => {
              const isSelected = selectedStudent === student.name;
              const studentViolations = violations.filter(v => v.studentName === student.name);
              
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student.name)}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-44 hover:shadow-lg transition-all bg-white relative ${
                    isSelected 
                      ? 'border-indigo-600 ring-2 ring-indigo-500/10' 
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{student.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">{student.rollNo} • {student.department}</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      student.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : student.status === 'suspended'
                        ? 'bg-rose-50 text-rose-700 animate-pulse'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {student.status}
                    </span>
                  </div>

                  {/* Trust Rating Bar */}
                  <div className="w-full space-y-1.5 mt-4">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-400 uppercase">Proctor Trust Rating</span>
                      <span className={student.integrityScore >= 80 ? 'text-emerald-500' : 'text-rose-500'}>
                        {student.integrityScore}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          student.integrityScore >= 90 ? 'bg-emerald-500' : student.integrityScore >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} 
                        style={{ width: `${student.integrityScore}%` }} 
                      />
                    </div>
                  </div>

                  {/* Telemetry info */}
                  <div className="flex justify-between items-center w-full mt-3 pt-3 border-t text-[10px] font-bold text-slate-400">
                    <span>{studentViolations.length} Flags logged</span>
                    <span className="flex items-center gap-1 text-emerald-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Live Feed
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Student Proctor Feed Panel details */}
        <div>
          {activeStudent ? (
            <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 shadow-2xl space-y-6">
              
              {/* Webcam monitor */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  Biometric HUD Feed
                </h3>
                
                <div className="aspect-video bg-slate-950 rounded-xl flex items-center justify-center relative border border-slate-800 overflow-hidden">
                  <div className="w-24 h-24 border-2 border-dashed border-indigo-500 rounded-full animate-pulse flex items-center justify-center text-indigo-500">
                    <Video className="w-6 h-6" />
                  </div>
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[8px] font-bold">
                    CAMERA FEED • ACTIVE
                  </div>
                </div>
              </div>

              {/* Integrity status card */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Trust Rating</div>
                  <div className={`text-2xl font-black mt-1.5 ${
                    activeStudent.integrityScore >= 90 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {activeStudent.integrityScore}%
                  </div>
                </div>

                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Flags Logged</div>
                  <div className="text-2xl font-black text-indigo-400 mt-1.5">{activeStudentViolations.length} Flagged</div>
                </div>
              </div>

              {/* Event timelines */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">Telemetry log</h4>
                
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {activeStudentViolations.length === 0 ? (
                    <div className="text-[10px] text-slate-500 italic">Compliance checked. No warnings recorded.</div>
                  ) : (
                    activeStudentViolations.map((v) => (
                      <div key={v.id} className="p-2 bg-slate-850 rounded-lg border border-slate-800 text-[10px] flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          <span className="font-bold">{v.type}</span>
                        </div>
                        <span className="text-slate-500">{new Date(v.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Remote Actions */}
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <button 
                  onClick={() => handleForceSubmit(activeStudent.name)}
                  className="w-full py-2.5 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 text-rose-400 hover:text-white font-bold text-xs rounded-xl transition-all"
                >
                  Force Submit Examination
                </button>
                <button 
                  onClick={() => handleSuspend(activeStudent.id)}
                  className="w-full py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-850 text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  {activeStudent.status === 'suspended' ? 'Re-activate Assessment' : 'Suspend Student Assessment'}
                </button>
              </div>

            </div>
          ) : (
            <div className="p-8 border border-dashed rounded-3xl text-center text-slate-400 italic">
              Select an active student room to begin live monitoring telemetry.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LiveMonitoring;
