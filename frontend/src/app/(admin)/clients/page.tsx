'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

type Client = {
  id: string;
  company_name: string;
  brand_name: string | null;
  industry: string | null;
  email: string | null;
  client_status: string;
  retainer_value: number | null;
  service_type: string | null;
  renewal_date: string | null;
  created_at: string;
  primary_contact_name: string | null;
  spoc_name: string | null;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  
  // Custom Columns
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [columns, setColumns] = useState({
    company: true,
    contact: true,
    spoc: true,
    service: true,
    industry: true,
    status: true,
    renewal: true
  });
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const fetchClients = () => {
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/clients')
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          setClients(data.data);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching clients:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Hold': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Archived': return 'bg-slate-100 text-slate-600 border border-slate-300';
      case 'Lost': return 'bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? client.client_status === statusFilter : true;
    const matchesIndustry = industryFilter ? client.industry === industryFilter : true;
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const uniqueIndustries = Array.from(new Set(clients.map(c => c.industry).filter(Boolean)));

  const exportCSV = () => {
    const headers = ['Company', 'Email', 'Client Name', 'SPOC', 'Industry', 'Status', 'Retainer Value', 'Service Type', 'Renewal Date'];
    const rows = filteredClients.map(c => [
      `"${c.company_name}"`,
      `"${c.email || ''}"`,
      `"${c.primary_contact_name || ''}"`,
      `"${c.spoc_name || ''}"`,
      `"${c.industry || ''}"`,
      `"${c.client_status}"`,
      `"${c.retainer_value || 0}"`,
      `"${c.service_type || ''}"`,
      `"${c.renewal_date ? new Date(c.renewal_date).toLocaleDateString() : ''}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clients_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Exported Successfully');
  };

  const archiveClient = async (id: string) => {
    if(!confirm('Are you sure you want to archive this client?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_status: 'Archived' })
      });
      if (res.ok) {
        toast.success('Client Archived');
        fetchClients();
      } else {
        toast.error('Failed to archive client');
      }
    } catch (error) {
      toast.error('Failed to archive client');
    }
    setOpenDropdownId(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Clients Master</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and view all your agency clients.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={exportCSV} className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition shadow-sm border border-slate-200 flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Export CSV
          </button>
          
          <div className="relative">
            <button onClick={() => setShowColumnMenu(!showColumnMenu)} className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition shadow-sm border border-slate-200 flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path></svg>
              Columns
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-2">
                {Object.keys(columns).map(col => (
                  <label key={col} className="flex items-center px-4 py-2 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={columns[col as keyof typeof columns]} onChange={() => setColumns({...columns, [col]: !columns[col as keyof typeof columns]})} className="mr-3 rounded text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700 capitalize">{col}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Link href="/clients/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm flex items-center">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add Client
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search Clients</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input type="text" placeholder="Search company name..." className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none min-w-[150px]">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Hold">Hold</option>
            <option value="Archived">Archived</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Industry</label>
          <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} className="text-sm border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none min-w-[150px]">
            <option value="">All Industries</option>
            {uniqueIndustries.map(ind => (
              <option key={ind as string} value={ind as string}>{ind}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-visible min-h-[400px]">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading data...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {columns.company && <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Company</th>}
                {columns.contact && <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Client Name</th>}
                {columns.spoc && <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">SPOC</th>}
                {columns.service && <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Service & Value</th>}
                {columns.industry && <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Industry</th>}
                {columns.status && <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>}
                {columns.renewal && <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Renewal Date</th>}
                <th scope="col" className="px-6 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 relative">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  {columns.company && <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/clients/${client.id}`} className="font-medium text-indigo-600 hover:text-indigo-800 flex items-center transition-colors">
                      <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold mr-3 text-xs">
                        {client.company_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div>{client.company_name}</div>
                        {client.email && <div className="text-xs text-slate-500 font-normal">{client.email}</div>}
                      </div>
                    </Link>
                  </td>}
                  {columns.contact && <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-medium">
                    {client.primary_contact_name || '-'}
                  </td>}
                  {columns.spoc && <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded">
                      {client.spoc_name || 'Unassigned'}
                    </span>
                  </td>}
                  {columns.service && <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-slate-900 font-medium">{client.retainer_value ? `₹${client.retainer_value.toLocaleString('en-IN')}/mo` : '-'}</div>
                    <div className="text-slate-500 text-xs">{client.service_type || 'General'}</div>
                  </td>}
                  {columns.industry && <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {client.industry || '-'}
                  </td>}
                  {columns.status && <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(client.client_status)}`}>
                      {client.client_status}
                    </span>
                  </td>}
                  {columns.renewal && <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {client.renewal_date ? new Date(client.renewal_date).toLocaleDateString() : 'N/A'}
                  </td>}
                  <td className="px-6 py-4 whitespace-nowrap text-right relative">
                    <button onClick={() => setOpenDropdownId(openDropdownId === client.id ? null : client.id)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                    </button>
                    {openDropdownId === client.id && (
                      <div className="absolute right-8 top-8 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 text-left">
                        <Link href={`/clients/${client.id}?edit=true`} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600">Edit Client</Link>
                        <Link href={`/tasks/new?client_id=${client.id}`} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600">Add Task</Link>
                        <Link href={`/communications/new?client_id=${client.id}`} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600">Log Call</Link>
                        <div className="border-t border-slate-100 my-1"></div>
                        <button onClick={() => archiveClient(client.id)} className="block w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">Archive Client</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    {clients.length === 0 ? 'No clients found. Click "Add Client" to get started.' : 'No clients match your search criteria.'}
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
