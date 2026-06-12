'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type SowItem = {
  id: string;
  item_name: string;
  description: string;
  status: string; // 'Pending', 'In Progress', 'Completed'
};

type Sow = {
  id: string;
  title: string;
  value: number;
  start_date: string;
  end_date: string;
  client?: { company_name: string };
  sow_items: SowItem[];
};

export default function SowsPage() {
  const [sows, setSows] = useState<Sow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchSows();
  }, []);

  const fetchSows = () => {
    fetch('http://localhost:5000/api/sows')
      .then(res => res.json())
      .then(data => { 
        if (data && data.data) {
          setSows(data.data); 
        }
        setLoading(false); 
      })
      .catch(error => {
        console.error('Error fetching SOWs:', error);
        setLoading(false);
      });
  };

  const updateItemStatus = async (itemId: string, newStatus: string) => {
    try {
      await fetch(`http://localhost:5000/api/sows/items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchSows(); // Refresh data to update progress bars
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const calculateProgress = (items: SowItem[]) => {
    if (items.length === 0) return 0;
    const completed = items.filter(i => i.status === 'Completed').length;
    return Math.round((completed / items.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-500 text-white';
      case 'In Progress': return 'bg-blue-500 text-white';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-600">
            SOW Tracking
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Track client deliverables, contract values, and delivery progress.</p>
        </div>
        <Link 
          href="/sows/new" 
          className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-teal-200 transition transform hover:-translate-y-1"
        >
          + Create SOW
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-72"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sows.map(sow => {
            const progress = calculateProgress(sow.sow_items);
            return (
              <div 
                key={sow.id} 
                className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
              >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-widest border border-teal-100">
                        {sow.client?.company_name || 'General'}
                      </span>
                      <h3 className="text-2xl font-black text-gray-900 mt-3 leading-tight">
                        {sow.title}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">₹{sow.value.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400 font-medium">Total Value</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-6 font-medium">
                    <div className="flex items-center">
                      <span className="mr-2">📅</span>
                      {new Date(sow.start_date).toLocaleDateString()} - {new Date(sow.end_date).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-gray-700">Delivery Progress</span>
                      <span className="text-sm font-black text-teal-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-teal-400 to-cyan-500 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Expand Deliverables */}
                  <div className="mt-6 border-t pt-4">
                    <button 
                      onClick={() => setExpandedId(expandedId === sow.id ? null : sow.id)}
                      className="w-full text-left text-sm font-bold text-gray-800 hover:text-teal-600 flex justify-between items-center transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">{sow.sow_items.length}</span>
                        SOW Deliverables
                      </span>
                      <span className={`transform transition-transform ${expandedId === sow.id ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>

                    {/* Expanded Items */}
                    {expandedId === sow.id && (
                      <div className="mt-4 space-y-3">
                        {sow.sow_items.map((item) => (
                          <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center hover:bg-gray-100 transition">
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{item.item_name}</p>
                              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                            </div>
                            <select 
                              value={item.status}
                              onChange={(e) => updateItemStatus(item.id, e.target.value)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg border-0 shadow-sm cursor-pointer outline-none appearance-none ${getStatusColor(item.status)}`}
                            >
                              <option className="bg-white text-gray-800" value="Pending">Pending</option>
                              <option className="bg-white text-gray-800" value="In Progress">In Progress</option>
                              <option className="bg-white text-gray-800" value="Completed">Completed</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {!loading && sows.length === 0 && (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-800">No SOWs Created</h2>
          <p className="text-gray-500 mt-2">Start tracking your client contracts and deliverables here.</p>
        </div>
      )}
    </div>
  );
}
