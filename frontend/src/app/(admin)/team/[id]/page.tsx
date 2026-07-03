'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    designation: '',
    role_id: '',
    status: 'Active'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com';
        
        // Fetch users to find the specific user, and fetch roles
        const [usersRes, rolesRes] = await Promise.all([
          fetch(`${apiUrl}/api/users`),
          fetch(`${apiUrl}/api/users/roles`)
        ]);

        const usersData = await usersRes.json();
        const rolesData = await rolesRes.json();

        if (rolesData?.data) {
          setRoles(rolesData.data);
        }

        if (usersData?.data) {
          const user = usersData.data.find((u: any) => u.id === id);
          if (user) {
            setFormData({
              name: user.name || '',
              email: user.email || '',
              department: user.department || '',
              designation: user.designation || '',
              role_id: user.role_id || '',
              status: user.status || 'Active'
            });
          } else {
            toast.error('User not found');
            router.push('/team');
          }
        }
      } catch (err) {
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading('Saving changes...');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-kofj.onrender.com';
      const res = await fetch(`${apiUrl}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success('Team member updated successfully', { id: loadingToast });
        router.push('/team');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to update user', { id: loadingToast });
      }
    } catch (err) {
      toast.error('Server error', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading user details...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/team" className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Edit Team Member</h1>
          <p className="text-sm text-slate-500 mt-1">Update profile, role, and department information.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role</label>
              <select name="role_id" value={formData.role_id} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="">Select a role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.role_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input type="text" name="department" value={formData.department} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Engineering" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Designation</label>
              <input type="text" name="designation" value={formData.designation} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Senior Developer" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link href="/team" className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded hover:bg-slate-50 transition-colors">
              Cancel
            </Link>
            <button disabled={isSubmitting} type="submit" className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
