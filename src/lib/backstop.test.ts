import { describe, it, expect } from 'vitest';
import {
  BACKSTOP_HEADER,
  BACKSTOP_PATH,
  SAMPLE_BACKSTOP_NOTE,
  isBackstopPreviewRequested,
  isPreviewAllowed,
  parseBackstopMode,
  parseInitialState,
  previewOptions,
} from './backstop';

describe('constants', () => {
  it('exposes the header name and route path', () => {
    expect(BACKSTOP_HEADER).toBe('x-cofabri-backstop');
    expect(BACKSTOP_PATH).toBe('/backstop');
    expect(SAMPLE_BACKSTOP_NOTE.body.length).toBeGreaterThan(0);
  });
});

describe('parseBackstopMode', () => {
  it('accepts only the two known modes', () => {
    expect(parseBackstopMode('outage')).toBe('outage');
    expect(parseBackstopMode('preview')).toBe('preview');
    expect(parseBackstopMode('1')).toBeNull();
    expect(parseBackstopMode('')).toBeNull();
    expect(parseBackstopMode(null)).toBeNull();
  });
});

describe('parseInitialState', () => {
  it('maps unknown values to idle', () => {
    expect(parseInitialState('retry')).toBe('retry');
    expect(parseInitialState('loading')).toBe('loading');
    expect(parseInitialState('idle')).toBe('idle');
    expect(parseInitialState('<script>')).toBe('idle');
    expect(parseInitialState(null)).toBe('idle');
  });
});

describe('isBackstopPreviewRequested', () => {
  it('requires backstop=preview exactly', () => {
    expect(isBackstopPreviewRequested(new URLSearchParams('backstop=preview'))).toBe(true);
    expect(isBackstopPreviewRequested(new URLSearchParams('backstop=1'))).toBe(false);
    expect(isBackstopPreviewRequested(new URLSearchParams(''))).toBe(false);
  });
});

describe('previewOptions', () => {
  it('reads state and note, defaulting safely', () => {
    expect(previewOptions(new URLSearchParams('backstop=preview'))).toEqual({ state: 'idle', note: false });
    expect(previewOptions(new URLSearchParams('state=retry&note=1'))).toEqual({ state: 'retry', note: true });
    expect(previewOptions(new URLSearchParams('state=loading'))).toEqual({ state: 'loading', note: false });
    expect(previewOptions(new URLSearchParams('state=bogus&note=yes'))).toEqual({ state: 'idle', note: false });
  });
});

describe('isPreviewAllowed', () => {
  const params = (q: string) => new URLSearchParams(q);

  it('is open outside production', () => {
    expect(isPreviewAllowed(params(''), { vercelEnv: undefined, previewPassword: 'secret' })).toBe(true);
    expect(isPreviewAllowed(params(''), { vercelEnv: 'preview', previewPassword: 'secret' })).toBe(true);
    expect(isPreviewAllowed(params(''), { vercelEnv: 'development', previewPassword: 'secret' })).toBe(true);
  });

  it('on production, requires the preview password', () => {
    expect(isPreviewAllowed(params('password=secret'), { vercelEnv: 'production', previewPassword: 'secret' })).toBe(true);
    expect(isPreviewAllowed(params('password=wrong'), { vercelEnv: 'production', previewPassword: 'secret' })).toBe(false);
    expect(isPreviewAllowed(params(''), { vercelEnv: 'production', previewPassword: 'secret' })).toBe(false);
  });

  it('on production, is open when no password is configured (matches /preview/*)', () => {
    expect(isPreviewAllowed(params(''), { vercelEnv: 'production', previewPassword: undefined })).toBe(true);
    expect(isPreviewAllowed(params(''), { vercelEnv: 'production', previewPassword: '' })).toBe(true);
  });
});
