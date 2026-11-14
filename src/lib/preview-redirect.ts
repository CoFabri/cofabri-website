// The preview login page sends the typed password along to `redirect`, so it
// must only ever go to a preview page on this site. Anything else (absolute
// URLs, protocol-relative `//host`, `/\host`, other paths) falls back to /.
export function safePreviewRedirect(redirect: string | null | undefined): string {
  if (!redirect || /[\u0000- \u007f\\]/.test(redirect)) return '/';
  if (!redirect.startsWith('/preview/') || redirect.startsWith('/preview/login')) return '/';
  return redirect;
}
