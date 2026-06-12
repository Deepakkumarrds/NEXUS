'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AddClientPage() {
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    service_type: '',
    retainer_value: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        alert('Client added successfully!');
        window.location.href = '/clients';
      } else {
        alert('Failed to add client. Please check the backend connection.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/clients" className="text-blue-600 hover:underline text-sm font-medium">
          &larr; Back to Clients
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mt-2">Add New Client</h1>
        <p className="text-gray-500 mt-1">Enter the details for the new agency client.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input 
              type="text" 
              name="company_name"
              required
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="e.g. Acme Corp"
              value={formData.company_name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Email</label>
            <input 
              type="email" 
              name="email"
              required
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="contact@company.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <select 
              name="service_type"
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
              value={formData.service_type}
              onChange={handleChange}
            >
              <option value="">Select a service...</option>
              <option value="SEO">SEO</option>
              <option value="Ads">Ads Management</option>
              <option value="Social Media">Social Media</option>
              <option value="Web Development">Web Development</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Retainer (₹)</label>
            <input 
              type="number" 
              name="retainer_value"
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="e.g. 15000"
              value={formData.retainer_value}
              onChange={handleChange}
            />
          </div>

        </div>

        <div className="mt-8 flex justify-end">
          <Link 
            href="/clients" 
            className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg mr-2 transition"
          >
            Cancel
          </Link>
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Save Client
          </button>
        </div>
      </form>
    </div>
  );
}
