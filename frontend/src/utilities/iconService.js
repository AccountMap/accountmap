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

const imageCache = new Map();

function cacheKey(name) {
  return normalizeKey(name) || String(name ?? '');
}

/** Fetch + rasterize so canvas/WebGL is same-origin (Brave blocks tainted cross-origin uploads). */
async function loadImageFromUrl(url) {
  const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const size = Math.max(bitmap.width, bitmap.height, 64);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, size, size);
  bitmap.close?.();

  const img = new Image();
  img.src = canvas.toDataURL('image/png');
  if (img.decode) await img.decode();
  else await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  return img;
}

function loadImageLegacy(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('load failed'));
    img.src = url;
  });
}

function loadFallbackImage() {
  return loadImageFromUrl(GENERIC_ICON).catch(() =>
    loadImageLegacy(GENERIC_ICON).catch(() => {
      const img = new Image();
      img.src = GENERIC_ICON;
      return img;
    })
  );
}

/**
 * Loads icon candidates in parallel while respecting priority order.
 * Always resolves with a valid image (at least GENERIC_ICON). Results are cached by name.
 */
export function loadImage(name) {
  const key = cacheKey(name);
  if (imageCache.has(key)) return imageCache.get(key);

  const candidates = getIconCandidates(name);
  const promise = new Promise((resolve) => {
    if (!candidates.length) {
      loadFallbackImage().then(resolve);
      return;
    }

    let settled = false;
    const outcomes = candidates.map(() => null);

    const tryResolveBest = () => {
      if (settled) return;
      for (let i = 0; i < outcomes.length; i++) {
        if (outcomes[i] === false) continue;
        if (outcomes[i]) {
          settled = true;
          resolve(outcomes[i]);
          return;
        }
        return;
      }
    };

    let failed = 0;
    const onFail = (index) => {
      outcomes[index] = false;
      failed += 1;
      tryResolveBest();
      if (failed === candidates.length && !settled) {
        settled = true;
        loadFallbackImage().then(resolve);
      }
    };

    candidates.forEach((url, index) => {
      loadImageFromUrl(url)
        .then((img) => {
          outcomes[index] = img;
          tryResolveBest();
        })
        .catch(() => {
          loadImageLegacy(url)
            .then((img) => {
              outcomes[index] = img;
              tryResolveBest();
            })
            .catch(() => onFail(index));
        });
    });
  });

  imageCache.set(key, promise);
  return promise;
}
