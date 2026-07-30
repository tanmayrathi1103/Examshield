import React, { useState } from 'react';
import { Send } from 'lucide-react';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Message successfully transmitted. We will respond shortly.');
    setName(''); setEmail(''); setMsg('');
  };

  return (
    <div className="py-20 px-6 max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-800">Contact Support</h1>
        <p className="text-slate-500 text-sm">Reach out to our technical administration team for assistance.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-3xl p-8 shadow-xl space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Full Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full bg-slate-50 hover:bg-slate-100 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500" 
            required 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full bg-slate-50 hover:bg-slate-100 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500" 
            required 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Message Description</label>
          <textarea 
            value={msg} 
            onChange={(e) => setMsg(e.target.value)} 
            className="w-full bg-slate-50 hover:bg-slate-100 border rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-indigo-500" 
            rows={4}
            required 
          />
        </div>

        <button 
          type="submit" 
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 transition-all hover:-translate-y-0.5"
        >
          <Send className="w-4 h-4" /> Send Message
        </button>
      </form>
    </div>
  );
};

export default Contact;
