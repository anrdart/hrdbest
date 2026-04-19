export const SITE_CONFIG = {
  name: 'Portal',
  description: 'Sistem Presensi Modern untuk PCF',
  url: 'https://presensipcf.com',
  ogImage: 'https://presensipcf.com/og.jpg',
  links: {
    github: 'https://github.com/presensipcf',
  },
} as const;

export type SiteConfig = typeof SITE_CONFIG;
