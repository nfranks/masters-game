import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-masters-green border-b-4 border-masters-gold">
      <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl font-semibold text-white tracking-wide">
          NME Masters Pool
        </Link>
        <nav className="flex gap-8 text-sm font-medium uppercase tracking-widest">
          <Link href="/enter" className="text-white/80 hover:text-masters-gold transition-colors">
            Enter
          </Link>
          <Link href="/leaderboard" className="text-white/80 hover:text-masters-gold transition-colors">
            Leaderboard
          </Link>
          <Link href="/daily" className="text-white/80 hover:text-masters-gold transition-colors">
            Daily
          </Link>
        </nav>
      </div>
    </header>
  );
}
