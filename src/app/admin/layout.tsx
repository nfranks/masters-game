'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Layers,
  ShieldCheck,
  ClipboardList,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/golfers', label: 'Golfers', icon: Users },
  { href: '/admin/groups', label: 'Groups', icon: Layers },
  { href: '/admin/rules', label: 'Rules', icon: ShieldCheck },
  { href: '/admin/entries', label: 'Entries', icon: ClipboardList },
  { href: '/admin/scoring', label: 'Scoring', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-masters-dark text-white flex flex-col">
        <div className="p-6">
          <Link href="/" className="text-xl font-bold text-masters-gold">
            Masters Pool
          </Link>
          <p className="text-white/50 text-xs mt-1">Admin Dashboard</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-masters-green text-white'
                    : 'text-white/70 hover:bg-masters-green hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-white/50 hover:bg-masters-green hover:text-white w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
