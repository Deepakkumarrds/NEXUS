'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Report = {
  id: string;
  report_name: string;
  report_type: string;
  report_month: string;
  created_at: string;
  client?: { company_name: string };
  uploader?: { name: string };
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/reports')
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
  }, []);

  const getReportIcon = (type: string) => {
    switch(type) {
      case 'SEO': return '🔍';
      case 'Ads': return '📈';
      case 'Social': return '📱';
      default: return '📊';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Performance Reports
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Repository of all monthly deliverables and data sent to clients.</p>
        </div>
        <Link 
          href="/reports/new" 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition transform hover:-translate-y-1"
        >
          + Upload Report
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-48"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reports.map(report => (
            <div 
              key={report.id} 
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getReportIcon(report.report_type)}</div>
                    <div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">
                        {report.report_type}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {report.report_month}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight">{report.report_name}</h3>
                <p className="text-sm text-gray-500 font-medium">{report.client?.company_name || 'General'}</p>
              </div>

              <div className="mt-6 pt-4 border-t flex justify-between items-center text-xs text-gray-400 font-medium">
                <span>By {report.uploader?.name || 'Unknown'}</span>
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && reports.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <div className="text-6xl mb-4">📉</div>
          <h2 className="text-2xl font-bold text-gray-800">No Reports Uploaded</h2>
          <p className="text-gray-500 mt-2">Log and share performance data with clients.</p>
        </div>
      )}
    </div>
  );
}
