'use client';

interface TabMonthlyPlansProps {
  client: any;
  monthlyDepartment: string;
  setMonthlyDepartment: (val: string) => void;
  monthlyMonthYear: string;
  setMonthlyMonthYear: (val: string) => void;
  monthlyDocumentLink: string;
  setMonthlyDocumentLink: (val: string) => void;
  handleAddMonthlyPlan: (e: React.FormEvent) => void;
  monthlyFilter: string;
  setMonthlyFilter: (val: string) => void;
  handleDeleteMonthlyPlan: (id: string) => void;
}

export default function TabMonthlyPlans({
  client,
  monthlyDepartment,
  setMonthlyDepartment,
  monthlyMonthYear,
  setMonthlyMonthYear,
  monthlyDocumentLink,
  setMonthlyDocumentLink,
  handleAddMonthlyPlan,
  monthlyFilter,
  setMonthlyFilter,
  handleDeleteMonthlyPlan
}: TabMonthlyPlansProps) {
  if (!client) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Monthly Plans & Documents</h2>
        <p className="text-xs text-slate-500 mt-1">Store and manage department-wise monthly plans, calendars, and campaign documents.</p>
      </div>

      <form onSubmit={handleAddMonthlyPlan} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
          <select value={monthlyDepartment} onChange={e => setMonthlyDepartment(e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white outline-none">
            <option value="Social Media">Social Media</option>
            <option value="Paid Media">Paid Media</option>
            <option value="SEO">SEO</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Month & Year</label>
          <input type="text" value={monthlyMonthYear} onChange={e => setMonthlyMonthYear(e.target.value)} placeholder="e.g. January 2026" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Document Link</label>
          <input type="url" value={monthlyDocumentLink} onChange={e => setMonthlyDocumentLink(e.target.value)} placeholder="https://..." className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
        </div>
        <div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-semibold text-xs px-4 py-1.5 rounded hover:bg-indigo-700 transition shadow-sm">Save Plan</button>
        </div>
      </form>

      {client.monthly_plans && client.monthly_plans.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <select
              value={monthlyFilter}
              onChange={e => setMonthlyFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded p-1.5 bg-white outline-none w-48"
            >
              <option value="All">All Months</option>
              {Array.from(new Set(client.monthly_plans.map((p: any) => p.month_year))).map((month: any) => (
                <option key={month as string} value={month as string}>{month as string}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(monthlyFilter === 'All' ? client.monthly_plans : client.monthly_plans.filter((p: any) => p.month_year === monthlyFilter)).map((plan: any) => (
              <div key={plan.id} className="border border-slate-200 rounded-lg p-4 bg-white relative group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-indigo-100">
                      {plan.department.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 leading-none">{plan.department}</p>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">{plan.month_year}</span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteMonthlyPlan(plan.id)} className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
                {plan.document_link && (
                  <div className="mt-3">
                    <a href={plan.document_link} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center bg-indigo-50 py-1.5 rounded-md hover:bg-indigo-100 transition">
                      View Document <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
          <p className="text-sm text-slate-500">No monthly plans added yet.</p>
        </div>
      )}
    </div>
  );
}
