'use client';

import { useEffect, useState } from 'react';

type Report = {
  id: string;
  report_name: string;
  report_type: string;
  report_month: string;
  file_path: string;
  created_at: string;
  client_id: string;
};

export default function ClientReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      const user = JSON.parse(userDataStr);
      fetchReports(user.client_id);
    }
  }, []);

  const fetchReports = async (clientId: string) => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://rds-db.onrender.com') + '/api/reports');
      const data = await res.json();
      if (data && data.data) {
        // Filter by client_id to ensure they only see their own reports
        const clientReports = data.data.filter((r: any) => r.client_id === clientId);
        setReports(clientReports);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Performance Reports</h1>
        <p className="text-slate-500 mt-2">Access all your monthly deliverables, strategy decks, and analytics tracking.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading your reports...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Report Name</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Period</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {reports.map(report => (
                <tr key={report.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mr-4 group-hover:scale-105 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{report.report_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Uploaded {new Date(report.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {report.report_type}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap font-medium text-slate-700">
                    {report.report_month}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {report.file_path && report.file_path !== 'dummy/path/to/file.pdf' ? (
                      <a 
                        href={report.file_path} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:shadow-md"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        View Report
                      </a>
                    ) : (
                      <span className="text-slate-400 text-sm italic bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100">Processing...</span>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <h3 className="text-lg font-medium text-slate-900">No reports available yet</h3>
                      <p className="mt-1 text-sm text-slate-500 max-w-sm">Your agency has not uploaded any reports for your account yet. Check back later!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
