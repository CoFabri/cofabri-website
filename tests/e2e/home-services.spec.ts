import { test, expect, type Page } from '@playwright/test';

// The Services section on the home page, between Apps and Co-Build. /api/services and
// /api/coming-soon are mocked, so these checks do not depend on what Core serves today.

const service = (id: string, name: string, status: string) => ({
  id,
  name,
  description: `${name}.`,
  status,
  category: 'Business Software',
  featureOnWebsite: false,
  projectType: 'cofabri_service',
  primaryColor: '#0B6BE6',
});
const TODAY = [service('cofabri-marketing', 'CoFabri Marketing', 'Live'), service('cofabri-concierge', 'CoFabri Concierge', 'In Development')];

const WIDTHS = [344, 390, 768, 1024, 1280];
const THEMES = ['light', 'dark'] as const;

async function openHome(page: Page, services: unknown) {
  await page.context().addCookies([{ name: 'analytics-consent', value: 'declined', url: 'http://localhost:3000' }]);
  await page.route('**/api/services', (route) => route.fulfill({ json: services }));
  await page.route('**/api/coming-soon', (route) => route.fulfill({ status: 201, json: { success: true } }));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
}

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    test.describe(`${theme} ${width}`, () => {
      test.use({ viewport: { width, height: 900 }, colorScheme: theme, hasTouch: width < 800 });

      test('shows the section between Apps and Co-Build, with no horizontal scroll', async ({ page }) => {
        await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
        await openHome(page, TODAY);
        const section = page.locator('[data-home-services]');
        await section.scrollIntoViewIfNeeded();
        await expect(section.getByRole('heading', { name: 'Some work is better done for you.' })).toBeVisible();
        await expect(section.locator('[data-service-card]')).toHaveCount(2);
        await expect(section.getByRole('link', { name: 'All Services' })).toHaveAttribute('href', '/services');

        // Apps, then Services, then Co-Build.
        const order = await page.evaluate(() => {
          const y = (el: Element | null) => (el ? el.getBoundingClientRect().top + window.scrollY : -1);
          const services = y(document.querySelector('[data-home-services]'));
          const coBuild = y([...document.querySelectorAll('section')].find((s) => /co-build/i.test(s.textContent ?? '') && !s.hasAttribute('data-home-services')) ?? null);
          return { services, coBuild };
        });
        expect(order.services).toBeGreaterThan(0);
        if (order.coBuild > 0) expect(order.services).toBeLessThan(order.coBuild);

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(0);
      });

      test('touch targets are at least 44px (a card title is covered by its whole-card link)', async ({ page }) => {
        test.skip(width >= 800, 'only touch layouts');
        await openHome(page, TODAY);
        const section = page.locator('[data-home-services]');
        await section.scrollIntoViewIfNeeded();
        await page.waitForTimeout(800);
        const small = await section.evaluate((root) =>
          [...root.querySelectorAll<HTMLElement>('a, button, input')]
            .filter((el) => !el.className.toString().includes('after:absolute'))
            .map((el) => ({ text: (el.textContent || el.getAttribute('placeholder') || '').trim(), height: Math.round(el.getBoundingClientRect().height) }))
            .filter((t) => t.height < 44),
        );
        expect(small).toEqual([]);
      });

      test('Notify Me: idle, open, invalid email, done, and the field stays inside the card', async ({ page }) => {
        await openHome(page, TODAY);
        const card = page.locator('[data-service-card="cofabri-concierge"]');
        await card.scrollIntoViewIfNeeded();
        await expect(card.getByRole('textbox')).toHaveCount(0);

        await card.getByRole('button', { name: 'Notify Me' }).click();
        const field = card.getByRole('textbox');
        await expect(field).toBeVisible();

        await field.fill('not-an-email');
        await card.getByRole('button', { name: 'Notify Me' }).click();
        await expect(card.getByRole('alert')).toHaveText('Enter an email like name@business.com.');

        const fits = await card.evaluate((el) => {
          const box = el.getBoundingClientRect();
          return [...el.querySelectorAll('input, button')].every((c) => c.getBoundingClientRect().right <= box.right + 0.5) && el.scrollWidth <= el.clientWidth;
        });
        expect(fits).toBe(true);
        // A two-up card at 768 is about 332px wide: the field stacks above the button there, and sits beside it on a wide card.
        const stacked = await card.evaluate((el) => el.querySelector('input')!.getBoundingClientRect().bottom <= el.querySelector('button[type=submit]')!.getBoundingClientRect().top + 1);
        if (width === 768 || width <= 390) expect(stacked).toBe(true);
        if (width === 1280) expect(stacked).toBe(false);

        await field.fill('someone@business.com');
        await card.getByRole('button', { name: 'Notify Me' }).click();
        await expect(card.getByRole('status')).toHaveText("Done. We'll email you once, at launch.");
      });
    });
  }
}

test.describe('how many services', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('one service is a single card; five or more show only the link', async ({ page }) => {
    await openHome(page, TODAY.slice(0, 1));
    await expect(page.locator('[data-home-services] [data-service-card]')).toHaveCount(1);

    const five = Array.from({ length: 5 }, (_, i) => service(`s${i}`, `Service ${i}`, 'Live'));
    await page.unroute('**/api/services');
    await page.route('**/api/services', (route) => route.fulfill({ json: five }));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-home-services]')).toBeVisible();
    await expect(page.locator('[data-home-services] [data-service-card]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'All 5 Services' })).toBeVisible();
  });

  test('the section is hidden with zero services or when the request fails', async ({ page }) => {
    await openHome(page, []);
    await expect(page.locator('[data-home-services-skeleton]')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator('[data-home-services]')).toHaveCount(0);

    await page.unroute('**/api/services');
    await page.route('**/api/services', (route) => route.fulfill({ status: 500, json: { error: 'x' } }));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-home-services-skeleton]')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator('[data-home-services]')).toHaveCount(0);
  });
});
