import { SITE_CONFIG } from '../constants';

export type SiteConfig = typeof SITE_CONFIG;

export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
}

export interface MainNavItem extends NavItem {}
