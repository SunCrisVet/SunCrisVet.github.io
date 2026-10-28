# Performance assets

`assets/site.css` remains the readable stylesheet source. Published HTML embeds
its minified version to avoid a blocking CSS round trip. CSP allows only its
SHA-256 hash, not arbitrary inline styles.

After editing CSS, install `clean-css@5.3.3` in a tooling directory and run:

```powershell
$env:PERFORMANCE_TOOLS_PACKAGE = 'C:/path/to/tooling/package.json'
node tools/optimize-delivery.mjs
```

The command regenerates the stylesheet block in all 14 full HTML pages and the
matching `_headers` CSP hash. Redirect-only HTML pages are left alone. Commit the
generated HTML and `_headers` together. Preserve exact inline CSS bytes when
deploying (Git LF/CRLF does not affect the single-line CSS content).

Inter v2 is the same variable font, subsetted to Latin and Latin Extended
characters used by the site, including Romanian diacritics. Original font
files and their OFL license are retained. Gallery thumbnails use 480/800 px
WebP variants; lightbox links retain the full-size originals.

The homepage hero uses responsive AVIF sources (480/800/1280 px) with the
existing WebP images as a fallback. The original hero asset is retained.

Fonts are preloaded with high priority and use `font-display: optional`: on a
very slow first visit the browser keeps the readable system fallback instead
of repainting the text several seconds later. Later visits use the cached
Inter font. No content or controls are hidden to obtain a performance score.
