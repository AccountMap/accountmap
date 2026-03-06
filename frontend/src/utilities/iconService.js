// Generic icons by category – predefined for Auth (Good Auth style), Mail (Gmail), Phone (as-is)
const ICONS = {
  generic: 'https://cdn-icons-png.flaticon.com/512/633/633600.png',
  dummy: 'https://cdn-icons-png.flaticon.com/512/10833/10833652.png', // unlink / no connection
  user: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
  link: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png',
  // Mail: Gmail-style (Simple Icons)
  mail: 'https://cdn.simpleicons.org/gmail/EA4335',
  // Phone: keep as-is (Flaticon)
  phone: 'https://cdn-icons-png.flaticon.com/512/724/724664.png',
  // Auth: Good Auth–style (Auth0-style shield from Simple Icons)
  auth: 'https://cdn.simpleicons.org/auth0/EB5424',
  lock: 'https://cdn-icons-png.flaticon.com/512/3064/3064155.png',
};

const GENERIC_ICON = ICONS.generic;

// Map labels/keywords → Simple Icons slug (or category for generic)
const KEYWORD_MAP = {
  // Email & communication
  mail: 'gmail',
  email: 'gmail',
  gmail: 'gmail',
  workemail: 'gmail',
  work_email: 'gmail',
  personalemail: 'icloud',
  personal_email: 'icloud',
  icloud: 'icloud',
  outlook: 'microsoftoutlook',
  hotmail: 'microsoftoutlook',
  yahoo: 'yahoo',
  proton: 'protonmail',
  protonmail: 'protonmail',
  // Phone & SMS
  phone: 'phone',
  sms: 'twilio',
  twilio: 'twilio',
  // Auth & security
  auth: 'googleauthenticator',
  authenticator: 'authy',
  authy: 'authy',
  '2fa': 'googleauthenticator',
  mfa: 'googleauthenticator',
  totp: 'googleauthenticator',
  // Cloud & infra
  aws: 'amazonwebservices',
  amazon: 'amazonwebservices',
  amazonwebservices: 'amazonwebservices',
  azure: 'microsoftazure',
  googlecloud: 'googlecloud',
  gcp: 'googlecloud',
  vercel: 'vercel',
  netlify: 'netlify',
  heroku: 'heroku',
  digitalocean: 'digitalocean',
  // Dev & tools
  github: 'github',
  gitlab: 'gitlab',
  bitbucket: 'bitbucket',
  git: 'git',
  docker: 'docker',
  kubernetes: 'kubernetes',
  npm: 'npm',
  node: 'nodedotjs',
  nodejs: 'nodedotjs',
  react: 'react',
  vue: 'vuedotjs',
  angular: 'angular',
  typescript: 'typescript',
  javascript: 'javascript',
  python: 'python',
  go: 'go',
  rust: 'rust',
  stripe: 'stripe',
  paypal: 'paypal',
  slack: 'slack',
  discord: 'discord',
  telegram: 'telegram',
  zoom: 'zoom',
  notion: 'notion',
  figma: 'figma',
  trello: 'trello',
  atlassian: 'atlassian',
  jira: 'jira',
  linear: 'linear',
  // Social & media
  twitter: 'x',
  x: 'x',
  facebook: 'facebook',
  meta: 'meta',
  instagram: 'instagram',
  linkedin: 'linkedin',
  youtube: 'youtube',
  twitch: 'twitch',
  tiktok: 'tiktok',
  reddit: 'reddit',
  pinterest: 'pinterest',
  spotify: 'spotify',
  netflix: 'netflix',
  apple: 'apple',
  google: 'google',
  microsoft: 'microsoft',
  android: 'android',
  // Finance & biz
  bank: 'generic',
  banking: 'generic',
  account: 'user',
  connection: 'link',
  personal: 'user',
  work: 'link',
};

// Simple Icons that need a custom color for visibility
const SIMPLEICONS_COLORS = {
  twilio: 'F22F46',
  amazonwebservices: 'FF9900',
  x: '000000',
};

function normalizeKey(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9._-]/g, '');
}

function slugFromName(name) {
  if (!name || typeof name !== 'string') return '';
  const cleaned = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9._-]/g, '');
  const noSpaces = cleaned.replace(/_/g, '');
  return KEYWORD_MAP[noSpaces] ?? KEYWORD_MAP[cleaned] ?? noSpaces.replace(/_/g, '');
}

function firstWordSlug(name) {
  if (!name || typeof name !== 'string') return '';
  const first = name.trim().split(/\s+/)[0];
  if (!first) return '';
  const key = first.toLowerCase().replace(/[^a-z0-9]/g, '');
  return KEYWORD_MAP[key] ?? key;
}

