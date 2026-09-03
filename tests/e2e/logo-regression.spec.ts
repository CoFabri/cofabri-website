import { test, expect } from '@playwright/test';

// Regression guard for the CoFabri wordmark bug: it used to inline a live
// SVG fetched from files.cofabri.com with <text font-family="..."> elements
// for "Co"/"Fabri", which silently rendered in the wrong font on real iOS
// Safari (the font-family fallback list never resolved there, even though
// the exact same markup rendered fine in desktop WebKit and simulated
// iPhone testing). It was replaced with pre-rasterized PNG masters served
// through next/image. This spec runs under both Chromium and real WebKit
// (see playwright.config.ts) to cover the browser family the original bug
// was specific to.
test('logo renders as an <img> to the PNG masters, never inline SVG text', async ({ page }) => {
  await page.goto('/');

  // Both the header and footer logos are the only link on the page pointing
  // at "/" (nav links all point elsewhere), so this scopes precisely to the
  // CofabriLogo wrapper rather than every <svg> icon on the page (nav icons,
  // theme toggle, hamburger menu, etc).
  const headerLogo = page.locator('header a[href="/"]');
  const footerLogo = page.locator('footer a[href="/"]');

  for (const logo of [headerLogo, footerLogo]) {
    // Positive: a next/image <img> pointing at the CoFabri brand-asset CDN's
    // PNG masters.
    await expect(logo.locator('img[alt="CoFabri"]').first()).toHaveAttribute('src', /files\.cofabri\.com.*\.png/);

    // Negative: no inline SVG at all inside the logo link — CofabriLogo never
    // renders one, so any <svg> here means the live-SVG-with-<text> approach
    // has come back.
    await expect(logo.locator('svg')).toHaveCount(0);
  }
});
