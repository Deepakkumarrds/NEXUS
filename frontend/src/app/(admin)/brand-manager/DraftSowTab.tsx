'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Copy, Plus, Trash2, Layers, CheckSquare, Layers3, Check, X, ShieldAlert, Search } from 'lucide-react';

// Package Presets by Department / Category
const PRESET_PACKAGES: Record<string, { name: string; monthlyValue: number; items: { deliverable_name: string; committed_qty: number }[] }[]> = {
  'SEO': [
    {
      name: 'SEO Starter Package',
      monthlyValue: 35000,
      items: [
        { deliverable_name: 'SEO Keyword Strategy & Cluster Research', committed_qty: 1 },
        { deliverable_name: 'On-Page SEO Optimized Articles / Blogs', committed_qty: 4 },
        { deliverable_name: 'Monthly Technical Audit & Fixes', committed_qty: 1 },
        { deliverable_name: 'Google Search Console & Analytics Report', committed_qty: 1 }
      ]
    },
    {
      name: 'SEO Growth Suite',
      monthlyValue: 65000,
      items: [
        { deliverable_name: 'On-Page SEO Optimized Articles / Blogs', committed_qty: 8 },
        { deliverable_name: 'High DA Backlinks & Off-Page Links', committed_qty: 5 },
        { deliverable_name: 'Technical SEO & Page Speed Audit', committed_qty: 1 },
        { deliverable_name: 'Local SEO & GMB Profile Optimization', committed_qty: 1 },
        { deliverable_name: 'Monthly Keyword Ranking Report', committed_qty: 1 }
      ]
    }
  ],
  'Social Media': [
    {
      name: 'Social Media Starter',
      monthlyValue: 40000,
      items: [
        { deliverable_name: 'Instagram / FB Reels (Editing & Posting)', committed_qty: 8 },
        { deliverable_name: 'Carousel & Static Grid Posts', committed_qty: 6 },
        { deliverable_name: 'Instagram Stories & Engagement', committed_qty: 15 },
        { deliverable_name: 'Monthly Social Performance Report', committed_qty: 1 }
      ]
    },
    {
      name: 'Social Dominance Package',
      monthlyValue: 85000,
      items: [
        { deliverable_name: 'Short Form Reels (Scripting, Editing, Audio)', committed_qty: 15 },
        { deliverable_name: 'Carousel Posts & Graphic Creatives', committed_qty: 10 },
        { deliverable_name: 'Daily Instagram Stories & Community Management', committed_qty: 30 },
        { deliverable_name: 'Influencer Collaboration Outreach', committed_qty: 2 }
      ]
    }
  ],
  'Paid Media': [
    {
      name: 'Meta Ads Core',
      monthlyValue: 45000,
      items: [
        { deliverable_name: 'Meta Ads Campaign Setup & Management', committed_qty: 1 },
        { deliverable_name: 'High-Converting Ad Creatives & Copies', committed_qty: 6 },
        { deliverable_name: 'Audience Targeting & Retargeting Setup', committed_qty: 2 },
        { deliverable_name: 'ROAS & Ad Spend Analytics Report', committed_qty: 1 }
      ]
    },
    {
      name: 'Omnichannel Performance Ads',
      monthlyValue: 90000,
      items: [
        { deliverable_name: 'Meta (FB & IG) Performance Ads Management', committed_qty: 1 },
        { deliverable_name: 'Google PPC & Search / Shopping Ads', committed_qty: 1 },
        { deliverable_name: 'High-Converting Ad Creatives & Video Ads', committed_qty: 12 },
        { deliverable_name: 'Landing Page Conversion Audit', committed_qty: 1 }
      ]
    }
  ],
  'Website': [
    {
      name: 'Website Care & CRO',
      monthlyValue: 30000,
      items: [
        { deliverable_name: 'Landing Page Updates & Banner Designs', committed_qty: 4 },
        { deliverable_name: 'Website Speed Optimization & Security Scans', committed_qty: 1 },
        { deliverable_name: 'Conversion Rate Optimization (CRO) Tweaks', committed_qty: 2 }
      ]
    }
  ],
  'Full Retainer': [
    {
      name: '360° Digital Growth Suite',
      monthlyValue: 150000,
      items: [
        { deliverable_name: 'Short Form Reels (Editing & Posting)', committed_qty: 12 },
        { deliverable_name: 'SEO Optimized Articles / Blogs', committed_qty: 6 },
        { deliverable_name: 'Meta & Google Ads Campaign Management', committed_qty: 2 },
        { deliverable_name: 'Technical SEO & Website Maintenance', committed_qty: 1 },
        { deliverable_name: 'Weekly Performance Sync & Monthly Executive Report', committed_qty: 4 }
      ]
    }
  ]
};

