'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type SowItem = {
  id: string;
  deliverable_name: string;
  status: string; // Pending, In Progress, Completed
  tracking_month?: string;
};

type Sow = {
  id: string;
  sow_name: string;
  total_value: number;
  status: string;
  start_date: string;
  end_date: string;
  client?: { company_name: string };
  items?: SowItem[];
};

export default function SowsPage() {
  const [sows, setSows] = useState<Sow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newItemName, setNewItemName] = useState<{ [sowId: string]: string }>({});
  
  const currentMonthString = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthString);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user?.role_name === 'Admin');
    fetchSows(user?.role_name);
  }, []);

  const fetchSows = (roleName?: string) => {
    const roleQuery = roleName ? `?role=${encodeURIComponent(roleName)}` : '';
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/sows' + roleQuery)
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

  const deleteSow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(!window.confirm('Are you sure you want to delete this SOW?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/sows/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        fetchSows(user?.role_name);
      }
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/sows/items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      fetchSows(user?.role_name);
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const handleAddItem = async (sowId: string, month: string) => {
    const key = `${sowId}_${month}`;
    const name = newItemName[key];
    if (!name || name.trim() === '') return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/sows/${sowId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverable_name: name.trim(), tracking_month: month }),
      });
      setNewItemName({ ...newItemName, [key]: '' });
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      fetchSows(user?.role_name);
    } catch (error) {
      console.error('Failed to add item', error);
    }
  };



  const calculateProgress = (items: SowItem[] = []) => {
    if (items.length === 0) return 0;
    const completed = items.filter(item => item.status === 'Completed').length;
    return Math.round((completed / items.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
      case 'In Progress': return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200';
      default: return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200';
    }
  };

  // Extract all valid months from SOWs' date ranges, plus any existing item months
  const availableMonthsRaw = Array.from(new Set(
    sows.flatMap(sow => {
      const months: string[] = [];
      if (sow.start_date && sow.end_date) {
        let start = new Date(sow.start_date);
        let end = new Date(sow.end_date);
        if (start <= end) {
          let current = new Date(start.getFullYear(), start.getMonth(), 1);
          while (current <= end) {
            months.push(current.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
            current.setMonth(current.getMonth() + 1);
          }
        }
      }
      const itemMonths = sow.items?.map(item => item.tracking_month).filter(Boolean) || [];
      return [...months, ...itemMonths];
    })
  )).filter(m => m);

  // Ensure current month is an option if we want to default to it, even if no SOWs exist yet
  if (availableMonthsRaw.length === 0) {
    availableMonthsRaw.push(currentMonthString);
  } else if (!availableMonthsRaw.includes(selectedMonth) && availableMonthsRaw.length > 0) {
    // If the selected month (current month) is not in the list of SOWs, default to the most recent one
    // But we use useEffect to fix state, so we just let it be.
  }

  const availableMonths = availableMonthsRaw.sort((a, b) => {
    if (a === 'Unspecified Month') return 1;
    if (b === 'Unspecified Month') return -1;
    return new Date(a as string).getTime() - new Date(b as string).getTime();
  });

  // Ensure selectedMonth is valid
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth) && selectedMonth !== 'All') {
      setSelectedMonth(availableMonths[0] as string);
    }
  }, [availableMonths, selectedMonth]);

  // Calculate overall statistics for the currently selected month
  const getOverallStats = () => {
    let totalBrands = 0;
    let totalItems = 0;
    let completedItems = 0;
    let totalValue = 0;

    sows.forEach(sow => {
      const filtered = selectedMonth === 'All' 
        ? (sow.items || [])
        : (sow.items || []).filter(i => i.tracking_month === selectedMonth);
      
      const isOverlap = () => {
        if (selectedMonth === 'All' || selectedMonth === 'Unspecified Month') return true;
        if (filtered.length > 0) return true;
        
        const selDate = new Date(selectedMonth);
        const start = sow.start_date ? new Date(sow.start_date) : null;
        const end = sow.end_date ? new Date(sow.end_date) : null;
        
        if (start && end) {
          const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
          const endMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0);
          return selDate >= startMonth && selDate <= endMonth;
        }
        return false;
      };

      if (isOverlap()) {
        totalBrands++;
        totalItems += filtered.length;
        completedItems += filtered.filter(i => i.status === 'Completed').length;
        totalValue += (sow.total_value || 0);
      }
    });

    const overallProgress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
    return { totalBrands, totalItems, completedItems, overallProgress, totalValue };
  };

  const stats = getOverallStats();

  return (
    <div>
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Monthly Brand Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track your clients' monthly deliverables.</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-700 shadow-sm"
          >
            <option value="All">All Time Overview</option>
            {availableMonths.map(m => (
              <option key={m} value={m as string}>{m}</option>
            ))}
          </select>
          <Link 
            href="/sows/new" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Create SOW
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-lg border border-slate-200 h-48"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Monthly Overview Dashboard */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-6">
            <div className="flex items-center gap-8 w-full sm:w-auto">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Active Brands</p>
                <div className="text-2xl font-semibold text-slate-900">{stats.totalBrands}</div>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Total Deliverables</p>
                <div className="text-2xl font-semibold text-slate-900">
                  {stats.totalItems}
                  <span className="text-sm font-normal text-slate-500 ml-2">({stats.completedItems} done)</span>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Total Monthly Value</p>
                <div className="text-2xl font-semibold text-slate-900 text-emerald-600">
                  ₹{stats.totalValue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            
            <div className="w-full sm:w-64">
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                <span>Overall Progress</span>
                <span className={stats.overallProgress === 100 ? 'text-emerald-600 font-semibold' : 'text-indigo-600 font-semibold'}>{stats.overallProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className={`${stats.overallProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'} h-full rounded-full transition-all duration-700 ease-out`}
                  style={{ width: `${stats.overallProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
          {sows.map(sow => {
            const filteredItems = selectedMonth === 'All' 
              ? (sow.items || [])
              : (sow.items || []).filter(item => item.tracking_month === selectedMonth);

            const progress = calculateProgress(filteredItems);

            return (
              <div 
                key={sow.id} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Brand Header */}
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-slate-900 text-base">
                        {sow.client?.company_name || 'General Brand'} - <span className="font-medium text-slate-600">{sow.sow_name}</span>
                      </h3>
                      
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        sow.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                        sow.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {sow.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-emerald-600">₹{sow.total_value?.toLocaleString('en-IN') || 0}</span>
                      {sow.start_date && sow.end_date && (
                        <>
                          <span>•</span>
                          <span>{new Date(sow.start_date).toLocaleDateString()} - {new Date(sow.end_date).toLocaleDateString()}</span>
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <span>•</span>
                          <div className="flex items-center space-x-2">
                            <Link href={`/sows/${sow.id}`} className="text-indigo-600 hover:text-indigo-800 transition-colors">Edit</Link>
                            <span className="text-slate-300">|</span>
                            <button onClick={() => deleteSow(sow.id)} className="text-rose-600 hover:text-rose-800 transition-colors">Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="flex flex-col items-end min-w-[150px]">
                    <div className="flex justify-between w-full mb-1">
                      <span className="text-xs font-medium text-slate-500">
                        {selectedMonth === 'All' ? 'Total Progress' : `${selectedMonth.split(' ')[0]} Progress`}
                      </span>
                      <span className={`text-xs font-semibold ${progress === 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1 overflow-hidden">
                      <div 
                        className={`${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'} h-full rounded-full transition-all duration-500 ease-out`} 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-400">{filteredItems.length} Deliverables</span>
                  </div>
                </div>

                {/* Always Visible Deliverables List */}
                <div className="bg-white">
                  {filteredItems.length > 0 ? (
                    <ul className="divide-y divide-slate-100">
                      {filteredItems.map((item) => (
                        <li key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                          <span className="text-sm font-medium text-slate-700 flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              item.status === 'Completed' ? 'bg-emerald-500' :
                              item.status === 'In Progress' ? 'bg-indigo-500' :
                              'bg-slate-300'
                            }`}></div>
                            
                            <span className={item.status === 'Completed' ? 'text-slate-400 line-through decoration-slate-300' : ''}>
                              {item.deliverable_name}
                            </span>
                            
                            {selectedMonth === 'All' && item.tracking_month && (
                              <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium border border-slate-200">
                                {item.tracking_month}
                              </span>
                            )}
                          </span>
                          <div className="relative w-36">
                            <select 
                              value={item.status}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className={`w-full text-xs font-medium pl-3 pr-8 py-1.5 rounded border appearance-none outline-none cursor-pointer transition-colors shadow-sm ${
                                item.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                item.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                'bg-white text-slate-600 border-slate-300 hover:border-slate-400 focus:border-indigo-500'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="py-8 px-6 text-center">
                      <p className="text-sm text-slate-500">No deliverables found for {selectedMonth}. Add one below.</p>
                    </div>
                  )}
                  
                  {/* Add New Deliverable */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 items-center">
                    <input 
                      type="text" 
                      placeholder={selectedMonth === 'All' ? "Select a specific month to add items..." : `Add deliverable for ${selectedMonth}...`}
                      value={selectedMonth === 'All' ? '' : (newItemName[`${sow.id}_${selectedMonth}`] || '')}
                      onChange={(e) => selectedMonth !== 'All' && setNewItemName({...newItemName, [`${sow.id}_${selectedMonth}`]: e.target.value})}
                      onKeyDown={(e) => { if (e.key === 'Enter' && selectedMonth !== 'All') handleAddItem(sow.id, selectedMonth) }}
                      disabled={selectedMonth === 'All'}
                      className="flex-1 border border-slate-300 px-3 py-2 text-sm rounded-md outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed bg-white"
                    />
                    <button 
                      onClick={() => handleAddItem(sow.id, selectedMonth)}
                      disabled={selectedMonth === 'All' || !newItemName[`${sow.id}_${selectedMonth}`]?.trim()}
                      className="bg-indigo-600 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
          </div>
        </div>
      )}
      
      {!loading && sows.length === 0 && (
        <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Contracts Found</h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Draft your first Statement of Work to start tracking deliverables, contract values, and client progress.</p>
          <Link 
            href="/sows/new" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition shadow-sm inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Create First SOW
          </Link>
        </div>
      )}
    </div>
  );
}
