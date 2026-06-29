const fs = require('fs');

const themes = [
  { name: '1. Modern Minimal', mainClass: 'bg-slate-50 border border-slate-200 shadow-sm', sidebarClass: 'bg-white border-r border-slate-200 text-slate-500', cardClass: 'bg-white border border-slate-100 shadow-sm rounded', textPrimary: 'text-slate-800', textSecondary: 'text-slate-400', accent: 'text-indigo-500' },
  { name: '2. Soft Glassmorphism', mainClass: 'mesh-bg', sidebarClass: 'glass border-r border-white/30 text-slate-800', cardClass: 'glass rounded shadow-lg', textPrimary: 'text-slate-900', textSecondary: 'text-slate-600', accent: 'text-indigo-600' },
  { name: '3. Dark Mode Neon', mainClass: 'bg-slate-900 text-white', sidebarClass: 'bg-slate-800 border-r border-slate-700 text-slate-400', cardClass: 'bg-slate-800 border border-indigo-500/30 rounded shadow-[0_0_10px_rgba(99,102,241,0.2)]', textPrimary: 'text-white', textSecondary: 'text-slate-400', accent: 'text-indigo-400' },
  { name: '4. Neo-Brutalism', mainClass: 'bg-yellow-200 border-4 border-black shadow-[4px_4px_0px_#000]', sidebarClass: 'bg-white border-r-4 border-black text-black font-black', cardClass: 'bg-pink-400 border-2 border-black shadow-[2px_2px_0px_#000] rounded-none', textPrimary: 'text-black', textSecondary: 'text-black font-bold', accent: 'text-black' },
  { name: '5. Claymorphism', mainClass: 'bg-[#e0e5ec]', sidebarClass: 'bg-transparent text-slate-500 font-bold', cardClass: 'claymorphism rounded-xl', textPrimary: 'text-slate-700', textSecondary: 'text-slate-500', accent: 'text-indigo-500' },
  { name: '6. Dark Aurora', mainClass: 'bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-900 text-white', sidebarClass: 'glass-dark border-r border-white/10 text-slate-300', cardClass: 'glass-dark rounded-xl border border-white/10', textPrimary: 'text-white', textSecondary: 'text-slate-400', accent: 'text-emerald-400' },
  { name: '7. Corporate Clean', mainClass: 'bg-slate-100', sidebarClass: 'bg-slate-900 text-slate-400', cardClass: 'bg-white border-t-2 border-blue-600 shadow-sm rounded-sm', textPrimary: 'text-slate-800', textSecondary: 'text-slate-500', accent: 'text-blue-600' },
  { name: '8. Soft Pastel', mainClass: 'bg-amber-50', sidebarClass: 'bg-rose-50 border-r border-rose-100 text-rose-400', cardClass: 'bg-white rounded-3xl shadow-sm border border-white', textPrimary: 'text-slate-700', textSecondary: 'text-slate-400', accent: 'text-rose-400' },
  { name: '9. Cyberpunk', mainClass: 'bg-black border-2 border-yellow-400 text-yellow-400', sidebarClass: 'bg-slate-900 border-r-2 border-pink-500 text-pink-500', cardClass: 'bg-black border border-cyan-400 shadow-[0_0_8px_#22d3ee_inset] rounded-none', textPrimary: 'text-yellow-400', textSecondary: 'text-cyan-400', accent: 'text-pink-500' },
  { name: '10. Ocean Blue', mainClass: 'bg-sky-50', sidebarClass: 'bg-blue-900 text-sky-200', cardClass: 'bg-white border border-sky-100 shadow-[0_4px_15px_-5px_rgba(14,165,233,0.1)] rounded-lg', textPrimary: 'text-blue-900', textSecondary: 'text-sky-600', accent: 'text-sky-500' },
  { name: '11. Sunset Gradient', mainClass: 'bg-orange-50', sidebarClass: 'bg-gradient-to-b from-orange-500 to-pink-500 text-white', cardClass: 'bg-white shadow-md border-0 rounded-xl', textPrimary: 'text-slate-800', textSecondary: 'text-slate-400', accent: 'text-pink-500' },
  { name: '12. Sci-Fi Panel', mainClass: 'bg-[#0b0f19] text-cyan-400', sidebarClass: 'bg-slate-900 border-r border-cyan-500/50 text-cyan-600', cardClass: 'bg-slate-900 border border-cyan-500/50 shadow-[0_0_10px_#22d3ee_inset] rounded-none', textPrimary: 'text-cyan-300', textSecondary: 'text-cyan-600', accent: 'text-cyan-400' },
  { name: '13. Wireframe', mainClass: 'bg-white border border-slate-300', sidebarClass: 'bg-white border-r border-slate-300 border-dashed text-slate-500', cardClass: 'bg-transparent border-2 border-slate-300 border-dashed rounded-none', textPrimary: 'text-slate-800', textSecondary: 'text-slate-500', accent: 'text-slate-800' },
  { name: '14. Luxury Gold', mainClass: 'bg-zinc-950 text-amber-500', sidebarClass: 'bg-zinc-900 border-r border-amber-500/20 text-amber-600', cardClass: 'bg-zinc-900 border border-amber-500/30 rounded-lg', textPrimary: 'text-amber-400', textSecondary: 'text-amber-600', accent: 'text-amber-500' },
  { name: '15. Material Classic', mainClass: 'bg-gray-100', sidebarClass: 'bg-white shadow-[2px_0_5px_rgba(0,0,0,0.1)] z-10 text-gray-600', cardClass: 'bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] rounded-sm', textPrimary: 'text-gray-900', textSecondary: 'text-gray-500', accent: 'text-purple-600' },
  { name: '16. Pure Monochrome', mainClass: 'bg-gray-50 border border-gray-200', sidebarClass: 'bg-white border-r border-gray-200 text-gray-500', cardClass: 'bg-white border border-gray-200 rounded-none', textPrimary: 'text-black', textSecondary: 'text-gray-500', accent: 'text-black' },
  { name: '17. High Contrast', mainClass: 'bg-black text-white', sidebarClass: 'bg-black border-r border-white text-gray-400', cardClass: 'bg-lime-400 border border-black rounded-none text-black', textPrimary: 'text-black', textSecondary: 'text-black font-bold', accent: 'text-black' },
  { name: '18. Eco Green', mainClass: 'bg-stone-50', sidebarClass: 'bg-emerald-900 text-emerald-100', cardClass: 'bg-white border-b-4 border-emerald-500 shadow-sm rounded-lg', textPrimary: 'text-emerald-900', textSecondary: 'text-emerald-600', accent: 'text-emerald-500' },
  { name: '19. Floating Cards', mainClass: 'bg-slate-100 p-2', sidebarClass: 'bg-white shadow-sm border border-slate-200/50 rounded-xl mr-2 text-slate-500', cardClass: 'bg-white shadow-sm rounded-xl border border-slate-200/50', textPrimary: 'text-slate-800', textSecondary: 'text-slate-400', accent: 'text-indigo-500' },
  { name: '20. Playful Pop', mainClass: 'bg-indigo-50', sidebarClass: 'bg-white rounded-r-[30px] shadow-sm text-indigo-400', cardClass: 'bg-rose-400 text-white rounded-[20px] shadow-md border-0', textPrimary: 'text-white', textSecondary: 'text-rose-100', accent: 'text-white' }
];

