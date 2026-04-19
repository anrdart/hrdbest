import Link from 'next/link';
import { SITE_CONFIG } from '@/constants';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm transition-all duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="inline-block h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-lg group-hover:scale-110 transition-transform duration-300" />
            <span className="font-bold text-xl tracking-tight text-foreground">{SITE_CONFIG.name}</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <Link href="/dashboard" className="transition-colors hover:text-primary text-muted-foreground">Dashboard</Link>
          <Link href="/presence" className="transition-colors hover:text-primary text-muted-foreground">Presensi</Link>
          <Link href="/reports" className="transition-colors hover:text-primary text-muted-foreground">Laporan</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95">
            Masuk
          </button>
        </div>
      </div>
    </header>
  );
}
