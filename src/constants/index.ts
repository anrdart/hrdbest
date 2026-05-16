export const SITE_CONFIG = {
  name: 'Portal',
  description: 'Sistem Presensi Modern Mediapro Digital Creative Limited',
  url: 'https://hrdbest.ekalliptus.com',
  ogImage: 'https://hrdbest.ekalliptus.com/og.jpg',
  links: {
    github: 'https://github.com/anrdart/hrdbest',
  },
} as const;

export type SiteConfig = typeof SITE_CONFIG;
