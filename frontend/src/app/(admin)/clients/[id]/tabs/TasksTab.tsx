'use client';
import { useEffect, useState, Fragment } from 'react';

export default function TasksTab({ client }: any) {
  const [groupedItems, setGroupedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`; // YYYY-MM
  });

  useEffect(() => {
    if (client?.id && selectedMonth) {
      setLoading(true);
      const [year, month] = selectedMonth.split('-');
      // Calculate start and end of the selected month
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999).toISOString();

      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/tracker/activity?client_id=${client.id}&startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(r => r.json())
        .then(data => {
          const fetchedTasks = data.tasks || [];
          const fetchedSummaries = data.summaries || [];

          const allItems: any[] = [];

          fetchedTasks.forEach((t: any) => {
            allItems.push({
              id: t.id,
              type: 'Task',
              dateObj: new Date(t.updated_at), // Must use updated_at because that's how the API filters them for the selected month
              department: t.department || 'General',
              title: t.title,
              description: t.description,
              status: t.status
            });
          });

          fetchedSummaries.forEach((c: any) => {
            if (!c.summary_text || c.summary_text.trim() === '') return; // Skip empty logs
            
            const dateObj = new Date(c.date);
            allItems.push({
              id: c.id,
              type: 'Summary',
              dateObj: new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000), // Adjust to local midnight so it doesn't shift
              department: c.department || 'General',
              title: 'Daily Update',
              description: c.summary_text,
              status: null
            });
          });

          // Group by Date String
          const groups: Record<string, { dateObj: Date; items: any[] }> = {};
          allItems.forEach(item => {
            const dateStr = item.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            if (!groups[dateStr]) groups[dateStr] = { dateObj: item.dateObj, items: [] };
            groups[dateStr].items.push(item);
          });

          const sortedGroups = Object.values(groups).sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
          
          setGroupedItems(sortedGroups);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [client, selectedMonth]);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-6 lg:col-span-2">
      <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Daily Tracker: Tasks & Summary</h3>
          <p className="text-xs text-slate-500 mt-1">Date-wise combined view of tasks and everyday status logs.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">Month:</label>
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-slate-300 rounded p-1.5 text-sm text-slate-800 outline-none hover:border-indigo-400 focus:border-indigo-600 transition-colors"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm animate-pulse">Loading activity for {selectedMonth}...</div>
      ) : groupedItems.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] border border-slate-200 bg-white shadow-sm rounded">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase w-[100px]">Type</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase w-[140px]">Department</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Details</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase w-[120px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {groupedItems.map((group, groupIndex) => (
                <Fragment key={groupIndex}>
                  {/* Date Divider Row */}
                  <tr className="bg-slate-100/80 border-y border-slate-200">
                    <td colSpan={4} className="py-2.5 px-4 text-sm font-semibold text-slate-700">
                      {group.dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                  
                  {/* Activity Rows */}
                  {group.items.map((item: any, idx: number) => (
                    <tr key={`${groupIndex}-${idx}`} className="border-b border-slate-100 last:border-b-0">
                      
                      <td className="py-3.5 px-4 align-top">
                        <span className="text-xs font-medium text-slate-600">
                          {item.type}
                        </span>
                      </td>
                      
                      <td className="py-3.5 px-4 align-top">
                        <span className="text-xs font-medium text-slate-600">
                          {item.department}
                        </span>
                      </td>
                      
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col gap-1">
                          {item.type === 'Task' && (
                            <span className="font-medium text-slate-800 text-sm">{item.title}</span>
                          )}
                          {item.description && (
                            <div className="text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: item.description }}></div>
                          )}
                        </div>
                      </td>
                      
                      <td className="py-3.5 px-4 align-top">
                        {item.type === 'Task' ? (
                          <span className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-sm ${
                            item.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm text-slate-500 font-medium">No tasks or summaries found for {selectedMonth}.</p>
          <p className="text-xs text-slate-400 mt-1">Try selecting a different month from the top right.</p>
        </div>
      )}
    </div>
  );
}
