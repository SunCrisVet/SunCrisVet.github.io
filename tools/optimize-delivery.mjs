// Regenerate after editing assets/site.css. CSS is embedded to avoid an extra
// render-blocking request, with a matching CSP hash (no unsafe-inline).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(process.env.PERFORMANCE_TOOLS_PACKAGE || import.meta.url);
const CleanCSS = require('clean-css');
const root = path.resolve(import.meta.dirname, '..');
const consentBootstrap = `(()=>{if(!["suncrisvet.ro","www.suncrisvet.ro","veterinar-nonstop.ro","www.veterinar-nonstop.ro"].includes(location.hostname))return;let c;try{c=localStorage.getItem("suncrisvet_analytics_consent")}catch{}document.documentElement.dataset.analyticsConsent=c==="accepted"||c==="rejected"?"chosen":"pending"})();`;
const bootstrapHash = crypto.createHash('sha256').update(consentBootstrap).digest('base64');
const siteScript = fs.readFileSync(path.join(root,'assets/site.js'),'utf8');
const bannerContent = siteScript.match(/banner\.innerHTML = `([\s\S]*?)`;/)[1];
const bannerMarkup = `<!-- analytics-consent:start --><section class="analytics-consent" role="dialog" aria-modal="false" aria-labelledby="analytics-consent-title">${bannerContent}</section><!-- analytics-consent:end -->`;
const css = fs.readFileSync(path.join(root, 'assets/site.css'), 'utf8')
  .replace(/url\("(?!\/|data:|https:)([^"\n]+)"\)/g, 'url("/assets/$1")');
const result = new CleanCSS({ level: 1, rebase: false }).minify(css);
if (result.errors.length) throw new Error(result.errors.join('\n'));
const styles = result.styles;
const hash = crypto.createHash('sha256').update(styles).digest('base64');
const preload = ['latin', 'latin-ext'].map(name =>
  `<link rel="preload" href="/assets/fonts/inter-${name}-v2.woff2" as="font" type="font/woff2" crossorigin fetchpriority="high">`
).join('\n  ');
const block = `<!-- site-styles:start -->\n  ${preload}\n  <link rel="preload" href="/assets/site.js?v=15" as="script" fetchpriority="high">\n  <style data-site-styles>${styles}</style>\n  <script data-consent-bootstrap>${consentBootstrap}</script>\n  <!-- site-styles:end -->`;
const gallery = new Set(['intrare-cabinet-veterinar-sector-5', 'cabinet-consultatii-sun-cris-vet', 'cabinet-veterinar-sector-5-interior', 'pisoi-ingrijit-sun-cris-vet']);
let count = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (entry.name.startsWith('.') || ['assets','tools','functions'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    let html = fs.readFileSync(file, 'utf8');
    if (!/site-styles:start|rel="stylesheet" href="\/assets\/site.css/.test(html)) continue;
    html = html.replace(/<!-- site-styles:start -->[\s\S]*?<!-- site-styles:end -->|<link rel="stylesheet" href="\/assets\/site\.css\?v=\d+">/, block);
    // The script is at the end of body, after every node it uses. Async avoids
    // waiting for unrelated deferred scripts inserted by the CDN.
    html = html.replace(/<script src="\/assets\/site\.js\?v=\d+"(?: defer| async)?><\/script>/g,
      '<script src="/assets/site.js?v=15" async></script>');
    html = html.replace(/^[ \t]*<!-- analytics-consent:start -->[\s\S]*?<!-- analytics-consent:end -->[ \t]*\r?\n?/gm,'');
    if (html.includes('<script src="/assets/site.js')) {
      html = html.replace(/^[ \t]*(<script src="\/assets\/site\.js[^>]*><\/script>)/m, `${bannerMarkup}\n  $1`);
    }
    html = html.replace(/\s*<script src="https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js" async defer><\/script>/g, '');
    html = html.replace(/(<img\b[^>]*?)fetchpriority="high"/g, '$1fetchpriority="auto"');
    html = html.replace(/src="\/assets\/google-g-review-v1.png"/g,
      'src="/assets/google-g-review-v2.png" loading="lazy" decoding="async"');
    html = html.replace(/<div class="header-meta" aria-label=/g, '<div class="header-meta" role="group" aria-label=');
    html = html.replace(/<img class="brand-mark" (?!width=)/g, '<img class="brand-mark" width="250" height="280" ');
    html = html.replace(/<img src="\/assets\/logo-sun-cris-vet\.svg\?v=2" alt="Sun Cris Vet">/g,
      '<img src="/assets/logo-sun-cris-vet.svg?v=2" width="980" height="280" loading="lazy" decoding="async" alt="Sun Cris Vet">');
    html = html.replace(/<img data-lightbox-image alt="">/g, '<img data-lightbox-image width="1200" height="900" alt="">');
    html = html.replace(/<img\b[^>]*>/g, tag => {
      if (tag.includes('srcset=')) return tag;
      const match = tag.match(/src="\/?assets\/([^"?]+)\.webp(?:\?v=1)?"/);
      if (!match) return tag;
      const name = match[1];
      if (!gallery.has(name) && name !== 'clinic-pets-hero') return tag;
      const hero = name === 'clinic-pets-hero';
      const sizes = hero
        ? '(max-width: 640px) calc(100vw - 32px), (max-width: 980px) 720px, 580px'
        : '(max-width: 640px) calc(100vw - 32px), (max-width: 1100px) calc(50vw - 32px), 294px';
      const srcset = `/assets/${name}-480-v2.webp 480w, /assets/${name}-800-v2.webp 800w, /assets/${name}${hero ? '-1280-v2' : ''}.webp ${hero ? 1280 : name === 'intrare-cabinet-veterinar-sector-5' || name === 'pisoi-ingrijit-sun-cris-vet' ? 1200 : 1400}w`;
      return tag.replace(match[0], `src="/assets/${name}-${hero ? 800 : 480}-v2.webp" srcset="${srcset}" sizes="${sizes}"`);
    });
    // AVIF for modern browsers; retain the unchanged responsive WebP fallback.
    html = html.replace(/(<div class="hero-visual">\s*)(<img\b[^>]+>)/, (all,prefix,img) => {
      const sizes=img.match(/sizes="([^"]+)"/)[1];
      const source='<source type="image/avif" srcset="/assets/clinic-pets-hero-480-v3.avif 480w, /assets/clinic-pets-hero-800-v3.avif 800w, /assets/clinic-pets-hero-1280-v3.avif 1280w" sizes="'+sizes+'">';
      return `${prefix}<picture>${source}${img}</picture>`;
    });
    fs.writeFileSync(file, html);
    count++;
  }
}
walk(root);
const headersPath = path.join(root, '_headers');
let headers = fs.readFileSync(headersPath, 'utf8');
headers = headers.replace(/style-src 'self'(?: 'sha256-[^']+')*/,
  `style-src 'self' 'sha256-${hash}'`);
if (!headers.includes(`'sha256-${bootstrapHash}'`)) {
  headers = headers.replace("script-src 'self'", `script-src 'self' 'sha256-${bootstrapHash}'`);
}
fs.writeFileSync(headersPath, headers);
console.log(JSON.stringify({pages:count, cssBytes:Buffer.byteLength(styles), styleHash:hash}));
