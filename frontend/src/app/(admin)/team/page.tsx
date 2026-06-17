'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User Skill State
  const [newSkill, setNewSkill] = useState('');

  // User Leave State
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveType, setLeaveType] = useState('Casual');

  const fetchUsersAndRoles = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/users'),
        fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/users/roles')
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      
      if (usersData && usersData.data) {
        setUsers(usersData.data);
        // Refresh selected user reference if active
        if (selectedUser) {
          const updated = usersData.data.find((u: any) => u.id === selectedUser.id);
          if (updated) setSelectedUser(updated);
        }
      }
      if (rolesData && rolesData.data) {
        setRoles(rolesData.data);
        if (rolesData.data.length > 0 && !roleId) setRoleId(rolesData.data[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load team data');
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/leaves');
      const data = await res.json();
      if (data && data.data) {
        setLeaves(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
    fetchLeaves();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('Inviting team member...');

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role_id: roleId, department, designation })
      });
      const data = await res.json();
      
      if (res.ok) {
        setName(''); setEmail(''); setDepartment(''); setDesignation('');
        toast.success('Team member added successfully!', { id: loadingToast });
        fetchUsersAndRoles();
      } else {
        toast.error(data.message || 'Failed to create user', { id: loadingToast });
      }
    } catch (err) {
      toast.error('Server error.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Skill Tag
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim() || !selectedUser) return;
    const updatedSkills = [...(selectedUser.skills || []), newSkill.trim()];
    
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + `/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: updatedSkills })
      });
      if (res.ok) {
        toast.success('Skill added!');
        setNewSkill('');
        fetchUsersAndRoles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Skill Tag
  const handleDeleteSkill = async (skillToDelete: string) => {
    if (!selectedUser) return;
    const updatedSkills = selectedUser.skills.filter((s: string) => s !== skillToDelete);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + `/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: updatedSkills })
      });
      if (res.ok) {
        toast.success('Skill removed');
        fetchUsersAndRoles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Log Leave Request
  const handleLogLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !selectedUser) return;
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          start_date: leaveStart,
          end_date: leaveEnd,
          leave_type: leaveType
        })
      });
      if (res.ok) {
        toast.success('Leave requested!');
        setLeaveStart(''); setLeaveEnd('');
        fetchLeaves();
        fetchUsersAndRoles();
      } else {
        toast.error('Failed to log leave request');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Leave Status
  const handleUpdateLeaveStatus = async (leaveId: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + `/api/leaves/${leaveId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Leave request ${status.toLowerCase()}`);
        fetchLeaves();
        fetchUsersAndRoles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading team dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Team Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage internal users, skills, and leaves/shifts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: List of users */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Team Member</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Role</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Department</th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-700">Skills</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                  <tr 
                    key={user.id} 
                    onClick={() => setSelectedUser(user)}
                    className={`hover:bg-indigo-50/20 transition-colors cursor-pointer ${selectedUser?.id === user.id ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded border border-indigo-100 text-xs font-bold">
                        {user.role?.role_name || 'No Role'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-slate-700 font-medium">{user.department || '-'}</p>
                      <p className="text-xs text-slate-500">{user.designation}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.skills && user.skills.length > 0 ? (
                          user.skills.map((skill: string) => (
                            <span key={skill} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-semibold border border-slate-200">{skill}</span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/team/${user.id}?edit=true`}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition"
                          title="Edit User"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </Link>
                        <button 
                          onClick={(e) => deleteUser(user.id, e)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition"
                          title="Remove Member"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Leave Log Board */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Active Leave Calendar</h2>
            {leaves.length > 0 ? (
              <div className="space-y-2 text-xs">
                {leaves.map((leave: any) => (
                  <div key={leave.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between hover:bg-slate-50 transition">
                    <div>
                      <p className="font-bold text-slate-800">{leave.user?.name || 'Employee'} ({leave.leave_type})</p>
                      <p className="text-slate-500 mt-0.5">{new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded border font-semibold ${leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : leave.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{leave.status}</span>
                      {leave.status === 'Pending' && (
                        <div className="flex space-x-1">
                          <button onClick={() => handleUpdateLeaveStatus(leave.id, 'Approved')} className="bg-emerald-600 text-white px-2 py-0.5 rounded font-bold hover:bg-emerald-700 transition">Approve</button>
                          <button onClick={() => handleUpdateLeaveStatus(leave.id, 'Rejected')} className="bg-rose-600 text-white px-2 py-0.5 rounded font-bold hover:bg-rose-700 transition">Reject</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No leaves requested yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Invite Form OR Member Operations */}
        <div className="lg:col-span-1 space-y-6">
          {selectedUser ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">{selectedUser.name}</h2>
                  <p className="text-xs text-slate-500">{selectedUser.designation} • {selectedUser.department}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-xs text-indigo-600 hover:underline">Invite New</button>
              </div>

              {/* Skills Editor */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Skills Configuration</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUser.skills && selectedUser.skills.length > 0 ? (
                    selectedUser.skills.map((skill: string) => (
                      <span key={skill} className="px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs rounded-full font-bold flex items-center">
                        {skill}
                        <button type="button" onClick={() => handleDeleteSkill(skill)} className="ml-1.5 text-indigo-400 hover:text-indigo-700 font-bold">&times;</button>
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs italic">No skills registered.</span>
                  )}
                </div>
                <form onSubmit={handleAddSkill} className="flex space-x-2 mt-2">
                  <input 
                    type="text" 
                    placeholder="Add skill tag (e.g. Photoshop)" 
                    value={newSkill} 
                    onChange={e => setNewSkill(e.target.value)} 
                    className="flex-1 text-xs border border-slate-300 rounded p-1.5 outline-none"
                  />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 rounded transition-colors">Add</button>
                </form>
              </div>

              {/* Log Leaves for selected user */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Log Leave / Shift</h3>
                <form onSubmit={handleLogLeave} className="space-y-3 text-xs font-semibold text-slate-600">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1">Start Date</label>
                      <input required type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none bg-white" />
                    </div>
                    <div>
                      <label className="block mb-1">End Date</label>
                      <input required type="date" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1">Leave Type</label>
                    <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none bg-white">
                      <option value="Casual">Casual Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Earned">Earned Leave</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-950 text-white font-bold py-2 rounded transition-colors">Request Leave Record</button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Invite Team Member</h2>
              <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-semibold text-slate-600">
                <div>
                  <label className="block mb-1">Full Name</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
                
                <div>
                  <label className="block mb-1">Email Address</label>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label className="block mb-1">Role</label>
                  <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-indigo-500 outline-none bg-white">
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.role_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1">Department</label>
                  <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="e.g. Design" />
                </div>

                <div>
                  <label className="block mb-1">Designation</label>
                  <input type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="e.g. Illustrator" />
                </div>

                <button disabled={isSubmitting} type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Creating...' : 'Invite Team Member'}
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-2">Default password is 'password123'</p>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
