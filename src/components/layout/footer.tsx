import { SITE_CONFIG } from '@/constants';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">&copy; {new Date().getFullYear()} {SITE_CONFIG.name}</p>
            <p>{SITE_CONFIG.description}</p>
          </div>
          <div className="flex items-center space-x-6 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href={SITE_CONFIG.links.github} className="hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
