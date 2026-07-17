'use client';

interface ClientTabsProps {
  activeTab: string;
  setActiveTab: (tab: 'overview' | 'onboarding' | 'socials' | 'campaigns' | 'timeline' | 'monthly_plans' | 'ai_calendar') => void;
}

export default function ClientTabs({ activeTab, setActiveTab }: ClientTabsProps) {
  return (
    <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 flex flex-wrap space-x-1.5 mb-6 max-w-3xl">
      <button
        onClick={() => setActiveTab('overview')}
        className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${
          activeTab === 'overview'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        Overview & Contacts
      </button>
      <button
        onClick={() => setActiveTab('onboarding')}
        className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${
          activeTab === 'onboarding'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        Onboarding Checklist
      </button>
      <button
        onClick={() => setActiveTab('socials')}
        className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${
          activeTab === 'socials'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        Access Vaults
      </button>
      <button
        onClick={() => setActiveTab('campaigns')}
        className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${
          activeTab === 'campaigns'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        Campaigns
      </button>
      <button
        onClick={() => setActiveTab('timeline')}
        className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${
          activeTab === 'timeline'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        Activity Timeline
      </button>
      <button
        onClick={() => setActiveTab('monthly_plans')}
        className={`flex-1 py-2 px-3 text-center text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 outline-none cursor-pointer ${
          activeTab === 'monthly_plans'
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
  );
}
