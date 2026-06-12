import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-8 text-center text-blue-400">RDS Admin</h1>
      
      <nav className="flex-1">
        <ul className="space-y-4">
          <li>
            <Link href="/" className="block p-2 rounded hover:bg-gray-800 transition">
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/clients" className="block p-2 rounded hover:bg-gray-800 transition">
              Clients Master
            </Link>
          </li>
          <li>
            <Link href="/tasks" className="block p-2 rounded hover:bg-gray-800 transition">
              Tasks
            </Link>
          </li>
          <li>
            <Link href="/communications" className="block p-2 rounded hover:bg-gray-800 transition">
              Communications
            </Link>
          </li>
          <li>
            <Link href="/meetings" className="block p-2 rounded hover:bg-gray-800 transition">
              MOM / Meetings
            </Link>
          </li>
          <li>
            <Link href="/reports" className="block p-2 rounded hover:bg-gray-800 transition">
              Reports
            </Link>
          </li>
        </ul>
      </nav>

      <div className="mt-auto">
        <button className="w-full bg-red-600 hover:bg-red-700 p-2 rounded transition">
          Logout
        </button>
      </div>
    </aside>
  );
}
