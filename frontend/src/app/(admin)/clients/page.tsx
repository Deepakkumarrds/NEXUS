'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Client = {
  id: string;
  company_name: string;
  email: string;
  service_type: string;
  client_status: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/clients')
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Client Master Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of all active and past clients.</p>
        </div>
        <Link 
          href="/clients/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          + Add New Client
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading clients...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <th className="p-4 font-semibold">Company Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Service Type</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="p-4 font-medium text-gray-800">{client.company_name}</td>
                  <td className="p-4 text-gray-600">{client.email}</td>
                  <td className="p-4">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {client.service_type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                      {client.client_status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm mr-4">View Profile</button>
                    <button className="text-gray-400 hover:text-red-600 font-medium text-sm">Delete</button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No clients found. Click "Add New Client" to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