function looksLikeDomain(str) {
  if (!str || typeof str !== 'string') return false;
  const s = str.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(s) || (s.includes('.') && s.length > 4);
}

function domainForFavicon(name) {
  if (!name || typeof name !== 'string') return '';
  const s = name.trim().toLowerCase();
  if (looksLikeDomain(s)) return s.split('/')[0];
  const noSpaces = s.replace(/\s+/g, '');
  if (/^[a-z0-9.-]+$/.test(noSpaces)) return `${noSpaces}.com`;
  const firstWord = s.split(/\s+/)[0]?.replace(/[^a-z0-9]/g, '') ?? '';
  return firstWord ? `${firstWord}.com` : '';
}

/**
 * Returns a list of icon URLs to try in order. Always ends with GENERIC_ICON so something always works.
 */
export function getIconCandidates(name) {
  if (!name || typeof name !== 'string' || name === 'Select an Account') {
    return [GENERIC_ICON];
  }
  if (normalizeKey(name) === 'dummy') {
    return [ICONS.dummy, GENERIC_ICON];
  }

  const candidates = [];
  const seen = new Set();

  const add = (url) => {
    if (url && !seen.has(url)) {
      seen.add(url);
      candidates.push(url);
    }
  };

  const clean = name.toLowerCase().trim();
  const slug = slugFromName(name);
  const firstSlug = firstWordSlug(name);

  // 1) Generic category icons (user, link, mail, phone, lock)
  if (KEYWORD_MAP[normalizeKey(name)] === 'user' || clean === 'account' || clean === 'personal') {
    add(ICONS.user);
  }
  if (KEYWORD_MAP[normalizeKey(name)] === 'link' || clean === 'connection' || clean === 'work') {
    add(ICONS.link);
  }
  if (clean === 'phone' || slug === 'phone' || slug === 'twilio') {
    add(ICONS.phone);
  }
  if (/mail|email|gmail|outlook|icloud|yahoo|proton/.test(clean) || slug === 'gmail' || slug === 'microsoftoutlook' || slug === 'icloud') {
    add(ICONS.mail);
  }
  if (/auth|2fa|mfa|totp|authenticator|authy|googleauthenticator/.test(clean)) {
    add(ICONS.auth);
  }

  // 2) Simple Icons by slug (exact and first-word)
  if (slug && slug !== 'user' && slug !== 'link' && slug !== 'generic') {
    const color = SIMPLEICONS_COLORS[slug];
    add(color ? `https://cdn.simpleicons.org/${slug}/${color}` : `https://cdn.simpleicons.org/${slug}`);
  }
  if (firstSlug && firstSlug !== slug && firstSlug !== 'user' && firstSlug !== 'link' && firstSlug !== 'generic') {
    const color = SIMPLEICONS_COLORS[firstSlug];
    add(color ? `https://cdn.simpleicons.org/${firstSlug}/${color}` : `https://cdn.simpleicons.org/${firstSlug}`);
  }

  // 3) Raw slug from name (for brands not in KEYWORD_MAP)
  const rawSlug = normalizeKey(name).replace(/_/g, '');
  if (rawSlug && rawSlug.length >= 2 && rawSlug.length <= 50) {
    add(`https://cdn.simpleicons.org/${rawSlug}`);
  }
  const rawFirst = (name.trim().split(/\s+/)[0] ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (rawFirst && rawFirst !== rawSlug && rawFirst.length >= 2) {
    add(`https://cdn.simpleicons.org/${rawFirst}`);
  }

  // 4) Favicon for domain-like names
  const domain = domainForFavicon(name);
  if (domain) {
    add(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`);
  }

  // 5) Always end with generic so we always have an icon
  add(GENERIC_ICON);

  return candidates;
}

export function getIconUrl(name) {
  const candidates = getIconCandidates(name);
  return candidates[0] ?? GENERIC_ICON;
}

/**
 * Tries each candidate URL in order until one loads. Always resolves with a valid image (at least GENERIC_ICON).
 */
export function loadImage(name) {
  const candidates = getIconCandidates(name);

  return new Promise((resolve) => {
    function tryNext(index) {
      if (index >= candidates.length) {
        const fallback = new Image();
        fallback.crossOrigin = 'anonymous';
        fallback.src = GENERIC_ICON;
        fallback.onload = () => resolve(fallback);
        fallback.onerror = () => resolve(fallback);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = candidates[index];
      img.onload = () => resolve(img);
      img.onerror = () => tryNext(index + 1);
    }
    tryNext(0);
  });
}
