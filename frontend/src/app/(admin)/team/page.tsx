'use client';

import { useEffect, useState } from 'react';

export default function TeamPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchUsersAndRoles = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/users'),
        fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/users/roles')
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      
      if (usersData && usersData.data) setUsers(usersData.data);
      if (rolesData && rolesData.data) {
        setRoles(rolesData.data);
        if (rolesData.data.length > 0) setRoleId(rolesData.data[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role_id: roleId, department, designation })
      });
      const data = await res.json();
      
      if (res.ok) {
        setName(''); setEmail(''); setDepartment(''); setDesignation('');
        fetchUsersAndRoles();
      } else {
        setError(data.message || 'Failed to create user');
      }
    } catch (err) {
      setError('Server error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-slate-500">Loading team members...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Team Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage internal users, roles, and access.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Create User Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">Invite Team Member</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              {error && <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded">{error}</div>}
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-1 focus:ring-indigo-500 outline-none bg-white">
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.role_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="e.g. Engineering" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Designation</label>
                <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="e.g. Senior Dev" />
              </div>

              <button disabled={isSubmitting} type="submit" className="w-full bg-indigo-600 text-white font-medium text-sm py-2 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {isSubmitting ? 'Creating...' : 'Create User'}
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-2">Default password is 'password123'</p>
            </form>
          </div>
        </div>

        {/* Right Column: User List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Team Member</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Role</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Department</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 text-xs font-medium">
                        {user.role?.role_name || 'No Role'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-slate-700">{user.department || '-'}</p>
                      <p className="text-xs text-slate-500">{user.designation}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
