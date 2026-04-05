import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-green-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          NME Masters Pool
        </Link>
        <nav className="flex gap-6 text-sm font-medium">
          <Link href="/enter" className="hover:text-yellow-300 transition-colors">
            Enter Team
          </Link>
          <Link href="/leaderboard" className="hover:text-yellow-300 transition-colors">
            Leaderboard
          </Link>
          <Link href="/daily" className="hover:text-yellow-300 transition-colors">
            Daily Winners
          </Link>
        </nav>
      </div>
    </header>
  );
}
