const fs = require('fs');
let leaves = fs.readFileSync('frontend/src/app/(admin)/leaves/page.tsx', 'utf8');
leaves = leaves.replace('export default function LeavesPage', 'export default function LeavesComponent');
// Remove the outer header
leaves = leaves.replace(/<div className="flex justify-between items-center mb-8">[\s\S]*?<\/div>\s*<div className="mb-6 border-b border-slate-200">/, '<div className="mb-6 border-b border-slate-200 flex justify-between items-center"><div className="flex-1"></div><button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">Apply for Leave</button></div><div className="mb-6 border-b border-slate-200">');
fs.writeFileSync('frontend/src/app/(admin)/attendance/components/LeavesComponent.tsx', leaves);

let attendance = fs.readFileSync('frontend/src/app/(admin)/attendance/page.tsx', 'utf8');
// add third tab
attendance = attendance.replace(/<button\s+onClick=\{\(\) => setActiveTab\('history'\)\}[\s\S]*?History\s+<\/button>/, "$&\n        <button onClick={() => setActiveTab('leaves')} className={py-2 px-4 border-b-2 font-medium text-sm transition-colors }>Leave Management</button>");
attendance = attendance.replace(/import \{ useState, useEffect \} from 'react';/, "import { useState, useEffect } from 'react';\nimport LeavesComponent from './components/LeavesComponent';");
// add type to activeTab
attendance = attendance.replace(/useState\<'today' \| 'history'\>/, "useState<'today' | 'history' | 'leaves'>");
// add leaves component at the bottom
attendance = attendance.replace(/<\/div>\s*\)\;\s*\}\s*$/, "      {activeTab === 'leaves' && <LeavesComponent />}\n    </div>\n  );\n}\n");
fs.writeFileSync('frontend/src/app/(admin)/attendance/page.tsx', attendance);
