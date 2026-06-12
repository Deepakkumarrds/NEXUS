export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Executive Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of client health, pending tasks, and recent activity.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Active Clients</p>
          <p className="text-3xl font-bold text-slate-900">24</p>
          <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
            +2 this month
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Tasks Pending</p>
          <p className="text-3xl font-bold text-slate-900">18</p>
          <p className="text-xs text-amber-600 mt-2 font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            5 overdue
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Open Escalations</p>
          <p className="text-3xl font-bold text-slate-900">2</p>
          <p className="text-xs text-rose-600 mt-2 font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            1 critical
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1">Total SOW Value</p>
          <p className="text-3xl font-bold text-slate-900">₹4.2M</p>
          <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
            +15% YoY
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4 pb-4 border-b border-slate-100">Recent Tasks</h2>
          <ul className="space-y-4">
            <li className="flex justify-between items-center text-sm">
              <span className="text-slate-700 font-medium">Review Q3 Reports</span>
              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium border border-slate-200">Pending</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-slate-700 font-medium">Draft Alpha Corp SOW</span>
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100">In Progress</span>
            </li>
            <li className="flex justify-between items-center text-sm">
              <span className="text-slate-700 font-medium">Client Onboarding - Beta LLC</span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-medium border border-emerald-100">Completed</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4 pb-4 border-b border-slate-100">Recent Communications</h2>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start">
              <span className="w-8 text-slate-400">
                <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </span>
              <div>
                <p className="font-medium text-slate-800">Email to Acme Corp</p>
                <p className="text-slate-500 text-xs mt-0.5">Discussed renewal terms - Today, 10:00 AM</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="w-8 text-slate-400">
                <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              </span>
              <div>
                <p className="font-medium text-slate-800">Call with Zeta Industries</p>
                <p className="text-slate-500 text-xs mt-0.5">Monthly sync up - Yesterday, 4:30 PM</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
