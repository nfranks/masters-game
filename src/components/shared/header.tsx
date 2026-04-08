'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-masters-green border-b-4 border-masters-gold">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl sm:text-2xl font-semibold text-white tracking-wide">
          Masters Madness
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex gap-8 text-sm font-medium uppercase tracking-widest">
          <Link href="/enter" className="text-white/80 hover:text-masters-gold transition-colors">
            Enter
          </Link>
          <Link href="/my-team" className="text-white/80 hover:text-masters-gold transition-colors">
            My Team
          </Link>
          <Link href="/leaderboard" className="text-white/80 hover:text-masters-gold transition-colors">
            Leaderboard
          </Link>
          <Link href="/daily" className="text-white/80 hover:text-masters-gold transition-colors">
            Daily
          </Link>
          <Link href="/venmo" className="text-white/80 hover:text-masters-gold transition-colors">
            Venmo
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden text-white p-1"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="sm:hidden border-t border-white/20 px-4 py-3 flex flex-col gap-3">
          <Link
            href="/enter"
            className="text-white/90 text-sm font-medium uppercase tracking-widest py-2"
            onClick={() => setMenuOpen(false)}
          >
            Enter Your Team
          </Link>
          <Link
            href="/my-team"
            className="text-white/90 text-sm font-medium uppercase tracking-widest py-2"
            onClick={() => setMenuOpen(false)}
          >
            My Team
          </Link>
          <Link
            href="/leaderboard"
            className="text-white/90 text-sm font-medium uppercase tracking-widest py-2"
            onClick={() => setMenuOpen(false)}
          >
            Leaderboard
          </Link>
          <Link
            href="/daily"
            className="text-white/90 text-sm font-medium uppercase tracking-widest py-2"
            onClick={() => setMenuOpen(false)}
          >
            Daily Winners
          </Link>
          <Link
            href="/venmo"
            className="text-white/90 text-sm font-medium uppercase tracking-widest py-2"
            onClick={() => setMenuOpen(false)}
          >
            Venmo
          </Link>
        </nav>
      )}
    </header>
  );
}
