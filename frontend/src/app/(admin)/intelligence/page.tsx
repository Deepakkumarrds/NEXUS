'use client';

import { useState, useEffect, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface InsightData {
  clients: { total: number; active: number; hold: number; lost: number };
  tasks: { pending: number; inProgress: number; overdue: number };
  escalations: { open: number; critical: number };
  team: { activeMembers: number };
}

interface HealthScore {
  client: { company_name: string };
  overall_score: number;
  risk_level: string;
  communication_score: number;
  task_completion_score: number;
  escalation_score: number;
}

const SUGGESTED_PROMPTS = [
  'Give me a full business overview',
  'Which clients are at risk right now?',
  'Show me all overdue tasks',
  'What are the open escalations?',
  'Show campaign performance summary',
  'Which clients have low health scores?',
];

function getRiskColor(level: string) {
  switch (level) {
    case 'Excellent': return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-100' };
    case 'Stable':    return { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    border: 'border-blue-100' };
    case 'Risk':      return { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   border: 'border-amber-100' };
    case 'Critical':  return { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     border: 'border-red-100' };
    default:          return { bg: 'bg-slate-50',   text: 'text-slate-700',   dot: 'bg-slate-400',   border: 'border-slate-100' };
  }
}

export default function IntelligencePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [healthScores, setHealthScores] = useState<HealthScore[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchInsights();
    fetchHealthScores();
  }, []);

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('token');
      // Use the chat to get a dashboard summary
      const res = await fetch(`${API}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setInsights(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch insights', e);
    } finally {
      setInsightsLoading(false);
    }
  };

  const fetchHealthScores = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      // We'll display client info as a proxy for health scores
      if (data.status === 'success') {
        // Show top clients by status
        const formatted = (data.data || []).slice(0, 8).map((c: any) => ({
          client: { company_name: c.company_name },
          overall_score: c.client_status === 'Active' ? 80 : c.client_status === 'Hold' ? 40 : 20,
          risk_level: c.client_status === 'Active' ? 'Stable' : c.client_status === 'Hold' ? 'Risk' : 'Critical',
          communication_score: 70,
          task_completion_score: 75,
          escalation_score: 80,
        }));
        setHealthScores(formatted);
      }
    } catch (e) {
      console.error('Failed to fetch health scores', e);
    }
  };

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: msgText }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ messages: newMessages })
      });
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        setMessages(prev => [...prev, data.data]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.message || 'Something went wrong.'}` }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Connection error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #f0f4ff 100%)' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Intelligence Hub</h1>
            <p className="text-sm text-slate-500">Your organizational brain — ask anything about RDS</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Quick Insights + Health Scores */}
        <div className="xl:col-span-1 space-y-5">
          {/* Quick Insight Cards */}
          {insightsLoading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>)}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Quick Insights</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)' }}>
                  <p className="text-2xl font-bold text-violet-700">{insights?.clients?.active ?? '—'}</p>
                  <p className="text-xs text-violet-600 mt-1 font-medium">Active Clients</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
                  <p className="text-2xl font-bold text-amber-700">{insights?.tasks?.pending ?? '—'}</p>
                  <p className="text-xs text-amber-600 mt-1 font-medium">Pending Tasks</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)' }}>
                  <p className="text-2xl font-bold text-red-700">{insights?.tasks?.overdue ?? '—'}</p>
                  <p className="text-xs text-red-600 mt-1 font-medium">Overdue Tasks</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
                  <p className="text-2xl font-bold text-emerald-700">{insights?.escalations?.open ?? '—'}</p>
                  <p className="text-xs text-emerald-600 mt-1 font-medium">Open Escalations</p>
                </div>
              </div>
              {(insights?.escalations?.critical ?? 0) > 0 && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  <p className="text-xs font-medium text-red-700">{insights?.escalations?.critical} critical escalation{(insights?.escalations?.critical ?? 0) > 1 ? 's' : ''} need attention</p>
                </div>
              )}
            </div>
          )}

          {/* Client Status Overview */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Client Pulse</h2>
            {healthScores.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400">No client data yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {healthScores.map((hs, i) => {
                  const colors = getRiskColor(hs.risk_level);
                  return (
                    <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 border ${colors.bg} ${colors.border}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`}></div>
                        <span className="text-xs font-medium text-slate-700 truncate">{hs.client.company_name}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${colors.text} ${colors.bg}`}>
                        {hs.risk_level}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Suggested Prompts */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Ask the AI</h2>
            <div className="space-y-2">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  disabled={isLoading}
                  className="w-full text-left text-xs text-slate-600 hover:text-violet-700 hover:bg-violet-50 px-3 py-2 rounded-lg transition-all duration-150 border border-slate-100 hover:border-violet-200 disabled:opacity-50"
                >
                  {prompt} →
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Full AI Chat */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col" style={{ height: '78vh' }}>
            {/* Chat Header */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">RDS Intelligence Assistant</p>
                <p className="text-xs text-slate-400">Access to all clients, tasks, campaigns, meetings & more</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-slate-400">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)' }}>
                    <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">RDS Intelligence Assistant</h3>
                  <p className="text-sm text-slate-500 max-w-sm">Ask me anything about your clients, campaigns, tasks, meetings, escalations, or business performance.</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-2 flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'text-white rounded-tr-sm'
                        : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-sm'
                    }`}
                    style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' } : {}}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-2 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about clients, campaigns, tasks, escalations…"
                  disabled={isLoading}
                  className="flex-1 text-sm text-slate-800 bg-transparent outline-none placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
              <p className="text-center text-[10px] text-slate-300 mt-2">Powered by Groq · For internal use only</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
