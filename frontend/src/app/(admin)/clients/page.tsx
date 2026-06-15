'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  useEffect(() => {
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
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Hold': return 'bg-amber-50 text-amber-700 border border-amber-200';
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

  // Extract unique industries for the dropdown
  const uniqueIndustries = Array.from(new Set(clients.map(c => c.industry).filter(Boolean)));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Clients Master</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and view all your agency clients.</p>
        </div>
        <Link 
          href="/clients/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Client
        </Link>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search Clients</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              placeholder="Search company name..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Filter by Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-slate-300 rounded p-1.5 focus:ring-1 focus:ring-indigo-500 outline-none min-w-[150px]">
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Hold">Hold</option>
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

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading data...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Company</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Service & Value</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Industry</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Status</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-700">Renewal Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/clients/${client.id}`} className="font-medium text-indigo-600 hover:text-indigo-800 flex items-center transition-colors">
                      <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold mr-3 text-xs">
                        {client.company_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div>{client.company_name}</div>
                        {client.email && <div className="text-xs text-slate-500 font-normal">{client.email}</div>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-slate-900 font-medium">{client.retainer_value ? `$${client.retainer_value.toLocaleString()}/mo` : '-'}</div>
                    <div className="text-slate-500 text-xs">{client.service_type || 'General'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {client.industry || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadge(client.client_status)}`}>
                      {client.client_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {client.renewal_date ? new Date(client.renewal_date).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
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
