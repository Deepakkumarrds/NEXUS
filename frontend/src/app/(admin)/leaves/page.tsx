'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeavesPage() {
  const [activeTab, setActiveTab] = useState('my-leaves');
  const [leavesData, setLeavesData] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    leave_type: 'Casual',
    reason: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || '');
    fetchLeaves();
  }, [activeTab]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      if (activeTab === 'my-leaves') {
        const res = await fetch(`${apiUrl}/api/leaves/my-leaves`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setLeavesData(data);
      } else if (activeTab === 'approvals') {
        const res = await fetch(`${apiUrl}/api/leaves/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setPendingApprovals(data.pending || []);
      }
    } catch (err) {
      console.error('Failed to fetch leaves', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/leaves/apply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchLeaves(); // Refresh
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to apply for leave');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    }
  };

  const handleApprovalAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/leaves/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchLeaves();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'Approved') return 'text-emerald-700 bg-emerald-100';
    if (status === 'Rejected') return 'text-rose-700 bg-rose-100';
    return 'text-amber-700 bg-amber-100';
  };

  if (loading && !leavesData) {
    return <div className="p-12 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Leave Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track your leave balances.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Apply for Leave
        </button>
      </div>

      <div className="mb-6 border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('my-leaves')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-leaves' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            My Leaves
          </button>
          {(userRole === 'Admin' || userRole === 'Manager' || userRole === 'Super Admin') && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approvals' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              Pending Approvals
            </button>
          )}
        </nav>
      </div>

      {activeTab === 'my-leaves' && leavesData && leavesData.balance && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-1">Sick Leaves</h3>
              <p className="text-2xl font-bold text-slate-900">
                {leavesData.balance.sick_leaves_total - leavesData.balance.sick_leaves_used} <span className="text-sm text-slate-400 font-normal">/ {leavesData.balance.sick_leaves_total} left</span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-1">Casual Leaves</h3>
              <p className="text-2xl font-bold text-slate-900">
                {leavesData.balance.casual_leaves_total - leavesData.balance.casual_leaves_used} <span className="text-sm text-slate-400 font-normal">/ {leavesData.balance.casual_leaves_total} left</span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-1">Earned Leaves</h3>
              <p className="text-2xl font-bold text-slate-900">
                {leavesData.balance.earned_leaves_total - leavesData.balance.earned_leaves_used} <span className="text-sm text-slate-400 font-normal">/ {leavesData.balance.earned_leaves_total} left</span>
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Leave History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {leavesData.history?.map((leave: any) => (
                    <tr key={leave.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{leave.leave_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{leave.reason || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor(leave.status)}`}>
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leavesData.history?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">No leave requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-900">Pending Approvals</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {pendingApprovals.map((leave: any) => (
                  <tr key={leave.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{leave.user.name}</div>
                      <div className="text-xs text-slate-500">{leave.user.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{leave.leave_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{leave.reason || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleApprovalAction(leave.id, 'approve')} className="text-emerald-600 hover:text-emerald-900 mr-4 font-semibold">Approve</button>
                      <button onClick={() => handleApprovalAction(leave.id, 'reject')} className="text-rose-600 hover:text-rose-900 font-semibold">Reject</button>
                    </td>
                  </tr>
                ))}
                {pendingApprovals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">No pending requests.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleApplyLeave}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-semibold text-slate-900 mb-4" id="modal-title">Apply for Leave</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                        <input required type="date" className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                        <input required type="date" className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                      <select className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={formData.leave_type} onChange={(e) => setFormData({...formData, leave_type: e.target.value})}>
                        <option value="Casual">Casual</option>
                        <option value="Sick">Sick</option>
                        <option value="Earned">Earned</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                      <textarea required rows={3} className="w-full border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}></textarea>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm">
                    Submit Request
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
