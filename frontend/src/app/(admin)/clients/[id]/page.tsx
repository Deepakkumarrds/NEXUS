'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

import TabAICalendar from './components/TabAICalendar';
import OverviewTab from './tabs/OverviewTab';
import MarketingTab from './tabs/MarketingTab';
import DeliveryTab from './tabs/DeliveryTab';

export default function ClientDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.id as string;
  const isEditMode = searchParams.get('edit') === 'true';
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'marketing' | 'delivery' | 'ai_calendar'>('overview');

  // Export Report State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('pdf');
  const [exportIncludes, setExportIncludes] = useState({ profile: true, tasks: true, comms: true });

  const fetchClientDetails = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setClient(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClientDetails();
  }, [clientId]);

  // Edit Profile Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editBrandName, setEditBrandName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Hold' | 'Lost'>('Active');
  const [editHealthStatus, setEditHealthStatus] = useState<'Green' | 'Yellow' | 'Red'>('Green');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editRetainer, setEditRetainer] = useState('');
  const [editServices, setEditServices] = useState<string[]>([]);
  const [editPrimaryContact, setEditPrimaryContact] = useState('');
  const [editSpocName, setEditSpocName] = useState('');
  const [editBrandShortcode, setEditBrandShortcode] = useState('');
  const [editObjective, setEditObjective] = useState('');
  const [editFocusedArea, setEditFocusedArea] = useState('');
  const [editCustomerMindset, setEditCustomerMindset] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [editOnboardingDate, setEditOnboardingDate] = useState('');
  const SERVICES = ['SEO', 'SMM (Social Media)', 'Web Development', 'PPC Advertising', 'Content Marketing', 'Branding & Design', 'Email Marketing', 'WhatsApp Marketing', 'Paid Media'];

  const openEditModal = () => {
    if (client) {
      setEditCompanyName(client.company_name || '');
      setEditBrandName(client.brand_name || '');
      setEditIndustry(client.industry || '');
      setEditStatus(client.client_status || 'Active');
      setEditHealthStatus(client.health_status || 'Green');
      setEditEmail(client.email || '');
      setEditPhone(client.phone || '');
      setEditWebsite(client.website || '');
      setEditRetainer(client.retainer_value ? client.retainer_value.toString() : '');
      setEditPrimaryContact(client.primary_contact_name || '');
      setEditSpocName(client.spoc_name || '');
      setEditBrandShortcode(client.brand_shortcode || '');
      setEditObjective(client.objective || '');
      setEditFocusedArea(client.focused_area || '');
      setEditCustomerMindset(client.customer_mindset || '');
      setEditLogo(client.logo || '');
      setEditOnboardingDate(client.onboarding_date ? new Date(client.onboarding_date).toISOString().split('T')[0] : '');
      if (client.service_type) setEditServices(client.service_type.split(',').map((s: string) => s.trim()));
      else setEditServices([]);
      setShowEditModal(true);
    }
  };

  useEffect(() => {
    if (client && isEditMode) openEditModal();
  }, [client, isEditMode]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: editCompanyName,
          brand_name: editBrandName || null,
          industry: editIndustry || null,
          client_status: editStatus,
          health_status: editHealthStatus,
          email: editEmail || null,
          phone: editPhone || null,
          website: editWebsite || null,
          retainer_value: editRetainer ? parseFloat(editRetainer) : null,
          service_type: editServices.join(', '),
          primary_contact_name: editPrimaryContact || null,
          spoc_name: editSpocName || null,
          brand_shortcode: editBrandShortcode || null,
          objective: editObjective || null,
          focused_area: editFocusedArea || null,
          customer_mindset: editCustomerMindset || null,
          logo: editLogo || null,
          onboarding_date: editOnboardingDate || null
        })
      });
      if (res.ok) {
        toast.success('Profile updated!');
        setShowEditModal(false);
        fetchClientDetails();
      } else {
        toast.error('Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating profile');
    }
  };

  const handleExportReport = async () => {
    if (!exportStartDate || !exportEndDate) {
      toast.error('Please select both start and end dates.');
      return;
    }
    if (!exportIncludes.profile && !exportIncludes.tasks && !exportIncludes.comms) {
      toast.error('Please select at least one type of content to export.');
      return;
    }
    if (exportFormat === 'pdf') {
      const query = new URLSearchParams({ start: exportStartDate, end: exportEndDate, profile: exportIncludes.profile.toString(), tasks: exportIncludes.tasks.toString(), comms: exportIncludes.comms.toString() }).toString();
      window.open(`/clients/${clientId}/report?${query}`, '_blank');
      setShowExportModal(false);
      return;
    }
    try {
      toast.loading('Generating report...', { id: 'export' });
      const [tasksRes, commsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/tasks?client_id=${clientId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/communications`)
      ]);
      const tasksData = await tasksRes.json();
      const commsData = await commsRes.json();
      const allTasks = tasksData.data || [];
      const allComms = commsData.data ? commsData.data.filter((c: any) => c.client_id === clientId) : [];
      const start = new Date(exportStartDate); start.setHours(0, 0, 0, 0);
      const end = new Date(exportEndDate); end.setHours(23, 59, 59, 999);
      const filteredTasks = allTasks.filter((t: any) => { const d = new Date(t.created_at); return d >= start && d <= end; });
      const filteredComms = allComms.filter((c: any) => { const d = new Date(c.created_at); return d >= start && d <= end; });
      if (filteredTasks.length === 0 && filteredComms.length === 0) { toast.error('No work found in this date range.', { id: 'export' }); return; }
      
      const tasksSheetData = filteredTasks.map((t: any) => ({
        'Task ID': t.id, 'Title': t.title, 'Description': t.description?.replace(/<[^>]+>/g, ''), 'Status': t.status, 'Priority': t.priority, 'Created At': new Date(t.created_at).toLocaleDateString(), 'Due Date': t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A', 'Assignee': t.assignee ? t.assignee.name : 'Unassigned',
      }));
      const commsSheetData = filteredComms.map((c: any) => ({
        'Log ID': c.id, 'Type': c.communication_type, 'Date': new Date(c.created_at).toLocaleDateString(), 'Subject': c.subject, 'Summary': c.summary?.replace(/<[^>]+>/g, ''), 'Next Action': c.next_action || 'N/A', 'Creator': c.creator ? c.creator.name : 'Unknown'
      }));
      
      const wb = XLSX.utils.book_new();
      if (exportIncludes.tasks && tasksSheetData.length > 0) { XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tasksSheetData), 'Tasks'); }
      if (exportIncludes.comms && commsSheetData.length > 0) { XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(commsSheetData), 'Communications'); }
      
      const fileName = `${client.company_name.replace(/\s+/g, '_')}_Report_${exportStartDate}_to_${exportEndDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Report downloaded successfully!', { id: 'export' });
      setShowExportModal(false);
    } catch (e) {
      console.error(e);
      toast.error('Error generating report.', { id: 'export' });
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading client profile...</div>;
  if (!client) return <div className="p-8 text-center text-rose-500">Client not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center text-sm font-medium text-slate-500 mb-3 space-x-2">
            <Link href="/" className="hover:text-indigo-600 transition-colors flex items-center">Dashboard</Link>
            <span className="text-slate-300">/</span>
            <Link href="/clients" className="hover:text-indigo-600 transition-colors">Clients</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[200px]">{client.company_name}</span>
          </nav>

          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            {client.logo && <img src={client.logo} alt={client.company_name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm shrink-0" />}
            {client.company_name}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${client.client_status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : client.client_status === 'Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              {client.client_status}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">{client.service_type || 'No services selected'} • Since {new Date(client.created_at).getFullYear()}</p>
          <div className="flex space-x-3 mt-3">
            {client.primary_contact_name && (
              <div className="flex items-center text-sm text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm">
                <span className="font-medium mr-1.5">Client:</span> {client.primary_contact_name}
              </div>
            )}
            {client.spoc_name && (
              <div className="flex items-center text-sm text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm">
                <span className="font-medium mr-1.5">SPOC:</span> {client.spoc_name}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">Health Score</span>
            <div className={`flex items-center px-4 py-2 rounded-lg border ${client.health_status === 'Red' ? 'bg-rose-50 border-rose-200 text-rose-700' : client.health_status === 'Yellow' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              <span className="text-sm font-bold uppercase">{client.health_status || 'Green'}</span>
            </div>
          </div>

          <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md shadow text-sm font-semibold hover:bg-slate-800 transition">
            Export Report
          </button>
        </div>
      </div>

      <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 flex space-x-1.5 mb-6 max-w-3xl">
        <button onClick={() => setActiveTab('overview')} className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}>Overview & Onboarding</button>
        <button onClick={() => setActiveTab('marketing')} className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${activeTab === 'marketing' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}>Marketing Vault</button>
        <button onClick={() => setActiveTab('delivery')} className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${activeTab === 'delivery' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}>Delivery & SOWs</button>
        <button onClick={() => setActiveTab('ai_calendar')} className={`flex-1 py-2 px-3 flex items-center justify-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${activeTab === 'ai_calendar' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md border border-indigo-400' : 'text-indigo-500 hover:bg-indigo-50'}`}>AI Calendar</button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === 'overview' && <OverviewTab client={client} clientId={clientId} fetchClientDetails={fetchClientDetails} openEditModal={openEditModal} />}
        {activeTab === 'marketing' && <MarketingTab client={client} clientId={clientId} fetchClientDetails={fetchClientDetails} />}
        {activeTab === 'delivery' && <DeliveryTab client={client} clientId={clientId} fetchClientDetails={fetchClientDetails} />}
        {activeTab === 'ai_calendar' && <TabAICalendar client={client} />}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Edit Client Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">Close</button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-5 space-y-4 text-xs font-semibold text-slate-600 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block mb-1">Company Name <span className="text-rose-500">*</span></label>
                <input required type="text" value={editCompanyName} onChange={e => setEditCompanyName(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Short Code</label>
                  <input type="text" value={editBrandShortcode} onChange={e => setEditBrandShortcode(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800 uppercase" placeholder="e.g. RIL" />
                </div>
                <div>
                  <label className="block mb-1">Industry</label>
                  <input type="text" value={editIndustry} onChange={e => setEditIndustry(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Primary Client Name</label>
                  <input type="text" value={editPrimaryContact} onChange={e => setEditPrimaryContact(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" />
                </div>
                <div>
                  <label className="block mb-1">Internal SPOC</label>
                  <input type="text" value={editSpocName} onChange={e => setEditSpocName(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Client Status <span className="text-rose-500">*</span></label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value as any)} className="w-full border border-slate-300 rounded p-2 bg-white outline-none font-normal text-slate-800">
                    <option value="Active">Active</option>
                    <option value="Hold">Hold</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Health Status</label>
                  <select value={editHealthStatus} onChange={e => setEditHealthStatus(e.target.value as any)} className="w-full border border-slate-300 rounded p-2 bg-white outline-none font-normal text-slate-800">
                    <option value="Green">Green</option>
                    <option value="Yellow">Yellow</option>
                    <option value="Red">Red</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Monthly Retainer (INR ₹)</label>
                  <input type="number" value={editRetainer} onChange={e => setEditRetainer(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Project Start Date</label>
                  <input type="date" value={editOnboardingDate} onChange={e => setEditOnboardingDate(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" />
                </div>
                <div>
                  <label className="block mb-1">Email</label>
                  <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Phone Number</label>
                  <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" />
                </div>
                <div>
                  <label className="block mb-1">Website URL</label>
                  <input type="url" value={editWebsite} onChange={e => setEditWebsite(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" />
                </div>
              </div>
              <div>
                <label className="block mb-1">Brand Logo</label>
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData(); formData.append('file', file);
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/upload`, { method: 'POST', body: formData });
                      const data = await res.json();
                      if (data.url) { setEditLogo(data.url); toast.success('Logo uploaded'); }
                    } catch (err) { toast.error('Failed to upload logo'); }
                  }
                }} className="w-full border border-slate-300 rounded p-1.5 outline-none font-normal text-slate-800" />
                {editLogo && <img src={editLogo} alt="Logo" className="h-10 mt-2 object-contain bg-slate-50 p-1 rounded border border-slate-200" />}
              </div>
              <div>
                <label className="block mb-1">Core Objective</label>
                <textarea value={editObjective} onChange={e => setEditObjective(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" rows={2}></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Focused Area</label>
                  <input type="text" value={editFocusedArea} onChange={e => setEditFocusedArea(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" />
                </div>
                <div>
                  <label className="block mb-1">Customer Mindset</label>
                  <input type="text" value={editCustomerMindset} onChange={e => setEditCustomerMindset(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-slate-700">Services Selected</label>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {SERVICES.map(service => (
                    <label key={service} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer font-medium">
                      <input type="checkbox" checked={editServices.includes(service)} onChange={(e) => {
                        if (e.target.checked) setEditServices([...editServices, service]);
                        else setEditServices(editServices.filter(s => s !== service));
                      }} className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4 h-4 cursor-pointer" />
                      <span>{service}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Export Work Report</h2>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">Close</button>
            </div>
            <div className="p-6 space-y-5 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Report Contents</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-slate-700 cursor-pointer font-medium">
                    <input type="checkbox" checked={exportIncludes.profile} onChange={(e) => setExportIncludes({ ...exportIncludes, profile: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4 h-4 cursor-pointer" />
                    <span>Profile & SOW (Client Details)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-700 cursor-pointer font-medium">
                    <input type="checkbox" checked={exportIncludes.tasks} onChange={(e) => setExportIncludes({ ...exportIncludes, tasks: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4 h-4 cursor-pointer" />
                    <span>Tasks Log</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-700 cursor-pointer font-medium">
                    <input type="checkbox" checked={exportIncludes.comms} onChange={(e) => setExportIncludes({ ...exportIncludes, comms: e.target.checked })} className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4 h-4 cursor-pointer" />
                    <span>Minutes of Meeting (Communications)</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Start Date</label>
                  <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">End Date</label>
                  <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Export Format</label>
                <div className="flex space-x-4">
                  <label className={`flex-1 border rounded-lg p-3 cursor-pointer transition-all ${exportFormat === 'pdf' ? 'border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'}`}>
                    <input type="radio" name="format" value="pdf" checked={exportFormat === 'pdf'} onChange={() => setExportFormat('pdf')} className="mr-2" /> PDF Report
                  </label>
                  <label className={`flex-1 border rounded-lg p-3 cursor-pointer transition-all ${exportFormat === 'excel' ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500' : 'border-slate-200 hover:border-emerald-300'}`}>
                    <input type="radio" name="format" value="excel" checked={exportFormat === 'excel'} onChange={() => setExportFormat('excel')} className="mr-2" /> Excel Data
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowExportModal(false)} className="px-4 py-2 font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleExportReport} className={`px-4 py-2 font-semibold text-white rounded-lg shadow-sm transition-colors flex items-center gap-2 ${exportFormat === 'pdf' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
