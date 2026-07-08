'use client';

import { useState, useEffect } from 'react';

type TrackerCell = {
  id?: string;
  summary_text: string | null;
  summaries?: { department: string; text: string; color: string | null }[];
  status_color: string | null;
  tasks?: any[];
};

type Client = {
  id: string;
  company_name: string;
};

const DEPARTMENTS = ['All Departments', 'Web Development', 'SEO', 'Paid Media', 'Social Media'];

export default function TrackerPage() {
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'Day' | 'Week'>('Day');
  const [dates, setDates] = useState<Date[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [trackerMap, setTrackerMap] = useState<Record<string, Record<string, TrackerCell>>>({});
  const [loading, setLoading] = useState(true);
  const [hideEmpty, setHideEmpty] = useState(false);

  // Modal State
  const [selectedCell, setSelectedCell] = useState<{ client_id: string, clientName: string, dateStr: string, text: string, color: string, tasks: any[], modalDepartment: string } | null>(null);

  useEffect(() => {
    if (viewMode === 'Day') {
      setDates([selectedDate]);
    } else {
      const d = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() - i);
        d.push(date);
      }
      setDates(d);
    }
  }, [selectedDate, viewMode]);

  useEffect(() => {
    if (dates.length > 0) fetchTrackerData();
  }, [department, dates]);

  const fetchTrackerData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const startDate = dates[0].toISOString();
      const endDate = dates[dates.length - 1].toISOString();

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/tracker?department=${encodeURIComponent(department)}&startDate=${startDate}&endDate=${endDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setClients(data.clients);
        setTrackerMap(data.trackerMap);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openCellModal = (client: Client, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const cellData = trackerMap[client.id]?.[dateStr] || { summary_text: '', status_color: '', tasks: [], summaries: [] };
    
    let initialModalDepartment = department;
    
    if (department === 'All Departments') {
      // Find the first department that actually has data in this cell
      if (cellData.summaries && cellData.summaries.length > 0) {
        initialModalDepartment = cellData.summaries[0].department;
      } else {
        initialModalDepartment = 'Web Development';
      }
    }
    
    let initialText = '';
    let initialColor = '';
    
    if (department === 'All Departments') {
      const existingSummary = cellData.summaries?.find(s => s.department === initialModalDepartment);
      if (existingSummary) {
        initialText = existingSummary.text || '';
        initialColor = existingSummary.color || '';
      }
    } else {
      initialText = cellData.summary_text || '';
      initialColor = cellData.status_color || '';
    }

    setSelectedCell({
      client_id: client.id,
      clientName: client.company_name,
      dateStr,
      text: initialText,
      color: initialColor,
      tasks: cellData.tasks || [],
      modalDepartment: initialModalDepartment
    });
  };

  const saveCell = async () => {
    if (!selectedCell) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/tracker/cell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          client_id: selectedCell.client_id,
          department: selectedCell.modalDepartment,
          date: new Date(selectedCell.dateStr).toISOString(),
          summary_text: selectedCell.text,
          status_color: selectedCell.color
        })
      });

      if (res.ok) {
        // Refetch to get updated structured data for All Departments correctly
        setSelectedCell(null);
        fetchTrackerData(); // Refresh to ensure data sync
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save cell data.');
    }
  };

  const getCellColorClass = (colorStr: string | null) => {
    if (colorStr === 'Green') return 'bg-green-100 hover:bg-green-200';
    if (colorStr === 'Yellow') return 'bg-yellow-100 hover:bg-yellow-200';
    if (colorStr === 'Red') return 'bg-red-100 hover:bg-red-200';
    return 'bg-white hover:bg-slate-50';
  };

  const filteredClients = clients.filter(client => {
    if (!hideEmpty) return true;
    return dates.some(date => {
      const dateStr = date.toISOString().split('T')[0];
      const cell = trackerMap[client.id]?.[dateStr];
      return cell && (cell.summary_text || cell.status_color || (cell.tasks && cell.tasks.length > 0));
    });
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Daily Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Grid view of daily updates per client.</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={hideEmpty}
              onChange={(e) => setHideEmpty(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
            />
            <span>Hide Empty</span>
          </label>
          <div className="flex bg-slate-100 p-1 rounded-md">
            <button
              onClick={() => setViewMode('Day')}
              className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'Day' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('Week')}
              className={`px-3 py-1 text-xs font-medium rounded ${viewMode === 'Week' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Week
            </button>
          </div>
          <input 
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-700 py-2 px-3"
          />
          <select 
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-700 py-2 pl-3 pr-10"
          >
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading Tracker Grid...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 table-fixed">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-48 sticky left-0 bg-slate-50 px-6 py-3 text-left text-xs font-semibold text-slate-900 uppercase tracking-wider border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  Brands
                </th>
                {dates.map((d, i) => (
                  <th key={i} className="w-48 px-4 py-3 text-center text-xs font-semibold text-slate-900 uppercase tracking-wider border-r border-slate-200 last:border-r-0">
                    {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredClients.map(client => (
                <tr key={client.id}>
                  <td className="sticky left-0 bg-white px-6 py-4 text-sm font-medium text-slate-900 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] truncate">
                    {client.company_name}
                  </td>
                  {dates.map((date, i) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const cell = trackerMap[client.id]?.[dateStr];
                    const colorClass = getCellColorClass(cell?.status_color || null);
                    
                    return (
                      <td 
                        key={i} 
                        onClick={() => openCellModal(client, date)}
                        className={`px-3 py-2 border-r border-slate-200 last:border-r-0 text-xs text-slate-700 cursor-pointer transition-colors align-top ${colorClass}`}
                      >
                        <div className="w-full min-h-[4rem] flex flex-col gap-1">
                          {cell?.summaries && cell.summaries.length > 0 ? (
                            <div className="flex flex-col gap-2 pb-1.5 border-b border-slate-200">
                              {cell.summaries.map((s, idx) => (
                                <div key={idx} className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5">
                                    {s.color && (
                                      <span className={`w-2 h-2 rounded-full ${s.color === 'Green' ? 'bg-green-500' : s.color === 'Yellow' ? 'bg-yellow-500' : s.color === 'Red' ? 'bg-red-500' : 'bg-slate-300'}`}></span>
                                    )}
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.department}</span>
                                  </div>
                                  <span className="text-slate-600">{s.text}</span>
                                </div>
                              ))}
                            </div>
                          ) : cell?.summary_text ? (
                            <div className="text-slate-600 pb-1.5 border-b border-slate-200">
                              {cell.summary_text}
                            </div>
                          ) : null}
                          
                          {cell?.tasks && cell.tasks.length > 0 ? (
                            <div className="mt-1">
                              <h4 className="text-[10px] font-bold text-center text-slate-500 uppercase tracking-wider mb-1">Tasks</h4>
                              <ol className="list-decimal list-inside space-y-1">
                                {cell.tasks.map((task: any, idx: number) => (
                                  <li key={task.id} className="text-[10px] leading-tight">
                                    {department === 'All Departments' && task.department && (
                                      <span className="font-bold text-slate-500 mr-1">[{task.department}]</span>
                                    )}
                                    <span className={task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-700'}>
                                      {task.title}
                                    </span>
                                    <span className="ml-1 text-slate-500 font-medium">[{task.status}]</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          ) : (
                            (!cell?.summary_text && (!cell?.summaries || cell.summaries.length === 0)) && <span className="text-slate-300 italic">--</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Cell Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 transform transition-all">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Update Tracker
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {selectedCell.clientName} - {selectedCell.dateStr}
            </p>

            <div className="space-y-4">
              {department === 'All Departments' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Department</label>
                  <select 
                    value={selectedCell.modalDepartment}
                    onChange={e => {
                      const newDept = e.target.value;
                      const cellData = trackerMap[selectedCell.client_id]?.[selectedCell.dateStr] || { summaries: [] };
                      const existingSummary = cellData.summaries?.find((s: any) => s.department === newDept);
                      setSelectedCell({
                        ...selectedCell, 
                        modalDepartment: newDept,
                        text: existingSummary ? existingSummary.text || '' : '',
                        color: existingSummary ? existingSummary.color || '' : ''
                      });
                    }}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-sm py-2 px-3"
                  >
                    {DEPARTMENTS.filter(d => d !== 'All Departments').map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Summary</label>
                <textarea 
                  rows={4}
                  value={selectedCell.text}
                  onChange={e => setSelectedCell({...selectedCell, text: e.target.value})}
                  placeholder="Enter daily update here..."
                  className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status Color</label>
                <div className="flex gap-3">
                  {['None', 'Green', 'Yellow', 'Red'].map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedCell({...selectedCell, color: c === 'None' ? '' : c})}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                        selectedCell.color === c || (c === 'None' && !selectedCell.color)
                          ? 'border-indigo-600 ring-2 ring-indigo-100' 
                          : 'border-slate-200 hover:border-slate-300'
                      } ${c === 'Green' ? 'bg-green-100 text-green-800' : c === 'Yellow' ? 'bg-yellow-100 text-yellow-800' : c === 'Red' ? 'bg-red-100 text-red-800' : 'bg-slate-50 text-slate-600'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {selectedCell.tasks && selectedCell.tasks.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Linked Tasks</label>
                <div className="space-y-2">
                  {selectedCell.tasks.map((task: any) => (
                    <div key={task.id} className="text-xs text-slate-600 flex justify-between items-center bg-slate-50 p-2 rounded">
                      <span>{task.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                      }`}>{task.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
              <a 
                href={`/tasks/new?client_id=${selectedCell.client_id}&due_date=${selectedCell.dateStr}`}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                + Create Task
              </a>
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedCell(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveCell}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Save Cell
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