let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dashboard Design Showcase - Realistic Content</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .glass { background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); }
    .glass-dark { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
    .claymorphism { background: #e0e5ec; box-shadow: 6px 6px 12px rgba(163,177,198,0.6), -6px -6px 12px rgba(255,255,255, 0.5); }
    .mesh-bg { background-color: #ff99f0; background-image: radial-gradient(at 40% 20%, #ff8c42 0px, transparent 50%), radial-gradient(at 80% 0%, #00f0ff 0px, transparent 50%), radial-gradient(at 0% 50%, #ff00c8 0px, transparent 50%); }
    .showcase-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem; padding: 2rem; }
    .mini-dash { width: 100%; height: 260px; overflow: hidden; display: flex; position: relative; transition: transform 0.3s; cursor: pointer; border-radius: 12px; font-size: 9px; line-height: 1.4; }
    .mini-dash:hover { transform: scale(1.03); z-index: 10; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
  </style>
</head>
<body class="bg-slate-100 text-slate-800 font-sans">
  <div class="max-w-[1600px] mx-auto py-10 px-5">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-extrabold text-slate-900 mb-4">Dashboard Aesthetic Options</h1>
      <p class="text-slate-600 max-w-2xl mx-auto">Updated with realistic content. Whichever option you choose will be applied globally across the entire project (sidebars, tables, modals, cards).</p>
    </div>
    <div class="showcase-grid">
`;

themes.forEach(t => {
  html += `
      <div>
        <h3 class="font-bold text-lg mb-2 text-slate-800">${t.name}</h3>
        <div class="mini-dash ${t.mainClass}">
          <div class="w-1/4 p-3 flex flex-col gap-3 ${t.sidebarClass}">
             <div class="text-[12px] font-black uppercase tracking-wider mb-2 ${t.accent}">Nexus</div>
             <div class="font-bold flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-current opacity-50"></span> Dashboard</div>
             <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-current opacity-50"></span> Clients</div>
             <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-current opacity-50"></span> Tasks</div>
             <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-current opacity-50"></span> SOWs</div>
          </div>
          <div class="w-3/4 p-3 flex flex-col gap-3">
             <div class="flex justify-between items-center">
               <div class="text-[11px] font-bold ${t.textPrimary}">Welcome back, Gowtham!</div>
               <div class="w-4 h-4 rounded-full ${t.cardClass}"></div>
             </div>
             
             <div class="flex gap-2">
               <div class="flex-1 p-2 flex flex-col justify-center ${t.cardClass}">
                 <div class="${t.textSecondary}">Active Clients</div>
                 <div class="text-lg font-bold ${t.textPrimary}">24</div>
               </div>
               <div class="flex-1 p-2 flex flex-col justify-center ${t.cardClass}">
                 <div class="${t.textSecondary}">Pending Tasks</div>
                 <div class="text-lg font-bold ${t.textPrimary}">7</div>
               </div>
             </div>
             
             <div class="flex-1 p-3 flex flex-col ${t.cardClass}">
                <div class="font-bold mb-2 ${t.textPrimary}">Recent Escalations</div>
                <div class="flex justify-between border-b border-current/10 pb-1.5 mb-1.5">
                  <span class="${t.textPrimary}">Client UI Bug</span>
                  <span class="font-bold ${t.accent}">Open</span>
                </div>
                <div class="flex justify-between">
                  <span class="${t.textPrimary}">SEO Metrics Drop</span>
                  <span class="font-bold opacity-70 ${t.textSecondary}">Resolved</span>
                </div>
             </div>
          </div>
        </div>
      </div>
  `;
});

html += `
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync('c:/Users/Gowtham/Desktop/RDS Dashboard/dashboard_showcase.html', html);
console.log('Done generating dashboard_showcase.html');
