'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const clientSchema = z.object({
  company_name: z.string().min(2, 'Company name is required and must be at least 2 characters'),
  brand_name: z.string().optional(),
  brand_shortcode: z.string().optional(),
  logo: z.string().url('Must be a valid URL (e.g. https://example.com/logo.png)').optional().or(z.literal('')),
  industry: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url('Invalid URL format (e.g. https://example.com)').optional().or(z.literal('')),
  client_status: z.enum(['Active', 'Hold', 'Lost']),
  retainer_value: z.string().optional()
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function NewClientPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const SERVICES = [
    'SEO', 
    'SMM (Social Media)', 
    'Web Development', 
    'PPC Advertising', 
    'Content Marketing', 
    'Branding & Design', 
    'Email Marketing', 
    'WhatsApp Marketing'
  ];

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      company_name: '',
      brand_name: '',
      brand_shortcode: '',
      logo: '',
      industry: '',
      email: '',
      phone: '',
      website: '',
      client_status: 'Active',
      retainer_value: ''
    }
  });

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    const loadingToast = toast.loading('Saving client...');
    try {
      const payload = {
        ...data,
        service_type: selectedServices.join(', '),
        retainer_value: data.retainer_value ? parseFloat(data.retainer_value) : null
      };

      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api/clients?activeOnly=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        toast.success('Client saved successfully!', { id: loadingToast });
        router.push('/clients');
      } else {
        toast.error('Failed to save client.', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error connecting to backend server.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/clients" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Clients
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-4 tracking-tight font-heading">Add New Client</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="space-y-5 text-sm">
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Company Name <span className="text-rose-500">*</span></label>
            <input 
              type="text"
              placeholder="e.g. Reliance Digital Solutions Pvt Ltd"
              className={`w-full border rounded-md p-2 outline-none transition-shadow ${errors.company_name ? 'border-rose-300 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 bg-rose-50' : 'border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'}`}
              {...register('company_name')}
            />
            {errors.company_name && <p className="mt-1 text-xs text-rose-500">{errors.company_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Brand Name</label>
              <input 
                type="text" 
                placeholder="e.g. Reliance"
                className="w-full border border-slate-300 rounded-md p-2 outline-none transition-shadow focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                {...register('brand_name')}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Brand Shortcode</label>
              <input 
                type="text" 
                placeholder="e.g. RIL"
                className="w-full border border-slate-300 rounded-md p-2 outline-none transition-shadow focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                {...register('brand_shortcode')}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Logo URL</label>
            <input 
              type="url"
              placeholder="e.g. https://example.com/logo.png"
              className={`w-full border rounded-md p-2 outline-none transition-shadow ${errors.logo ? 'border-rose-300 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 bg-rose-50' : 'border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'}`}
              {...register('logo')}
            />
            {errors.logo && <p className="mt-1 text-xs text-rose-500">{errors.logo.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Primary Client Name</label>
              <input 
                type="text" 
                placeholder="e.g. John Doe"
                className="w-full border border-slate-300 rounded-md p-2 outline-none transition-shadow focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                // @ts-ignore - Field not strictly typed in the simplified schema yet
                {...register('primary_contact_name')}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Internal SPOC / AM</label>
              <input 
                type="text" 
                placeholder="e.g. Sarah Smith"
                className="w-full border border-slate-300 rounded-md p-2 outline-none transition-shadow focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                // @ts-ignore - Field not strictly typed in the simplified schema yet
                {...register('spoc_name')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Industry</label>
              <input 
                type="text" 
                className={`w-full border rounded-md p-2 outline-none transition-shadow ${errors.industry ? 'border-rose-300 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 bg-rose-50' : 'border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'}`}
                {...register('industry')}
              />
              {errors.industry && <p className="mt-1 text-xs text-rose-500">{errors.industry.message}</p>}
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Status <span className="text-rose-500">*</span></label>
              <select 
                className={`w-full border rounded-md p-2 outline-none transition-shadow ${errors.client_status ? 'border-rose-300 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 bg-rose-50' : 'border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'}`}
                {...register('client_status')}
              >
                <option value="Active">Active</option>
                <option value="Hold">Hold</option>
                <option value="Lost">Lost</option>
              </select>
              {errors.client_status && <p className="mt-1 text-xs text-rose-500">{errors.client_status.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Email</label>
              <input 
                type="email" 
                className={`w-full border rounded-md p-2 outline-none transition-shadow ${errors.email ? 'border-rose-300 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 bg-rose-50' : 'border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'}`}
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Phone</label>
              <input 
                type="tel" 
                className={`w-full border rounded-md p-2 outline-none transition-shadow ${errors.phone ? 'border-rose-300 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 bg-rose-50' : 'border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'}`}
                {...register('phone')}
              />
              {errors.phone && <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Website</label>
              <input 
                type="url" 
                placeholder="https://"
                className={`w-full border rounded-md p-2 outline-none transition-shadow ${errors.website ? 'border-rose-300 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 bg-rose-50' : 'border-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'}`}
                {...register('website')}
              />
              {errors.website && <p className="mt-1 text-xs text-rose-500">{errors.website.message}</p>}
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">Monthly Retainer (INR ₹)</label>
              <input 
                type="number" 
                placeholder="e.g. 50000"
                className="w-full border border-slate-300 rounded-md p-2 outline-none transition-shadow focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                {...register('retainer_value')}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-2">Services Selected</label>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              {SERVICES.map(service => (
                <label key={service} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedServices.includes(service)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedServices([...selectedServices, service]);
                      } else {
                        setSelectedServices(selectedServices.filter(s => s !== service));
                      }
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-4 h-4 cursor-pointer"
                  />
                  <span>{service}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end space-x-3">
          <Link href="/clients" className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-md transition-colors">
            Cancel
          </Link>
          <button disabled={isSubmitting} type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save Client'}
          </button>
        </div>
      </form>
    </div>
  );
}
