import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ServicePanel from './ServicePanel';
import ServiceCard from './ServiceCard';
import RunsOnLine from './RunsOnLine';
import AppTile from './AppTile';
import type { App } from '@/lib/api-client';

const marketing: App = { id: 'cofabri-marketing', name: 'CoFabri Marketing', status: 'Live', projectType: 'cofabri_service', linkedAppId: 'cofabri-crm' };
const both = [
  { id: 'cofabri-crm', name: 'CoFabri CRM' },
  { id: 'medoura', name: 'Medoura', faviconUrl: 'https://files.example.com/medoura.png' },
];

describe('"Runs on"', () => {
  it('the panel names every app the service runs on', () => {
    const out = renderToStaticMarkup(<ServicePanel service={marketing} runsOn={both} />);
    expect(out).toContain('Runs on');
    expect(out).toContain('CoFabri CRM');
    expect(out).toContain('Medoura');
    expect(out).toContain('data-family-mark="cofabri-crm"');
  });

  it('the card names every app too', () => {
    const out = renderToStaticMarkup(<ServiceCard service={marketing} runsOn={both} />);
    expect(out).toContain('CoFabri CRM');
    expect(out).toContain('Medoura');
  });

  it('shows no "Runs on" line when there is nothing to name', () => {
    expect(renderToStaticMarkup(<RunsOnLine apps={[]} />)).toBe('');
    expect(renderToStaticMarkup(<ServicePanel service={marketing} />)).not.toContain('Runs on');
  });
});

describe('AppTile', () => {
  it('uses a CoFabri product tile, an app favicon, or an initial', () => {
    expect(renderToStaticMarkup(<AppTile app={{ id: 'cofabri-crm', name: 'CoFabri CRM' }} />)).toContain('data-family-mark="cofabri-crm"');
    expect(renderToStaticMarkup(<AppTile app={both[1]} />)).toContain('<img');
    const initial = renderToStaticMarkup(<AppTile app={{ id: 'gathr', name: 'Gathr' }} />);
    expect(initial).toContain('>G<');
    expect(initial).toContain('aria-hidden="true"');
  });
});