export default function DraftSowTab() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [clients, setClients] = useState<{id: string, company_name: string, brand_name?: string}[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  
  const [formData, setFormData] = useState({
    sow_name: '',
    start_date: '',
    end_date: ''
  });
  
  const [activeCategory, setActiveCategory] = useState<string>('SEO');
  const [sowMonths, setSowMonths] = useState<{ month_year: string, value: string, items: { deliverable_name: string, committed_qty: number }[] }[]>([]);
  
  // Custom templates stored in localStorage
  const [customPackages, setCustomPackages] = useState<Record<string, { name: string; monthlyValue: number; items: { deliverable_name: string; committed_qty: number }[] }[]>>({});
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateValue, setNewTemplateValue] = useState('');
  
  const totalValue = sowMonths.reduce((acc, month) => acc + (parseFloat(month.value) || 0), 0);
  const [user, setUser] = useState<any>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetch((process.env.NEXT_PUBLIC_API_URL || 'https://rds-backend-nexus.onrender.com') + '/api/clients?activeOnly=true')
      .then(res => res.json())
      .then(data => { if(data && data.data) setClients(data.data); });

    // Load custom packages from localStorage
    const saved = localStorage.getItem('custom_sow_packages');
    if (saved) {
      try { setCustomPackages(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // Generate monthly blocks when dates change
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      let start = new Date(formData.start_date);
      let end = new Date(formData.end_date);
      
      if (start <= end) {
        let current = new Date(start.getFullYear(), start.getMonth(), 1);
        let newMonths = [];
        while (current <= end) {
          const monthStr = current.toLocaleString('en-US', { month: 'long', year: 'numeric' });
          const existing = sowMonths.find(m => m.month_year === monthStr);
          newMonths.push(existing || { month_year: monthStr, value: '', items: [{ deliverable_name: '', committed_qty: 1 }] });
          current.setMonth(current.getMonth() + 1);
        }
        setSowMonths(newMonths);
      }
    }
  }, [formData.start_date, formData.end_date]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectClient = (id: string) => {
    if (selectedClientIds.includes(id)) {
      setSelectedClientIds(selectedClientIds.filter(cId => cId !== id));
    } else {
      setSelectedClientIds([...selectedClientIds, id]);
    }
  };

  const handleSelectAllClients = () => {
    if (selectedClientIds.length === clients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(clients.map(c => c.id));
    }
  };

  // Apply a pre-configured Package Template (supports combining multiple department packages)
  const applyPackageTemplate = (
    pkg: { name: string; monthlyValue: number; items: { deliverable_name: string; committed_qty: number }[] },
    mode: 'add' | 'replace' = 'add'
  ) => {
    if (sowMonths.length === 0) {
      alert('Please select a Start Date and End Date first to generate monthly blocks.');
      return;
    }

    const updatedMonths = sowMonths.map(m => {
      const newItems = pkg.items.map(i => ({ deliverable_name: i.deliverable_name, committed_qty: i.committed_qty }));

      if (mode === 'add') {
        const existingItems = m.items.filter(i => i.deliverable_name.trim() !== '');
        const combinedItems = [...existingItems, ...newItems];
        const currentVal = parseFloat(m.value) || 0;
        const combinedValue = currentVal + pkg.monthlyValue;
        return {
          ...m,
          value: combinedValue.toString(),
          items: combinedItems
        };
      } else {
        return {
          ...m,
          value: pkg.monthlyValue.toString(),
          items: newItems
        };
      }
    });

    setSowMonths(updatedMonths);
  };

  // 1-Click "Copy Month 1 to All Months"
  const copyMonth1ToAll = () => {
    if (sowMonths.length < 2) return;
    const month1 = sowMonths[0];
    const updated = sowMonths.map((m, idx) => {
      if (idx === 0) return m;
      return {
        ...m,
        value: month1.value,
        items: month1.items.map(i => ({ deliverable_name: i.deliverable_name, committed_qty: i.committed_qty }))
      };
    });
    setSowMonths(updated);
  };

  const handleMonthValueChange = (index: number, value: string) => {
    const newMonths = [...sowMonths];
    newMonths[index].value = value;
    setSowMonths(newMonths);
  };

  const handleItemChange = (monthIndex: number, itemIndex: number, field: 'deliverable_name' | 'committed_qty', value: any) => {
    const newMonths = [...sowMonths];
    newMonths[monthIndex].items[itemIndex] = {
      ...newMonths[monthIndex].items[itemIndex],
      [field]: value
    };
    setSowMonths(newMonths);
  };

  const addItem = (monthIndex: number) => {
    const newMonths = [...sowMonths];
    newMonths[monthIndex].items.push({ deliverable_name: '', committed_qty: 1 });
    setSowMonths(newMonths);
  };

  const removeItem = (monthIndex: number, itemIndex: number) => {
    const newMonths = [...sowMonths];
    newMonths[monthIndex].items = newMonths[monthIndex].items.filter((_, i) => i !== itemIndex);
    setSowMonths(newMonths);
  };

  // Save current Month 1 deliverables as a custom Package Template
  const saveAsCustomPackage = () => {
    if (sowMonths.length === 0 || !newTemplateName.trim()) {
      alert('Please enter a package name and ensure Month 1 has deliverables.');
      return;
    }
    const month1 = sowMonths[0];
    const newPkg = {
      name: newTemplateName.trim(),
      monthlyValue: parseFloat(newTemplateValue || month1.value) || 0,
      items: month1.items.filter(i => i.deliverable_name.trim() !== '')
    };

    const currentCatPackages = customPackages[activeCategory] || [];
    const updatedCustom = {
      ...customPackages,
      [activeCategory]: [...currentCatPackages, newPkg]
    };

    setCustomPackages(updatedCustom);
    localStorage.setItem('custom_sow_packages', JSON.stringify(updatedCustom));
    setIsTemplateModalOpen(false);
    setNewTemplateName('');
    setNewTemplateValue('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClientIds.length === 0) {
      alert('Please select at least one Client (Brand).');
      return;
    }

    try {
      const payload = {
        client_ids: selectedClientIds,
        sow_name: formData.sow_name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_value: totalValue,
        months: sowMonths.map(m => ({
          ...m,
          items: m.items.filter(i => i.deliverable_name.trim() !== '')
        }))
      };

      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://rds-backend-nexus.onrender.com') + '/api/sows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        alert(`SOW Created and Submitted for ${selectedClientIds.length} Brand(s)!`);
        setFormData({ sow_name: '', start_date: '', end_date: '' });
        setSelectedClientIds([]);
        setSowMonths([]);
      } else {
        alert('Failed to save SOW.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to backend server.');
    }
  };

  const categories = ['SEO', 'Social Media', 'Paid Media', 'Website', 'Full Retainer'];
  const currentPresets = [...(PRESET_PACKAGES[activeCategory] || []), ...(customPackages[activeCategory] || [])];

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8">
      {/* Header Info */}
      <div className="border-b border-slate-100 pb-5 flex justify-between items-start">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" /> Draft SOW (Package Templates & Batch Creation)
          </h2>
          <p className="text-xs text-slate-500 mt-1">Select retainer packages, apply to multiple brands, and replicate across months instantly.</p>
        </div>
      </div>

      <div className="space-y-6 text-sm">
        {/* Form Main Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">SOW Title</label>
            <input 
              type="text" 
              name="sow_name"
              required
              value={formData.sow_name}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. 2026 Q3 Digital Retainer"
              onChange={handleChange}
            />
          </div>

          {/* Multi-Brand Select Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Select Brands ({selectedClientIds.length} selected)
            </label>
            <div 
              onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-white cursor-pointer flex justify-between items-center hover:border-indigo-400 transition-colors shadow-sm"
            >
              <span className="text-slate-800 truncate text-sm">
                {selectedClientIds.length === 0 
                  ? 'Choose Brand(s)...' 
                  : clients.filter(c => selectedClientIds.includes(c.id)).map(c => c.brand_name || c.company_name).join(', ')}
              </span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 flex-shrink-0 ml-2">
                {selectedClientIds.length}/{clients.length}
              </span>
            </div>

            {/* Selected Brand Badges */}
            {selectedClientIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {clients.filter(c => selectedClientIds.includes(c.id)).map(c => (
                  <span 
                    key={c.id}
                    className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full border border-indigo-200 font-medium"
                  >
                    {c.brand_name || c.company_name}
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectClient(c.id);
                      }}
                      className="hover:text-indigo-900 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {isClientDropdownOpen && (
              <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 space-y-1">
                {/* Search Bar inside dropdown */}
                <div className="p-1 border-b border-slate-100 mb-1 flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400 ml-1" />
                  <input 
                    type="text"
                    placeholder="Search brand name..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full text-xs p-1.5 focus:outline-none text-slate-800"
                  />
                  {brandSearch && (
                    <button type="button" onClick={() => setBrandSearch('')} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1">
                  <div 
                    onClick={handleSelectAllClients} 
                    className="p-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer flex items-center justify-between border-b border-slate-100"
                  >
                    <span>Select All Brands</span>
                    {selectedClientIds.length === clients.length && <Check className="w-4 h-4" />}
                  </div>

                  {clients
                    .filter(c => {
                      const name = (c.brand_name || c.company_name).toLowerCase();
                      return name.includes(brandSearch.toLowerCase());
                    })
                    .map(c => {
                      const isSelected = selectedClientIds.includes(c.id);
                      return (
                        <div 
                          key={c.id}
                          onClick={() => handleSelectClient(c.id)}
                          className={`p-2 text-xs rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span>{c.brand_name || c.company_name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </div>
                      );
                    })}
                </div>

                {/* Done / Apply Button to close dropdown */}
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsClientDropdownOpen(false)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 rounded-lg transition-colors"
                  >
                    Done Selecting ({selectedClientIds.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Start Date</label>
            <input 
              type="date" 
              name="start_date"
              required
              value={formData.start_date}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">End Date</label>
            <input 
              type="date" 
              name="end_date"
              required
              value={formData.end_date}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Total Value (₹)</label>
            <input 
              type="text" 
              value={`₹ ${totalValue.toLocaleString()}`}
              readOnly
              className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-bold text-slate-900 outline-none cursor-not-allowed"
            />
          </div>
        </div>

        {/* PACKAGE TEMPLATES SECTION */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Select Retainer Package Template
              </h3>
              <p className="text-xs text-slate-500">Pick a pre-configured package to auto-fill deliverables and pricing across months.</p>
            </div>
            
            {sowMonths.length > 0 && (
              <button 
                type="button" 
                onClick={() => setIsTemplateModalOpen(true)}
                className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Save Month 1 as Custom Package
              </button>
            )}
          </div>

          {/* Department Tabs */}
          <div className="flex border-b border-slate-200 gap-4 overflow-x-auto">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`py-2 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                  activeCategory === cat ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Package Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPresets.map((pkg, i) => (
              <div 
                key={i} 
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 text-sm">{pkg.name}</h4>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      ₹{pkg.monthlyValue.toLocaleString()}/mo
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {pkg.items.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {item.committed_qty}
                        </span>
                        <span className="truncate">{item.deliverable_name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => applyPackageTemplate(pkg, 'add')}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Combine / Add to SOW
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPackageTemplate(pkg, 'replace')}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                    title="Replace current scope with this single package"
                  >
                    Replace
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MONTHLY DELIVERABLES EDITOR */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Monthly Scope & Deliverables</h3>
              <p className="text-xs text-slate-500">Fine-tune deliverable names and quantities for each month.</p>
            </div>
            
            {sowMonths.length > 1 && (
              <button 
                type="button" 
                onClick={copyMonth1ToAll}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" /> ⚡ Apply Month 1 Scope to All Months
              </button>
            )}
          </div>
          
          {sowMonths.length === 0 ? (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Please select a <b>Start Date</b> and <b>End Date</b> above to generate monthly contract blocks.
            </div>
          ) : (
            <div className="space-y-6">
              {sowMonths.map((month, monthIndex) => (
                <div key={month.month_year} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      {month.month_year}
                    </h4>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-600">Monthly Fee (₹):</label>
                      <input 
                        type="number" 
                        value={month.value}
                        onChange={(e) => handleMonthValueChange(monthIndex, e.target.value)}
                        className="w-32 border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 bg-white"
                        placeholder="e.g. 50000"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2.5">
                    {month.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex gap-3 items-center">
                        <div className="w-24 shrink-0">
                          <input 
                            type="number"
                            min="1"
                            placeholder="Qty"
                            className="w-full border border-slate-300 rounded-lg p-2 text-xs text-center font-bold outline-none focus:border-indigo-500 bg-white"
                            value={item.committed_qty}
                            onChange={(e) => handleItemChange(monthIndex, itemIndex, 'committed_qty', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder={`Deliverable item name for ${month.month_year}`}
                            className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white font-medium"
                            value={item.deliverable_name}
                            onChange={(e) => handleItemChange(monthIndex, itemIndex, 'deliverable_name', e.target.value)}
                          />
                        </div>
                        {month.items.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeItem(monthIndex, itemIndex)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => addItem(monthIndex)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mt-2 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Deliverable Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Button Bar */}
      <div className="mt-8 pt-5 border-t border-slate-100 flex justify-between items-center">
        <span className="text-xs text-slate-500">
          Will generate {selectedClientIds.length || 0} contract(s) across {sowMonths.length} month(s).
        </span>
        <button 
          type="submit" 
          className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors"
        >
          Submit SOW Contracts for Approval
        </button>
      </div>

      {/* CUSTOM TEMPLATE MODAL */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Save Custom Package Template</h3>
              <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Saves Month 1 deliverables ({sowMonths[0]?.items.length || 0} items) under <b>{activeCategory}</b>.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Package Name</label>
                <input 
                  type="text" 
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. Premium Brand Growth" 
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Value (₹)</label>
                <input 
                  type="number" 
                  value={newTemplateValue}
                  onChange={(e) => setNewTemplateValue(e.target.value)}
                  placeholder={sowMonths[0]?.value || '50000'} 
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setIsTemplateModalOpen(false)} 
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={saveAsCustomPackage} 
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Save Package
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
