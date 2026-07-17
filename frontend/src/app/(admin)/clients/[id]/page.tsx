'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import TabAICalendar from './components/TabAICalendar';

export default function ClientDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.id as string;
  const isEditMode = searchParams.get('edit') === 'true';
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'onboarding' | 'socials' | 'campaigns' | 'timeline' | 'monthly_plans' | 'ai_calendar'>('overview');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'task' | 'communication' | 'sow' | 'meeting' | 'escalation'>('all');

  const [internalNotes, setInternalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Export Report State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('pdf');
  const [exportIncludes, setExportIncludes] = useState({
    profile: true,
    tasks: true,
    comms: true
  });

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
      const query = new URLSearchParams({
        start: exportStartDate,
        end: exportEndDate,
        profile: exportIncludes.profile.toString(),
        tasks: exportIncludes.tasks.toString(),
        comms: exportIncludes.comms.toString()
      }).toString();

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

      const start = new Date(exportStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(exportEndDate);
      end.setHours(23, 59, 59, 999);

      const filteredTasks = allTasks.filter((t: any) => {
        const d = new Date(t.created_at);
        return d >= start && d <= end;
      });

      const filteredComms = allComms.filter((c: any) => {
        const d = new Date(c.created_at);
        return d >= start && d <= end;
      });

      if (filteredTasks.length === 0 && filteredComms.length === 0) {
        toast.error('No work found in this date range.', { id: 'export' });
        return;
      }

      const tasksSheetData = filteredTasks.map((t: any) => ({
        'Task ID': t.id,
        'Title': t.title,
        'Description': t.description?.replace(/<[^>]+>/g, ''),
        'Status': t.status,
        'Priority': t.priority,
        'Created At': new Date(t.created_at).toLocaleDateString(),
        'Due Date': t.due_date ? new Date(t.due_date).toLocaleDateString() : 'N/A',
        'Assignee': t.assignee ? t.assignee.name : 'Unassigned',
      }));

      const commsSheetData = filteredComms.map((c: any) => ({
        'Log ID': c.id,
        'Type': c.communication_type,
        'Date': new Date(c.created_at).toLocaleDateString(),
        'Subject': c.subject,
        'Summary': c.summary?.replace(/<[^>]+>/g, ''),
        'Next Action': c.next_action || 'N/A',
        'Creator': c.creator ? c.creator.name : 'Unknown'
      }));

      const wb = XLSX.utils.book_new();

      if (exportIncludes.tasks && tasksSheetData.length > 0) {
        const wsTasks = XLSX.utils.json_to_sheet(tasksSheetData);
        XLSX.utils.book_append_sheet(wb, wsTasks, 'Tasks');
      }

      if (exportIncludes.comms && commsSheetData.length > 0) {
        const wsComms = XLSX.utils.json_to_sheet(commsSheetData);
        XLSX.utils.book_append_sheet(wb, wsComms, 'Communications');
      }

      const fileName = `${client.company_name.replace(/\s+/g, '_')}_Report_${exportStartDate}_to_${exportEndDate}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Report downloaded successfully!', { id: 'export' });
      setShowExportModal(false);
    } catch (e) {
      console.error(e);
      toast.error('Error generating report.', { id: 'export' });
    }
  };

  useEffect(() => {
    if (client) setInternalNotes(client.internal_notes || '');
  }, [client]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internal_notes: internalNotes })
      });
      if (res.ok) toast.success('Notes saved');
      else toast.error('Failed to save notes');
    } catch (e) {
      toast.error('Error saving notes');
    }
    setSavingNotes(false);
  };
  // Edit Profile Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editBrandName, setEditBrandName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Hold' | 'Lost'>('Active');
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

  // Monthly Plans State
  const [monthlyDepartment, setMonthlyDepartment] = useState('Social Media');
  const [monthlyMonthYear, setMonthlyMonthYear] = useState('');
  const [monthlyDocumentLink, setMonthlyDocumentLink] = useState('');
  const [monthlyFilter, setMonthlyFilter] = useState('All');

  const SERVICES = [
    'SEO',
    'SMM (Social Media)',
    'Web Development',
    'PPC Advertising',
    'Content Marketing',
    'Branding & Design',
    'Email Marketing',
    'WhatsApp Marketing',
    'Paid Media'
  ];

  const openEditModal = () => {
    if (client) {
      setEditCompanyName(client.company_name || '');
      setEditBrandName(client.brand_name || '');
      setEditIndustry(client.industry || '');
      setEditStatus(client.client_status || 'Active');
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

      // Parse service_type from string to array
      if (client.service_type) {
        setEditServices(client.service_type.split(',').map((s: string) => s.trim()));
      } else {
        setEditServices([]);
      }

      setShowEditModal(true);
    }
  };

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

  // New Contact Form State
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactDesig, setContactDesig] = useState('');
  const [contactDept, setContactDept] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactBirth, setContactBirth] = useState('');
  const [contactAnniv, setContactAnniv] = useState('');
  const [contactFestivals, setContactFestivals] = useState<string[]>([]);

  // Onboarding Checklist Form State
  const [newStepName, setNewStepName] = useState('');

  // Social Handles Form State
  const [socialPlatform, setSocialPlatform] = useState('Instagram');
  const [socialUrl, setSocialUrl] = useState('');
  const [socialUsername, setSocialUsername] = useState('');
  const [socialPassword, setSocialPassword] = useState('');
  const [socialAccess, setSocialAccess] = useState('Analyst');

  // SEO Access Form State
  const [seoPlatform, setSeoPlatform] = useState('Google Analytics');
  const [seoUrl, setSeoUrl] = useState('');
  const [seoUsername, setSeoUsername] = useState('');
  const [seoPassword, setSeoPassword] = useState('');
  const [seoAccess, setSeoAccess] = useState('Admin');

  // Paid Media Access Form State
  const [paidPlatform, setPaidPlatform] = useState('Google Ads');
  const [paidAccountId, setPaidAccountId] = useState('');
  const [paidUrl, setPaidUrl] = useState('');
  const [paidUsername, setPaidUsername] = useState('');
  const [paidPassword, setPaidPassword] = useState('');
  const [paidAccess, setPaidAccess] = useState('Advertiser');

  // Password Visibility Toggle
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Campaign Performance Form State
  const [campaignName, setCampaignName] = useState('');
  const [campImpressions, setCampImpressions] = useState('');
  const [campClicks, setCampClicks] = useState('');
  const [campConversions, setCampConversions] = useState('');
  const [campSpend, setCampSpend] = useState('');
  const [campStartDate, setCampStartDate] = useState('');

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

  useEffect(() => {
    if (client && isEditMode) {
      openEditModal();
    }
  }, [client, isEditMode]);

  // Handle Add Contact
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          designation: contactDesig,
          department: contactDept,
          email: contactEmail,
          phone: contactPhone,
          birth_date: contactBirth || null,
          anniversary_date: contactAnniv || null,
          festival_greetings: contactFestivals
        })
      });
      if (res.ok) {
        toast.success('Contact added!');
        setShowContactModal(false);
        setContactName(''); setContactDesig(''); setContactDept(''); setContactEmail(''); setContactPhone(''); setContactBirth(''); setContactAnniv(''); setContactFestivals([]);
        fetchClientDetails();
      } else {
        toast.error('Failed to add contact');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding contact');
    }
  };

  // Handle Onboarding Item toggle
  const toggleOnboardingItem = async (itemId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/onboarding/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: !currentStatus })
      });
      if (res.ok) {
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Onboarding Item
  const handleAddOnboardingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepName.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_name: newStepName })
      });
      if (res.ok) {
        setNewStepName('');
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Onboarding Item
  const handleDeleteOnboardingItem = async (itemId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/onboarding/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Social Handle
  const handleAddSocialHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialUrl.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}/socials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: socialPlatform,
          profile_url: socialUrl,
          username: socialUsername,
          password: socialPassword,
          access_provided: socialAccess
        })
      });
      if (res.ok) {
        setSocialUrl('');
        setSocialUsername('');
        setSocialPassword('');
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Social Handle
  const handleDeleteSocialHandle = async (handleId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/socials/${handleId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add SEO Access
  const handleAddSeoAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seoUrl.trim() && !seoUsername.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}/seo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: seoPlatform,
          profile_url: seoUrl,
          username: seoUsername,
          password: seoPassword,
          access_provided: seoAccess
        })
      });
      if (res.ok) {
        setSeoUrl(''); setSeoUsername(''); setSeoPassword('');
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete SEO Access
  const handleDeleteSeoAccess = async (accessId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/seo/${accessId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Paid Media Access
  const handleAddPaidMediaAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paidAccountId.trim() && !paidUsername.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}/paid-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: paidPlatform,
          ad_account_id: paidAccountId,
          profile_url: paidUrl,
          username: paidUsername,
          password: paidPassword,
          access_provided: paidAccess
        })
      });
      if (res.ok) {
        setPaidAccountId(''); setPaidUrl(''); setPaidUsername(''); setPaidPassword('');
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Paid Media Access
  const handleDeletePaidMediaAccess = async (accessId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/paid-media/${accessId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Log Campaign Performance
  const handleLogCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !campStartDate) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          campaign_name: campaignName,
          impressions: campImpressions,
          clicks: campClicks,
          leads_conversions: campConversions,
          spend_inr: campSpend,
          start_date: campStartDate
        })
      });
      if (res.ok) {
        setCampaignName(''); setCampImpressions(''); setCampClicks(''); setCampConversions(''); setCampSpend(''); setCampStartDate('');
        toast.success('Campaign metrics logged!');
        fetchClientDetails();
      } else {
        toast.error('Failed to log campaign metrics');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Campaign Log
  const handleDeleteCampaign = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/campaigns/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleFestival = (festival: string) => {
    if (contactFestivals.includes(festival)) {
      setContactFestivals(contactFestivals.filter(f => f !== festival));
    } else {
      setContactFestivals([...contactFestivals, festival]);
    }
  };

  // Add Monthly Plan
  const handleAddMonthlyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyDepartment || !monthlyMonthYear || !monthlyDocumentLink) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/${clientId}/monthly-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: monthlyDepartment,
          month_year: monthlyMonthYear,
          document_link: monthlyDocumentLink
        })
      });
      if (res.ok) {
        toast.success('Monthly plan added');
        setMonthlyMonthYear('');
        setMonthlyDocumentLink('');
        fetchClientDetails();
      } else {
        toast.error('Failed to add monthly plan');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding monthly plan');
    }
  };

  // Delete Monthly Plan
  const handleDeleteMonthlyPlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/clients/monthly-plans/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Monthly plan deleted');
        fetchClientDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading client profile...</div>;
  if (!client) return <div className="p-8 text-center text-rose-500">Client not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center text-sm font-medium text-slate-500 mb-3 space-x-2">
            <Link href="/" className="hover:text-indigo-600 transition-colors flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/clients" className="hover:text-indigo-600 transition-colors">
              Clients
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold truncate max-w-[200px]">{client.company_name}</span>
          </nav>

          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            {client.logo && (
              <img src={client.logo} alt={client.company_name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm shrink-0" />
            )}
            {client.company_name}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${client.client_status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                client.client_status === 'Hold' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
              {client.client_status}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">{client.service_type || 'No services selected'} • Since {new Date(client.created_at).getFullYear()}</p>
          <div className="flex space-x-3 mt-3">
            {client.primary_contact_name && (
              <div className="flex items-center text-sm text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm">
                <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                <span className="font-medium mr-1.5">Client:</span> {client.primary_contact_name}
              </div>
            )}
            {client.spoc_name && (
              <div className="flex items-center text-sm text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm">
                <svg className="w-4 h-4 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                <span className="font-medium mr-1.5">SPOC:</span> {client.spoc_name}
              </div>
            )}
          </div>
        </div>

        {/* Actions & Health Score Badge */}
        <div className="flex flex-col items-end gap-4">
          {client.health_scores && client.health_scores.length > 0 ? (
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">Health Score</span>
              <div className={`flex items-center px-4 py-2 rounded-lg border ${client.health_scores[0].risk_level === 'Critical' ? 'bg-rose-50 border-rose-200 text-rose-700' : client.health_scores[0].risk_level === 'Risk' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                <span className="text-2xl font-bold mr-2">{client.health_scores[0].overall_score}</span>
                <span className="text-xs font-medium uppercase">{client.health_scores[0].risk_level}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase tracking-wider mb-1">Health Score</span>
              <div className="flex items-center px-4 py-2 rounded-lg border bg-slate-50 border-slate-200 text-slate-500">
                <span className="text-lg font-semibold italic">Pending</span>
              </div>
            </div>
          )}

          <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md shadow text-sm font-semibold hover:bg-slate-800 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs Menu (iOS Segmented Pills Style) */}
      <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 flex space-x-1.5 mb-6 max-w-3xl">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${activeTab === 'overview'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          Overview & Contacts
        </button>
        <button
          onClick={() => setActiveTab('onboarding')}
          className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${activeTab === 'onboarding'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          Onboarding Checklist
        </button>
        <button
          onClick={() => setActiveTab('socials')}
          className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${activeTab === 'socials'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          Access Vaults
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${activeTab === 'campaigns'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${activeTab === 'timeline'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          Activity Timeline
        </button>
        <button
          onClick={() => setActiveTab('monthly_plans')}
          className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${activeTab === 'monthly_plans'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          Monthly Plans
        </button>
        <button
          onClick={() => setActiveTab('ai_calendar')}
          className={`flex-1 py-2 px-3 flex items-center justify-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${
            activeTab === 'ai_calendar'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md border border-indigo-400'
              : 'text-indigo-500 hover:bg-indigo-50'
          }`}
        >
          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          AI Calendar
        </button>
      </div>

      {/* Tab Contents */}
      <div className="grid grid-cols-1 gap-6">

        {activeTab === 'ai_calendar' && (
          <TabAICalendar client={client} />
        )}

        {activeTab === 'monthly_plans' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Monthly Plans & Documents</h2>
              <p className="text-xs text-slate-500 mt-1">Store and manage department-wise monthly plans, calendars, and campaign documents.</p>
            </div>

            <form onSubmit={handleAddMonthlyPlan} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                <select value={monthlyDepartment} onChange={e => setMonthlyDepartment(e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white outline-none">
                  <option value="Social Media">Social Media</option>
                  <option value="Paid Media">Paid Media</option>
                  <option value="SEO">SEO</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Month & Year</label>
                <input type="text" value={monthlyMonthYear} onChange={e => setMonthlyMonthYear(e.target.value)} placeholder="e.g. January 2026" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Document Link</label>
                <input type="url" value={monthlyDocumentLink} onChange={e => setMonthlyDocumentLink(e.target.value)} placeholder="https://..." className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-semibold text-xs px-4 py-1.5 rounded hover:bg-indigo-700 transition shadow-sm">Save Plan</button>
              </div>
            </form>

            {client.monthly_plans && client.monthly_plans.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <select
                    value={monthlyFilter}
                    onChange={e => setMonthlyFilter(e.target.value)}
                    className="text-xs border border-slate-300 rounded p-1.5 bg-white outline-none w-48"
                  >
                    <option value="All">All Months</option>
                    {Array.from(new Set(client.monthly_plans.map((p: any) => p.month_year))).map((month: any) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(monthlyFilter === 'All' ? client.monthly_plans : client.monthly_plans.filter((p: any) => p.month_year === monthlyFilter)).map((plan: any) => (
                    <div key={plan.id} className="border border-slate-200 rounded-lg p-4 bg-white relative group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-indigo-100">
                            {plan.department.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900 leading-none">{plan.department}</p>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">{plan.month_year}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteMonthlyPlan(plan.id)} className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                      {plan.document_link && (
                        <div className="mt-3">
                          <a href={plan.document_link} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center bg-indigo-50 py-1.5 rounded-md hover:bg-indigo-100 transition">
                            View Document <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {monthlyFilter !== 'All' && client.monthly_plans.filter((p: any) => p.month_year === monthlyFilter).length === 0 && (
                  <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                    <p className="text-sm text-slate-500 font-medium">No plans found for {monthlyFilter}.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                <p className="text-sm text-slate-500 font-medium">No monthly plans saved yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Column 1: Profile & Notes */}
            <div className="space-y-8 lg:col-span-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <h3 className="font-semibold text-slate-900">Profile Details</h3>
                  <button onClick={() => openEditModal()} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-md text-xs font-semibold transition-colors flex items-center shadow-sm">
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    Edit Profile
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Brand Code</span>
                    <span className="font-medium text-slate-800 flex items-center gap-2">
                      {client.brand_shortcode ? (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                          {client.brand_shortcode}
                        </span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Industry</span>
                    <span className="font-medium text-slate-800">{client.industry || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Primary Email</span>
                    <span className="font-medium text-slate-800 flex items-center gap-2">
                      {client.email || 'N/A'}
                      {client.email && <button onClick={() => copyToClipboard(client.email)} className="text-slate-400 hover:text-indigo-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button>}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Phone</span>
                    <span className="font-medium text-slate-800 flex items-center gap-2">
                      {client.phone || 'N/A'}
                      {client.phone && <button onClick={() => copyToClipboard(client.phone)} className="text-slate-400 hover:text-indigo-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button>}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Website</span>
                    {client.website ? (
                      <span className="flex items-center gap-2">
                        <a href={client.website} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:underline">
                          {client.website}
                        </a>
                        <button onClick={() => copyToClipboard(client.website)} className="text-slate-400 hover:text-indigo-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button>
                      </span>
                    ) : (
                      <span className="font-medium text-slate-800">N/A</span>
                    )}
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Retainer Value</span>
                    <span className="font-medium text-slate-800">
                      {client.retainer_value ? `₹${client.retainer_value.toLocaleString('en-IN')}/mo` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold">Services</span>
                    <span className="font-medium text-slate-800 block leading-tight">{client.service_type || 'None'}</span>
                  </div>

                  {/* Strategic Brand Info */}
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold text-indigo-600">Core Objective</span>
                    <span className="font-medium text-slate-800 italic">{client.objective || 'Not defined yet.'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold text-indigo-600">Focused Area</span>
                    <span className="font-medium text-slate-800 italic">{client.focused_area || 'Not defined yet.'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase tracking-wide font-bold text-indigo-600">Customer Mindset</span>
                    <span className="font-medium text-slate-800 italic">{client.customer_mindset || 'Not defined yet.'}</span>
                  </div>
                </div>
              </div>

              {/* Internal Notes / Scratchpad */}
              <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <h3 className="font-semibold text-slate-900">Internal Scratchpad</h3>
                  <button onClick={handleSaveNotes} disabled={savingNotes} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Leave internal observations, links, or notes here..."
                  className="w-full h-40 p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                ></textarea>
              </div>
            </div>

            {/* Column 2: Contacts & Tasks */}
            <div className="space-y-8 lg:col-span-8">
              {/* Contacts Card with Birthdays & Greetings */}
              <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <h3 className="font-semibold text-slate-900">Client Contacts</h3>
                  <button onClick={() => setShowContactModal(true)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">+ Add Contact</button>
                </div>
                {client.contacts && client.contacts.length > 0 ? (
                  <ul className="space-y-4">
                    {client.contacts.map((contact: any) => (
                      <li key={contact.id} className="text-sm border-b border-slate-50 pb-3 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-800 flex items-center">
                              {contact.name}
                              {contact.is_primary && <span className="ml-2 text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 font-bold">PRIMARY</span>}
                            </p>
                            <p className="text-slate-500 text-xs font-medium">{contact.designation} {contact.department ? `(${contact.department})` : ''}</p>
                            <p className="text-slate-500 text-xs mt-1">{contact.email} • {contact.phone || 'No phone'}</p>

                            {/* Key Celebrations Logs */}
                            {(contact.birth_date || contact.anniversary_date || (contact.festival_greetings && contact.festival_greetings.length > 0)) && (
                              <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 space-y-1 text-[11px]">
                                {contact.birth_date && (
                                  <p className="text-slate-600">🎂 Birthday: <span className="font-semibold">{new Date(contact.birth_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span></p>
                                )}
                                {contact.anniversary_date && (
                                  <p className="text-slate-600">🎉 Anniversary: <span className="font-semibold">{new Date(contact.anniversary_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span></p>
                                )}
                                {contact.festival_greetings && contact.festival_greetings.length > 0 && (
                                  <p className="text-slate-600">🪔 Festivals: <span className="font-semibold">{contact.festival_greetings.join(', ')}</span></p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 italic">No contacts added yet.</p>
                )}
              </div>

              {/* Standard deliverables tables */}
              <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                  <h3 className="font-semibold text-slate-900">Recent Tasks</h3>
                  <Link href="/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">View All Tasks &rarr;</Link>
                </div>
                {client.tasks && client.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {client.tasks.map((task: any) => (
                      <div key={task.id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded">
                        <Link href={`/tasks/${task.id}`} className="font-semibold text-slate-800 hover:text-indigo-600">{task.title}</Link>
                        <span className={`px-2 py-0.5 rounded text-xs border ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{task.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No tasks logged.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Onboarding Checklist Tab */}
        {activeTab === 'onboarding' && (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Client Onboarding Checklist</h2>
              <p className="text-xs text-slate-500 mt-1">Track key setup milestones required to begin project operations.</p>
            </div>

            <form onSubmit={handleAddOnboardingItem} className="flex space-x-2">
              <input
                type="text"
                placeholder="Add new checklist item (e.g. 'Get Meta Business Manager access')"
                value={newStepName}
                onChange={e => setNewStepName(e.target.value)}
                className="flex-1 text-sm border border-slate-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <button type="submit" className="bg-indigo-600 text-white font-semibold text-xs px-4 rounded hover:bg-indigo-700 transition">Add Item</button>
            </form>

            {client.onboarding_checklist && client.onboarding_checklist.length > 0 ? (
              <div className="space-y-3">
                {client.onboarding_checklist.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={() => toggleOnboardingItem(item.id, item.is_completed)}
                        className="h-4.5 w-4.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className={`text-sm ${item.is_completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                        {item.step_name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {item.is_completed && item.completed_at && (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 font-semibold">Done {new Date(item.completed_at).toLocaleDateString()}</span>
                      )}
                      <button onClick={() => handleDeleteOnboardingItem(item.id)} className="text-slate-400 hover:text-rose-600 text-xs">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-6">No onboarding checklist items added yet.</p>
            )}
          </div>
        )}

        {/* Access Vaults Tab */}
        {activeTab === 'socials' && (
          <div className="space-y-6">

            {/* SOCIAL MEDIA VAULT */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Social Media Vault</h2>
                <p className="text-xs text-slate-500 mt-1">Manage social media credentials, URLs, and access levels.</p>
              </div>

              <form onSubmit={handleAddSocialHandle} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Platform</label>
                  <select value={socialPlatform} onChange={e => setSocialPlatform(e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white outline-none">
                    <option value="Instagram">Instagram</option>
                    <option value="Meta (Facebook)">Meta (Facebook)</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Twitter">Twitter</option>

                    <option value="Pinterest">Pinterest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Profile URL</label>
                  <input type="url" value={socialUrl} onChange={e => setSocialUrl(e.target.value)} placeholder="https://..." className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Username / Email</label>
                  <input type="text" value={socialUsername} onChange={e => setSocialUsername(e.target.value)} placeholder="Username" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                  <input type="text" value={socialPassword} onChange={e => setSocialPassword(e.target.value)} placeholder="Password" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Access Role</label>
                  <select value={socialAccess} onChange={e => setSocialAccess(e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white outline-none">
                    <option value="Admin">Admin</option>
                    <option value="Advertiser">Advertiser</option>
                    <option value="Analyst">Analyst</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div>
                  <button type="submit" className="w-full bg-indigo-600 text-white font-semibold text-xs px-4 py-1.5 rounded hover:bg-indigo-700 transition shadow-sm">Save</button>
                </div>
              </form>

              {client.social_handles && client.social_handles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {client.social_handles.map((handle: any) => (
                    <div key={handle.id} className="border border-slate-200 rounded-lg p-4 bg-white relative group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-indigo-100">
                            {handle.platform.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900 leading-none">{handle.platform}</p>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">{handle.access_provided} Access</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteSocialHandle(handle.id)} className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                      <div className="space-y-2 mt-3 text-xs bg-slate-50 p-2.5 rounded border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Username:</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            {handle.username || '-'}
                            {handle.username && <button onClick={() => copyToClipboard(handle.username)} className="text-slate-400 hover:text-indigo-600"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button>}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Password:</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            {handle.password ? (visiblePasswords[handle.id] ? handle.password : '••••••••') : '-'}
                            {handle.password && (
                              <>
                                <button onClick={() => togglePasswordVisibility(handle.id)} className="text-slate-400 hover:text-indigo-600 ml-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {visiblePasswords[handle.id] ? (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    ) : (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    )}
                                  </svg>
                                </button>
                                <button onClick={() => copyToClipboard(handle.password)} className="text-slate-400 hover:text-indigo-600">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                </button>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      {handle.profile_url && (
                        <div className="mt-3">
                          <a href={handle.profile_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center bg-indigo-50 py-1.5 rounded-md hover:bg-indigo-100 transition">
                            Open Profile <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                  <p className="text-sm text-slate-500 font-medium">No social media credentials saved yet.</p>
                </div>
              )}
            </div>

            {/* SEO VAULT */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">SEO & Web Analytics Vault</h2>
                <p className="text-xs text-slate-500 mt-1">Manage access to Google Analytics, Search Console, Ahrefs, and other web tools.</p>
              </div>

              <form onSubmit={handleAddSeoAccess} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Platform</label>
                  <select value={seoPlatform} onChange={e => setSeoPlatform(e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white outline-none">
                    <option value="Google Analytics">Google Analytics</option>
                    <option value="Google Search Console">Search Console</option>
                    <option value="Ahrefs">Ahrefs</option>
                    <option value="SEMrush">SEMrush</option>
                    <option value="Shopify Admin">Shopify Admin</option>
                    <option value="WordPress Admin">WordPress Admin</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Login URL</label>
                  <input type="url" value={seoUrl} onChange={e => setSeoUrl(e.target.value)} placeholder="https://..." className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Username / Email</label>
                  <input type="text" value={seoUsername} onChange={e => setSeoUsername(e.target.value)} placeholder="Username" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                  <input type="text" value={seoPassword} onChange={e => setSeoPassword(e.target.value)} placeholder="Password" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Access Role</label>
                  <select value={seoAccess} onChange={e => setSeoAccess(e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white outline-none">
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div>
                  <button type="submit" className="w-full bg-indigo-600 text-white font-semibold text-xs px-4 py-1.5 rounded hover:bg-indigo-700 transition shadow-sm">Save</button>
                </div>
              </form>

              {client.seo_accesses && client.seo_accesses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {client.seo_accesses.map((handle: any) => (
                    <div key={handle.id} className="border border-slate-200 rounded-lg p-4 bg-white relative group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-sm border border-indigo-100">
                            SEO
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900 leading-none">{handle.platform}</p>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">{handle.access_provided} Access</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteSeoAccess(handle.id)} className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                      <div className="space-y-2 mt-3 text-xs bg-slate-50 p-2.5 rounded border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Username:</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            {handle.username || '-'}
                            {handle.username && <button onClick={() => copyToClipboard(handle.username)} className="text-slate-400 hover:text-indigo-600"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button>}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Password:</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            {handle.password ? (visiblePasswords[handle.id] ? handle.password : '••••••••') : '-'}
                            {handle.password && (
                              <>
                                <button onClick={() => togglePasswordVisibility(handle.id)} className="text-slate-400 hover:text-indigo-600 ml-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {visiblePasswords[handle.id] ? (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    ) : (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    )}
                                  </svg>
                                </button>
                                <button onClick={() => copyToClipboard(handle.password)} className="text-slate-400 hover:text-indigo-600">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                </button>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      {handle.profile_url && (
                        <div className="mt-3">
                          <a href={handle.profile_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center bg-indigo-50 py-1.5 rounded-md hover:bg-indigo-100 transition">
                            Open Dashboard <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                  <p className="text-sm text-slate-500 font-medium">No SEO credentials saved yet.</p>
                </div>
              )}
            </div>

            {/* PAID MEDIA VAULT */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Paid Media Vault</h2>
                <p className="text-xs text-slate-500 mt-1">Manage access to Ad accounts and billing profiles.</p>
              </div>

              <form onSubmit={handleAddPaidMediaAccess} className="grid grid-cols-1 md:grid-cols-7 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Platform</label>
                  <select value={paidPlatform} onChange={e => setPaidPlatform(e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white outline-none">
                    <option value="Google Ads">Google Ads</option>
                    <option value="Meta Ads Manager">Meta Ads</option>
                    <option value="LinkedIn Ads">LinkedIn Ads</option>
                    <option value="Amazon Ads">Amazon Ads</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ad Account ID</label>
                  <input type="text" value={paidAccountId} onChange={e => setPaidAccountId(e.target.value)} placeholder="e.g. 123-456-7890" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Login URL</label>
                  <input type="url" value={paidUrl} onChange={e => setPaidUrl(e.target.value)} placeholder="https://..." className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Username / Email</label>
                  <input type="text" value={paidUsername} onChange={e => setPaidUsername(e.target.value)} placeholder="Username" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                  <input type="text" value={paidPassword} onChange={e => setPaidPassword(e.target.value)} placeholder="Password" className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Access Role</label>
                  <select value={paidAccess} onChange={e => setPaidAccess(e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white outline-none">
                    <option value="Admin">Admin</option>
                    <option value="Advertiser">Advertiser</option>
                    <option value="Billing">Billing</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div>
                  <button type="submit" className="w-full bg-indigo-600 text-white font-semibold text-xs px-4 py-1.5 rounded hover:bg-indigo-700 transition shadow-sm">Save</button>
                </div>
              </form>

              {client.paid_media_accesses && client.paid_media_accesses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {client.paid_media_accesses.map((handle: any) => (
                    <div key={handle.id} className="border border-slate-200 rounded-lg p-4 bg-white relative group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-sm border border-indigo-100">
                            ADS
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900 leading-none">{handle.platform}</p>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">{handle.access_provided} Access</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeletePaidMediaAccess(handle.id)} className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>

                      {handle.ad_account_id && (
                        <div className="mb-2">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-0.5">Ad Account ID</span>
                          <span className="font-mono text-sm font-semibold text-indigo-700 flex items-center gap-2">
                            {handle.ad_account_id}
                            <button onClick={() => copyToClipboard(handle.ad_account_id)} className="text-slate-400 hover:text-indigo-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button>
                          </span>
                        </div>
                      )}

                      <div className="space-y-2 mt-3 text-xs bg-slate-50 p-2.5 rounded border border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Username:</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            {handle.username || '-'}
                            {handle.username && <button onClick={() => copyToClipboard(handle.username)} className="text-slate-400 hover:text-indigo-600"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button>}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Password:</span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            {handle.password ? (visiblePasswords[handle.id] ? handle.password : '••••••••') : '-'}
                            {handle.password && (
                              <>
                                <button onClick={() => togglePasswordVisibility(handle.id)} className="text-slate-400 hover:text-indigo-600 ml-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {visiblePasswords[handle.id] ? (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    ) : (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    )}
                                  </svg>
                                </button>
                                <button onClick={() => copyToClipboard(handle.password)} className="text-slate-400 hover:text-indigo-600">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                </button>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      {handle.profile_url && (
                        <div className="mt-3">
                          <a href={handle.profile_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center bg-indigo-50 py-1.5 rounded-md hover:bg-indigo-100 transition">
                            Open Manager <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                  <p className="text-sm text-slate-500 font-medium">No Paid Media credentials saved yet.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Campaign Performance Tab */}
        {activeTab === 'campaigns' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Logger Form */}
            <div className="lg:col-span-1 bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900">Log Campaign Metric</h3>
                <p className="text-xs text-slate-500">Record performance statistics and budget costs.</p>
              </div>

              <form onSubmit={handleLogCampaign} className="space-y-4 text-xs font-semibold text-slate-600">
                <div>
                  <label className="block mb-1">Campaign Name</label>
                  <input required type="text" placeholder="e.g. Summer Leads 2026" value={campaignName} onChange={e => setCampaignName(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">Impressions</label>
                    <input type="number" placeholder="50000" value={campImpressions} onChange={e => setCampImpressions(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none" />
                  </div>
                  <div>
                    <label className="block mb-1">Clicks</label>
                    <input type="number" placeholder="2500" value={campClicks} onChange={e => setCampClicks(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">Conversions / Leads</label>
                    <input type="number" placeholder="120" value={campConversions} onChange={e => setCampConversions(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none" />
                  </div>
                  <div>
                    <label className="block mb-1">Spend (INR `₹`)</label>
                    <input required type="number" placeholder="15000" value={campSpend} onChange={e => setCampSpend(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block mb-1">Start Date</label>
                  <input required type="date" value={campStartDate} onChange={e => setCampStartDate(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none" />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded text-xs font-bold hover:bg-indigo-700 transition">Log Metric Record</button>
              </form>
            </div>

            {/* Metric Displays */}
            <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-slate-900">Campaign ROI Records</h3>
                <p className="text-xs text-slate-500">List of ad campaign results and calculated Cost Per Lead values.</p>
              </div>

              {client.campaign_performances && client.campaign_performances.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2">Campaign</th>
                        <th className="py-2">Impressions</th>
                        <th className="py-2">Clicks (CTR)</th>
                        <th className="py-2">Conversions</th>
                        <th className="py-2">Spend (INR)</th>
                        <th className="py-2">CPL (INR)</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {client.campaign_performances.map((camp: any) => {
                        const ctr = camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(2) : '0';
                        return (
                          <tr key={camp.id} className="hover:bg-slate-50">
                            <td className="py-3 font-semibold text-slate-900">
                              <p>{camp.campaign_name}</p>
                              <span className="text-[10px] text-slate-400 font-normal">{new Date(camp.start_date).toLocaleDateString()}</span>
                            </td>
                            <td className="py-3">{camp.impressions.toLocaleString()}</td>
                            <td className="py-3">{camp.clicks.toLocaleString()} ({ctr}%)</td>
                            <td className="py-3">{camp.leads_conversions.toLocaleString()}</td>
                            <td className="py-3">₹{camp.spend_inr.toLocaleString('en-IN')}</td>
                            <td className="py-3 text-indigo-600 font-bold">₹{camp.cost_per_lead_inr.toFixed(2)}</td>
                            <td className="py-3 text-right">
                              <button onClick={() => handleDeleteCampaign(camp.id)} className="text-rose-600 hover:underline font-semibold">Delete</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic text-center py-12">No marketing campaigns logged for this client yet.</p>
              )}
            </div>

          </div>
        )}

        {/* Activity Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900 font-heading flex items-center mb-4 md:mb-0">
                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Activity Timeline
              </h2>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Activity' },
                  { id: 'task', label: 'Tasks' },
                  { id: 'communication', label: 'Comms' },
                  { id: 'meeting', label: 'Meetings' },
                  { id: 'sow', label: 'SOWs' },
                  { id: 'escalation', label: 'Escalations' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setTimelineFilter(f.id as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${timelineFilter === f.id
                        ? 'bg-slate-800 border-slate-800 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
              {(() => {
                let events: any[] = [];
                if (client.tasks) {
                  client.tasks.forEach((t: any) => {
                    events.push({ ...t, type: 'task', event_title: `Task Created: ${t.title}`, date: new Date(t.created_at) });
                    if (t.status === 'Completed' && t.updated_at) {
                      events.push({ ...t, type: 'task_completed', event_title: `Task Completed: ${t.title}`, date: new Date(t.updated_at) });
                    }
                  });
                }
                if (client.communications) events.push(...client.communications.map((c: any) => ({ ...c, type: 'communication', event_title: `Communication Logged: ${c.subject}`, date: new Date(c.created_at) })));
                if (client.sows) events.push(...client.sows.map((s: any) => ({ ...s, type: 'sow', event_title: `SOW Added: ${s.title}`, date: new Date(s.created_at) })));
                if (client.escalations) {
                  client.escalations.forEach((e: any) => {
                    events.push({ ...e, type: 'escalation', event_title: `Escalation: ${e.issue}`, date: new Date(e.created_at) });
                    if (e.status === 'Resolved' && e.updated_at) {
                      events.push({ ...e, type: 'escalation_resolved', event_title: `Escalation Resolved: ${e.issue}`, date: new Date(e.updated_at) });
                    }
                  });
                }
                if (client.meetings) events.push(...client.meetings.map((m: any) => ({ ...m, type: 'meeting', event_title: `Meeting: ${m.title}`, date: new Date(m.meeting_date) })));

                if (timelineFilter !== 'all') {
                  events = events.filter(e => e.type.startsWith(timelineFilter));
                }

                events.sort((a, b) => b.date.getTime() - a.date.getTime());

                if (events.length === 0) {
                  return <p className="text-sm text-slate-500 italic pl-6">No {timelineFilter === 'all' ? 'activity' : timelineFilter + 's'} found for this client.</p>;
                }

                return events.map((ev, i) => (
                  <div key={i} className="relative pl-6">
                    <span className={`absolute -left-3 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white ring-4 ring-white shadow-sm ${ev.type.startsWith('task') ? 'bg-indigo-100 text-indigo-600' :
                        ev.type === 'communication' ? 'bg-sky-100 text-sky-600' :
                          ev.type === 'sow' ? 'bg-emerald-100 text-emerald-600' :
                            ev.type === 'meeting' ? 'bg-amber-100 text-amber-600' :
                              'bg-rose-100 text-rose-600'
                      }`}>
                      {ev.type === 'task' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>}
                      {(ev.type === 'task_completed' || ev.type === 'escalation_resolved') && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                      {ev.type === 'communication' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>}
                      {ev.type === 'meeting' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>}
                      {ev.type === 'sow' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>}
                      {ev.type === 'escalation' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                      <div className="text-sm font-semibold text-slate-900">
                        {ev.event_title}
                      </div>
                      <time className="text-xs text-slate-500 mt-1 sm:mt-0 font-medium">
                        {ev.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                    <div className="mt-1.5 text-sm text-slate-600 line-clamp-2">
                      {ev.type.startsWith('task') && ev.description}
                      {ev.type === 'communication' && (ev.summary ? ev.summary.replace(/<[^>]+>/g, '') : '')}
                      {ev.type === 'sow' && `Amount: ₹${ev.total_amount?.toLocaleString() || 0} | Status: ${ev.status}`}
                      {ev.type === 'meeting' && ev.agenda}
                      {ev.type.startsWith('escalation') && ev.resolution_notes}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

      </div>

      {/* Add Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Add New Contact</h3>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleAddContact} className="p-5 space-y-4 text-xs font-semibold text-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Full Name</label>
                  <input required type="text" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none" />
                </div>
                <div>
                  <label className="block mb-1">Designation</label>
                  <input type="text" value={contactDesig} onChange={e => setContactDesig(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none" placeholder="e.g. Marketing Lead" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Department</label>
                  <input type="text" value={contactDept} onChange={e => setContactDept(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none" placeholder="e.g. Marketing" />
                </div>
                <div>
                  <label className="block mb-1">Email</label>
                  <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none" />
                </div>
              </div>
              <div>
                <label className="block mb-1">Phone Number</label>
                <input type="text" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none" placeholder="e.g. +91 98765 43210" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Date of Birth</label>
                  <input type="date" value={contactBirth} onChange={e => setContactBirth(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none" />
                </div>
                <div>
                  <label className="block mb-1">Anniversary Date</label>
                  <input type="date" value={contactAnniv} onChange={e => setContactAnniv(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none" />
                </div>
              </div>

              <div>
                <label className="block mb-1">Festival Greetings Opt-in</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {['Diwali', 'Eid', 'Christmas', 'Holi', 'New Year'].map(fest => (
                    <button
                      key={fest}
                      type="button"
                      onClick={() => toggleFestival(fest)}
                      className={`px-3 py-1 rounded-full border text-[10px] font-bold transition ${contactFestivals.includes(fest) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}
                    >
                      {fest}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowContactModal(false)} className="px-4 py-2 bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">Save Contact</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Edit Client Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
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
                  <input type="text" value={editPrimaryContact} onChange={e => setEditPrimaryContact(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block mb-1">Internal SPOC</label>
                  <input type="text" value={editSpocName} onChange={e => setEditSpocName(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" placeholder="e.g. Sarah Smith" />
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
                  <label className="block mb-1">Monthly Retainer (INR ₹)</label>
                  <input type="number" value={editRetainer} onChange={e => setEditRetainer(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" placeholder="e.g. 50000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Project Start Date / Joining Date</label>
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
                  <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" placeholder="e.g. +91 98765 43210" />
                </div>
                <div>
                  <label className="block mb-1">Website URL</label>
                  <input type="url" value={editWebsite} onChange={e => setEditWebsite(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" placeholder="https://example.com" />
                </div>
              </div>

              <div>
                <label className="block mb-1">Brand Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://nexus-p3l0.onrender.com'}/api/upload`, {
                          method: 'POST',
                          body: formData
                        });
                        const data = await res.json();
                        if (data.url) {
                          setEditLogo(data.url);
                          toast.success('Logo uploaded');
                        }
                      } catch (err) {
                        toast.error('Failed to upload logo');
                      }
                    }
                  }}
                  className="w-full border border-slate-300 rounded p-1.5 outline-none font-normal text-slate-800"
                />
                {editLogo && <img src={editLogo} alt="Logo preview" className="h-10 mt-2 object-contain bg-slate-50 p-1 rounded border border-slate-200" />}
              </div>

              <div>
                <label className="block mb-1">Core Objective</label>
                <textarea value={editObjective} onChange={e => setEditObjective(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" rows={2} placeholder="Client's core objective..."></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Focused Area</label>
                  <input type="text" value={editFocusedArea} onChange={e => setEditFocusedArea(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" placeholder="e.g. B2B Leads" />
                </div>
                <div>
                  <label className="block mb-1">Customer Mindset</label>
                  <input type="text" value={editCustomerMindset} onChange={e => setEditCustomerMindset(e.target.value)} className="w-full border border-slate-300 rounded p-2 outline-none font-normal text-slate-800" placeholder="e.g. Value-driven" />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-slate-700">Services Selected</label>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {SERVICES.map(service => (
                    <label key={service} className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={editServices.includes(service)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditServices([...editServices, service]);
                          } else {
                            setEditServices(editServices.filter(s => s !== service));
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4 h-4 cursor-pointer"
                      />
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

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Export Work Report
              </h2>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              <p className="text-slate-600">Select the contents, date range, and format for your report.</p>

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
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Export Format</label>
                <div className="flex space-x-4">
                  <label className={`flex-1 border rounded-lg p-3 cursor-pointer transition-all ${exportFormat === 'pdf' ? 'border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <input type="radio" name="format" value="pdf" checked={exportFormat === 'pdf'} onChange={() => setExportFormat('pdf')} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                      <span className="font-semibold text-slate-900">PDF Report</span>
                    </div>
                    <p className="text-xs text-slate-500 pl-6">Clean, printable document</p>
                  </label>
                  <label className={`flex-1 border rounded-lg p-3 cursor-pointer transition-all ${exportFormat === 'excel' ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500' : 'border-slate-200 hover:border-emerald-300'}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <input type="radio" name="format" value="excel" checked={exportFormat === 'excel'} onChange={() => setExportFormat('excel')} className="text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                      <span className="font-semibold text-slate-900">Excel Data</span>
                    </div>
                    <p className="text-xs text-slate-500 pl-6">Raw spreadsheet data</p>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowExportModal(false)} className="px-4 py-2 font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleExportReport} className={`px-4 py-2 font-semibold text-white rounded-lg shadow-sm transition-colors flex items-center gap-2 ${exportFormat === 'pdf' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {exportFormat === 'pdf' ? 'Generate PDF' : 'Download Excel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
