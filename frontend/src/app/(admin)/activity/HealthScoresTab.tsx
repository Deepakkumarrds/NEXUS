'use client';

import { useState, useEffect } from 'react';

type HealthScore = {
  client_id: string;
  company_name: string;
  brand_name: string | null;
  overall_score: number | null;
  risk_level: string;
  feedback: string | null;
  calculated_at?: string;
};

export default function HealthScoresTab() {
  const [scores, setScores] = useState<HealthScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<HealthScore | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Form State
  const [form, setForm] = useState({
    overall_score: 5,
    feedback: ''
  });

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/client-health`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setScores(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'Stable': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Risk': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleUpdateClick = (client: HealthScore) => {
    setSelectedClient(client);
    setForm({
      overall_score: client.overall_score ? (client.overall_score > 10 ? Math.round(client.overall_score / 4) : client.overall_score) : 5,
      feedback: client.feedback || ''
    });
    setShowHistory(false);
  };

  const handleViewHistory = async (client: HealthScore) => {
    setSelectedClient(client);
    setShowHistory(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/client-health/${client.client_id}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setHistoryData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const submitScore = async () => {
    if (!selectedClient) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/client-health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          client_id: selectedClient.client_id,
          ...form
        })
      });
      if (res.ok) {
        setSelectedClient(null);
        fetchScores();
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save health score');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading Health Scores...</div>
      ) : (
        <div>
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-900 uppercase tracking-wider">Overall Score</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-900 uppercase tracking-wider">Risk Level</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider w-1/3">Latest Feedback</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-900 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {scores.map(client => (
                <tr key={client.client_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-900">{client.company_name}</div>
                    {client.brand_name && <div className="text-xs text-slate-500">{client.brand_name}</div>}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                    {client.overall_score ? (
                      <span className="font-bold text-slate-900">
                        {client.overall_score > 10 ? Math.round(client.overall_score / 4) : client.overall_score}/10
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unrated</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRiskColor(client.risk_level)}`}>
                      {client.risk_level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {client.feedback || <span className="text-slate-400 italic">No feedback provided yet.</span>}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleViewHistory(client)} className="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold transition-colors">History</button>
                    <button onClick={() => handleUpdateClick(client)} className="text-indigo-600 hover:text-indigo-900 font-semibold transition-colors">Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Update Modal */}
      {selectedClient && !showHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Update Health Score</h3>
                <p className="text-sm text-slate-500">{selectedClient.company_name}</p>
              </div>
              <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Overall Score (1-10)</label>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded ${form.overall_score >= 9 ? 'bg-green-100 text-green-700' : form.overall_score >= 7 ? 'bg-blue-100 text-blue-700' : form.overall_score >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {form.overall_score}/10
                  </span>
                </div>
                <input 
                  type="range" min="1" max="10" 
                  value={form.overall_score}
                  onChange={(e) => setForm({...form, overall_score: parseInt(e.target.value)})}
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
                  <span>Critical (1)</span>
                  <span>Stable (7)</span>
                  <span>Excellent (10)</span>
                </div>
              </div>

              <hr className="border-slate-200" />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Feedback</label>
                <textarea 
                  rows={4}
                  value={form.feedback}
                  onChange={(e) => setForm({...form, feedback: e.target.value})}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 resize-none"
                  placeholder="Leave some quick notes about the client's current status..."
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button onClick={() => setSelectedClient(null)} className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
              <button onClick={submitScore} className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">Save Score</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {selectedClient && showHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] transform transition-all">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Health History</h3>
                <p className="text-sm text-slate-500">{selectedClient.company_name}</p>
              </div>
              <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-50">
              {historyData.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-slate-900">No History</h3>
                  <p className="mt-1 text-sm text-slate-500">This client doesn't have any recorded health scores yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyData.slice().reverse().map((record, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-sm font-semibold text-slate-900 block mb-1">
                            {new Date(record.calculated_at).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-slate-900">
                            {record.overall_score > 10 ? Math.round(record.overall_score / 4) : record.overall_score}/10
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRiskColor(record.risk_level)}`}>
                            {record.risk_level}
                          </span>
                        </div>
                      </div>
                      
                      {record.feedback && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
