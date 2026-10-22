'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, 
  Moon, 
  Sun, 
  Languages, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Server, 
  Layers, 
  Send, 
  X, 
  Bot, 
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [lang, setLang] = useState<'he' | 'en'>('he');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // מצב חלונית ה-AI של Lin
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'lin' | 'user'; text: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // החלפת Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // שליפת פרויקטים מ-Supabase
  useEffect(() => {
    async function fetchProjects() {
      setLoading(false);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*, infra_requirements(*)');

        if (data && data.length > 0) {
          setProjects(data);
        } else {
          // נתוני גיבוי מקומיים לתצוגה אם טרם מולאו ב-Supabase
          setProjects([
            {
              id: '1',
              name: lang === 'he' ? 'דאטריקס (Datricks)' : 'Datricks Finance Control',
              code: 'PRJ-DAT-01',
              overview: lang === 'he' ? 'הטמעת מערכת בקרה פיננסית אוטומטית מבוססת ניתוח נתונים ו-BI.' : 'Financial automated governance and risk controls implementation.',
              business_pm: 'אורית רונן',
              infra_lead: 'יוסי לוי (ענן)',
              rag_status: 'RED',
              overall_status: 'BLOCKED',
              target_go_live: '2026-11-30',
              infra_requirements: [
                { id: 'r1', category: 'Network/Firewall', title: 'פתיחת חוקי חומת אש ו-Reverse Proxy', status: 'BLOCKED', blocker_reason: 'ממתין לסקר סיכונים ואישור צוות CISO' }
              ]
            },
            {
              id: '2',
              name: lang === 'he' ? 'מעבר לענן Azure - אזור נחיתה מאובטח' : 'Azure Cloud Landing Zone',
              code: 'INF-LZ-02',
              overview: lang === 'he' ? 'הקמת תשתית Hub & Spoke ארגונית מבודדת ומאובטחת.' : 'Establishing an enterprise isolated Hub & Spoke cloud foundation.',
              business_pm: 'מיכל כהן',
              infra_lead: 'רועי ברק (תקשוב)',
              rag_status: 'AMBER',
              overall_status: 'IN_PROGRESS',
              target_go_live: '2026-12-15',
              infra_requirements: []
            },
            {
              id: '3',
              name: lang === 'he' ? 'פורטל עובדים דיגיטלי' : 'Employee Self-Service Portal',
              code: 'IT-PORT-99',
              overview: lang === 'he' ? 'שירותי רווחה, משאבי אנוש ודיגיטל פנים-ארגוני.' : 'Digital portal for employee welfare and HR services.',
              business_pm: 'דנה גלבוע',
              infra_lead: 'אלי כהן (מערכות)',
              rag_status: 'GREEN',
              overall_status: 'COMPLETED',
              target_go_live: '2026-09-01',
              infra_requirements: []
            }
          ]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchProjects();
  }, [lang]);

  // פתיחת הצ'אט של Lin והודעת פתיחה
  const toggleChat = () => {
    if (!isChatOpen && messages.length === 0) {
      const welcomeText = lang === 'he'
        ? 'שלום! אני Lin, סוכנת ה-AI של חטיבת התקשוב וה-PMO. תוכל לשאול אותי מה מעכב את פרויקט דאטריקס, כמה פרויקטים קיימים, או סטטוסים של תשתיות.'
        : 'Hello! I am Lin, your IT PMO AI agent. Ask me about project blockers, Datricks status, or any infrastructure dependencies.';
      
      setMessages([{ sender: 'lin', text: welcomeText }]);
    }
    setIsChatOpen(!isChatOpen);
  };

  // שליחת שאילתה ל-Lin
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMessage('');
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/lin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'lin', text: data.reply || (lang === 'he' ? 'לא התקבלה תשובה מ-Lin' : 'No response received') }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'lin', text: lang === 'he' ? 'שגיאה בתקשורת עם ה-AI, ודא שהמפתח מוגדר ב-Vercel.' : 'Connection error, check Gemini API key configuration.' }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const isRtl = lang === 'he';

  return (
    <div 
      dir={isRtl ? 'rtl' : 'ltr'} 
      className={`min-h-screen transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Top Navbar */}
      <header className={`px-6 py-4 border-b flex justify-between items-center ${
        theme === 'dark' ? 'bg-[#1e293b] border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <Layers size={22} />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">iec-projects-hub</h1>
            <p className="text-xs text-slate-500">
              {isRtl ? 'מערכת ניהול ובקרת פרויקטים | IT & PMO' : 'Enterprise IT Project Governance'}
            </p>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="flex items-center gap-3">
          {/* כפתור ה-AI של Lin */}
          <button
            onClick={toggleChat}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90"
          >
            <Sparkles size={16} />
            <span>{isRtl ? 'שאל את Lin (AI)' : 'Ask Lin (AI)'}</span>
          </button>

          {/* מתג שפה */}
          <button
            onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
              theme === 'dark' ? 'border-slate-700 bg-slate-800 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
            }`}
            title="Toggle Language"
          >
            <Languages size={15} />
            <span>{lang === 'he' ? 'EN' : 'עב'}</span>
          </button>

          {/* מתג Dark/Light Mode */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-lg border ${
              theme === 'dark' ? 'border-slate-700 bg-slate-800 text-amber-400' : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border ${
            theme === 'dark' ? 'bg-[#1e293b] border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <span className="text-xs text-slate-500 font-medium">{isRtl ? 'סך הכל פרויקטים' : 'Total Projects'}</span>
            <div className="text-2xl font-bold mt-1">{projects.length}</div>
          </div>

          <div className={`p-4 rounded-xl border ${
            theme === 'dark' ? 'bg-[#1e293b] border-red-900/40 text-red-400' : 'bg-white border-red-100 text-red-700 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{isRtl ? 'פרויקטים מעוכבים / RAG אדום' : 'Critical / Blocked (RED)'}</span>
              <ShieldAlert size={18} className="text-red-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
              {projects.filter(p => p.rag_status === 'RED').length}
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${
            theme === 'dark' ? 'bg-[#1e293b] border-emerald-900/40 text-emerald-400' : 'bg-white border-emerald-100 text-emerald-700 shadow-sm'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{isRtl ? 'הסתיימו בהצלחה' : 'Completed Successfully'}</span>
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {projects.filter(p => p.overall_status === 'COMPLETED').length}
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className={`rounded-xl border overflow-hidden ${
          theme === 'dark' ? 'bg-[#1e293b] border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700/60 font-semibold flex items-center justify-between">
            <span>{isRtl ? 'מעקב פרויקטים וחומרת תשתיות' : 'Active Projects & IT Dependencies'}</span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700/60">
            {projects.map((proj) => {
              const isExpanded = expandedProjectId === proj.id;
              const hasBlocked = proj.infra_requirements?.some((r: any) => r.status === 'BLOCKED');

              return (
                <div key={proj.id} className="p-4 transition hover:bg-slate-500/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {/* תגית RAG עדינה שמותאמת לבהיר וכהה */}
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        proj.rag_status === 'RED'
                          ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40'
                          : proj.rag_status === 'AMBER'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40'
                      }`}>
                        {proj.rag_status}
                      </span>

                      <div>
                        <div className="font-semibold text-sm md:text-base flex items-center gap-2">
                          <span>{proj.name}</span>
                          <span className="text-xs font-mono text-slate-400">({proj.code})</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 max-w-2xl">{proj.overview}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <div>
                        <span className="block font-medium text-slate-700 dark:text-slate-300">{isRtl ? 'מנהל פרויקט:' : 'Project Manager:'}</span>
                        <span>{proj.business_pm}</span>
                      </div>
                      <div>
                        <span className="block font-medium text-slate-700 dark:text-slate-300">{isRtl ? 'מוביל תשתיות:' : 'Infra Lead:'}</span>
                        <span>{proj.infra_lead}</span>
                      </div>
                      <div>
                        <span className="block font-medium text-slate-700 dark:text-slate-300">{isRtl ? 'יעד סיום:' : 'Target Date:'}</span>
                        <span>{proj.target_go_live}</span>
                      </div>

                      <button
                        onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                        title="Expand Details"
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* דרישות תשתית מורחבות */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                      <span className="font-semibold block mb-2">{isRtl ? 'דרישות תשתית וחסמים:' : 'Infrastructure Requirements:'}</span>
                      {proj.infra_requirements && proj.infra_requirements.length > 0 ? (
                        <div className="space-y-2">
                          {proj.infra_requirements.map((req: any) => (
                            <div key={req.id} className="p-2.5 rounded border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 flex items-start gap-2">
                              <ShieldAlert size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-semibold text-red-800 dark:text-red-300">[{req.category}] {req.title}</span>
                                {req.blocker_reason && (
                                  <p className="text-red-600 dark:text-red-400 mt-0.5">{req.blocker_reason}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">{isRtl ? 'אין חסמי תשתית פתוחים עבור פרויקט זה.' : 'No open infrastructure blockers.'}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* חלונית ה-AI הצפה של Lin */}
      {isChatOpen && (
        <div className={`fixed bottom-6 ${isRtl ? 'left-6' : 'right-6'} w-96 max-w-[90vw] h-[520px] rounded-2xl border shadow-2xl flex flex-col z-50 overflow-hidden ${
          theme === 'dark' ? 'bg-[#1e293b] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={18} />
              <div>
                <h3 className="font-bold text-sm">Lin PMO Agent</h3>
                <span className="text-[10px] text-blue-100">{isRtl ? 'סוכנת AI פעילה' : 'Active Copilot'}</span>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="hover:opacity-80">
              <X size={18} />
            </button>
          </div>

          {/* הודעות צ'אט */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : theme === 'dark' ? 'bg-slate-800 text-slate-200 rounded-bl-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isAiTyping && (
              <div className="text-slate-400 italic text-[11px] animate-pulse">
                {isRtl ? 'Lin חושבת ומנתחת נתונים...' : 'Lin is analyzing project data...'}
              </div>
            )}
          </div>

          {/* שדה קלט */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={isRtl ? 'שאל על דאטריקס או חסמים...' : 'Ask about Datricks or blockers...'}
              className={`flex-1 px-3 py-2 text-xs rounded-lg border outline-none ${
                theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            />
            <button 
              onClick={sendMessage}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}