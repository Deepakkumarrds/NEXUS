'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Report = {
  id: string;
  report_name: string;
  report_type: string;
  report_month: string;
  file_path: string;
  created_at: string;
  client?: { company_name: string };
  uploader?: { name: string };
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    fetch((process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com') + '/api/reports')
      .then(res => res.json())
      .then(data => { 
        if (data && data.data) {
          setReports(data.data); 
        }
        setLoading(false); 
      })
      .catch(error => {
        console.error('Error fetching reports:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/reports/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchReports();
      else console.error('Failed to delete report');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Performance Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Repository of all monthly deliverables and data sent to clients.</p>
        </div>
        <Link 
          href="/reports/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Upload Report
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading reports...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Report Name</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Client</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Type</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Month</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Uploader</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {reports.map(report => (
                <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    {report.report_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {report.client?.company_name || 'General'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {report.report_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {report.report_month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {report.uploader?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {report.file_path && report.file_path !== 'dummy/path/to/file.pdf' ? (
                        <>
                          <a 
                            href={report.file_path} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition"
                            title="View Report"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                          </a>
                          <button 
                            onClick={() => copyLink(report.file_path)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition"
                            title="Copy Link"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-400 text-xs italic px-2">No Link</span>
                      )}
                      
                      {/* Delete Button */}
                      <button 
                        onClick={() => handleDelete(report.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition ml-2"
                        title="Delete Report"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No reports uploaded. Click "Upload Report" to add one.
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
