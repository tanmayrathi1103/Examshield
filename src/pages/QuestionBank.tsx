import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PlusCircle, Search, Trash2, HelpCircle } from 'lucide-react';

const QuestionBank: React.FC = () => {
  const { questions, setQuestions, addAuditLog } = useApp();
  const [searchText, setSearchText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New question form inputs
  const [text, setText] = useState('');
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [correctOption, setCorrectOption] = useState(0);
  const [points, setPoints] = useState(2);

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const newQ = {
      id: `q_${Date.now()}`,
      text,
      options: [opt0, opt1, opt2, opt3],
      correctOption,
      points
    };
    setQuestions(prev => [...prev, newQ]);
    addAuditLog(`Created Question: "${text.substring(0, 30)}..."`);
    
    // Reset form
    setText(''); setOpt0(''); setOpt1(''); setOpt2(''); setOpt3(''); setCorrectOption(0); setPoints(2);
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    addAuditLog(`Deleted Question ID: ${id}`);
  };

  const filteredQuestions = questions.filter(q => 
    q.text.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Faculty Question Bank</h1>
          <p className="text-slate-500">Configure questions to be used during assessments.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/10 transition-all"
        >
          <PlusCircle className="w-4 h-4" /> Add New Question
        </button>
      </div>

      {/* Add Question Modal/Form */}
      {showAddForm && (
        <form onSubmit={handleAddQuestion} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-5">
          <h3 className="font-extrabold text-slate-800 text-sm">Add Question Details</h3>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question Text</label>
            <textarea 
              value={text} 
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. What is the complexity of binary search?"
              className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Option A</label>
              <input type="text" value={opt0} onChange={(e) => setOpt0(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Option B</label>
              <input type="text" value={opt1} onChange={(e) => setOpt1(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Option C</label>
              <input type="text" value={opt2} onChange={(e) => setOpt2(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Option D</label>
              <input type="text" value={opt3} onChange={(e) => setOpt3(e.target.value)} className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Correct Option</label>
              <select value={correctOption} onChange={(e) => setCorrectOption(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-indigo-500">
                <option value={0}>Option A</option>
                <option value={1}>Option B</option>
                <option value={2}>Option C</option>
                <option value={3}>Option D</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Points</label>
              <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} className="w-full bg-slate-50 border rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-indigo-500" required />
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/10">Save Question</button>
          </div>
        </form>
      )}

      {/* Questions list container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        {/* Search */}
        <div className="p-4 bg-slate-50 border-b flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search questions..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm text-slate-700 w-full placeholder-slate-400 font-semibold"
          />
        </div>

        {/* List items */}
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center italic text-slate-400">No questions found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredQuestions.map((q) => (
              <div key={q.id} className="p-6 hover:bg-slate-50/50 transition-colors flex justify-between items-start gap-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-sm leading-relaxed">{q.text}</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 font-semibold">
                    {q.options.map((opt, i) => (
                      <div key={i} className={`flex items-center gap-1.5 ${q.correctOption === i ? 'text-emerald-600 font-bold' : ''}`}>
                        <span>{String.fromCharCode(65 + i)})</span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-slate-100 font-bold text-slate-500 px-2 py-0.5 rounded">
                    {q.points} Pts
                  </span>
                  <button onClick={() => handleDelete(q.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBank;
