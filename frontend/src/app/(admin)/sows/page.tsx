'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SowTracerPage() {
  const [loading, setLoading] = useState(true);
  const [sows, setSows] = useState<any[]>([]);
  
  const currentMonthString = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthString);
  const [selectedBrand, setSelectedBrand] = useState<string>('All');

  useEffect(() => {
    fetchSows();
  }, []);

  const fetchSows = () => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/sows?approval_status=Approved`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setSows(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching SOWs:', err);
        setLoading(false);
      });
  };

  // Flatten the approved months to render easily
  const approvedMonths = sows.flatMap(sow => {
    return sow.months
      .filter((m: any) => m.approval_status === 'Approved')
      .map((m: any) => ({
        ...m,
        sow_name: sow.sow_name,
        client_name: sow.client?.company_name,
        sow_id: sow.id
      }));
  });

  const uniqueBrands = Array.from(new Set(approvedMonths.map(m => m.client_name).filter(Boolean))).sort();
  
  const availableMonthsRaw = Array.from(new Set(approvedMonths.map(m => m.month_year)));
  if (!availableMonthsRaw.includes(currentMonthString)) availableMonthsRaw.push(currentMonthString);
  const availableMonths = availableMonthsRaw.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const filteredMonths = approvedMonths.filter(m => {
    let monthMatch = selectedMonth === 'All' || m.month_year === selectedMonth;
    let brandMatch = selectedBrand === 'All' || m.client_name === selectedBrand;
    return monthMatch && brandMatch;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">SOW Tracer</h1>
          <p className="text-sm text-slate-500 mt-1">Compare Approved Deliverables vs Actual Completed Tasks.</p>
        </div>
        <Link 
          href="/sows/input"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
        >
          Draft New SOW
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-lg border border-slate-200 h-64"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Month</label>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-700 shadow-sm min-w-[140px]"
              >
                <option value="All">All Time Overview</option>
                {availableMonths.map(m => (
                  <option key={m as string} value={m as string}>{m as string}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Brand</label>
              <select 
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-700 shadow-sm min-w-[140px]"
              >
                <option value="All">All Brands</option>
                {uniqueBrands.map(b => (
                  <option key={b as string} value={b as string}>{b as string}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredMonths.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-lg border border-slate-200 shadow-sm">
              <p>No Approved SOWs found matching the selected filters.</p>
            </div>
          ) : (
            filteredMonths.map(month => (
              <div key={month.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{month.client_name} - {month.month_year}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{month.sow_name}</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Approved
                  </span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                  {/* Left Column: SOW Deliverables */}
                  <div className="p-5">
                    <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      Agreed Deliverables (SOW)
                    </h4>
                    <ul className="space-y-3">
                      {month.items && month.items.length > 0 ? (
                        month.items.map((item: any, idx: number) => (
                          <li key={item.id || idx} className="flex items-start text-sm text-slate-700 bg-indigo-50/50 p-3 rounded-md border border-indigo-100">
                            <span className="font-medium mr-2">{idx + 1}.</span> {item.deliverable_name}
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-slate-400 italic">No deliverables mapped.</li>
                      )}
                    </ul>
                  </div>

                  {/* Right Column: Actual Completed Tasks */}
                  <div className="p-5">
                    <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Actual Tasks Completed
                    </h4>
                    <ul className="space-y-3">
                      {month.items && month.items.some((item: any) => item.tasks && item.tasks.length > 0) ? (
                        month.items.map((item: any) => 
                          item.tasks?.map((task: any) => (
                            <li key={task.id} className="text-sm text-slate-700 bg-emerald-50/50 p-3 rounded-md border border-emerald-100">
                              <div className="font-medium">{task.title}</div>
                              <div className="flex justify-between items-center mt-2">
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                  task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {task.status}
                                </span>
                                <Link href={`/tasks/${task.id}`} className="text-indigo-600 hover:underline text-xs">
                                  View Task &rarr;
                                </Link>
                              </div>
                            </li>
                          ))
                        )
                      ) : (
                        <li className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-md border border-slate-100 text-center">
                          No tasks have been linked or completed for these deliverables yet.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
