/**
 * Church-specific branding: logos and personalization per parish.
 * Add entries here to customize the app when users select a given parish.
 */

export type ChurchBranding = {
  /** Logo image path (from /public) */
  logoPath: string;
  /** Alt text for the logo */
  logoAlt: string;
  /** Optional: custom app title when this parish is selected */
  appTitle?: string;
};

/** Parish name substrings (case-insensitive) mapped to branding. */
const CHURCH_BRANDING: Record<string, ChurchBranding> = {
  'holy family': {
    logoPath: '/images/holy-family-church-logo.png',
    logoAlt: 'Holy Family Catholic Church, Life Camp - Abuja',
    appTitle: 'Holy Family Catholic Church, Abuja Parish Registry',
  },
  'church of the assumption': {
    logoPath: '/images/assumption-church-logo.png',
    logoAlt: 'Church of The Assumption, Abuja',
    appTitle: 'Church of The Assumption, Abuja Parish Registry',
  },
};

/**
 * Returns church branding if the parish name matches a configured church.
 * Uses case-insensitive partial match (e.g. "Holy Family Catholic Church" matches).
 */
export function getChurchBranding(parishName: string | null | undefined): ChurchBranding | null {
  if (!parishName || typeof parishName !== 'string') return null;
  const normalized = parishName.trim().toLowerCase();
  if (!normalized) return null;

  for (const [key, branding] of Object.entries(CHURCH_BRANDING)) {
    if (normalized.includes(key)) {
      return branding;
    }
  }
  return null;
}
