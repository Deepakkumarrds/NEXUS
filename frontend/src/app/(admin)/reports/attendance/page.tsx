'use client';

import { useState, useEffect } from 'react';

export default function AttendanceReportPage() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/leaves/report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReportData(data.report || []);
    } catch (err) {
      console.error('Failed to fetch report', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading Report...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Attendance & Leave Report</h1>
        <p className="text-sm text-slate-500 mt-1">Monthly summary of working days vs leave days for the team.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Working Days (This Month)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Leave Days (Approved)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {reportData.map((row: any) => (
                <tr key={row.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{row.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{row.department || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700 text-center">{row.workingDays}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700 text-center">{row.leaveDays}</td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">No data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
