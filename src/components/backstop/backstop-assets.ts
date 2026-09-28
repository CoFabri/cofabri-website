// Everything the backstop page needs, as plain strings inlined into the
// document. No external requests: this renders when nothing else can load.

export const BACKSTOP_CSS = `
:root{--surface:#FFFFFF;--hairline:#E9ECEF;--ink:#232E36;--ink-body:#36454F;--ink-muted:#5A6A75;--accent:#0B6BE6;--accent-hover:#0857BE;--on-accent:#FFFFFF;--brand:#3B82F6;--mark-core:#36454F;--status:#D98212;--status-halo:rgba(217,130,18,.14);
--font:"Instrument Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;--gutter:clamp(20px,4vw,40px)}
@media (prefers-color-scheme:dark){:root{--surface:#171D22;--hairline:#2B353D;--ink:#F1F4F6;--ink-body:#C9D2D8;--ink-muted:#9AA8B2;--accent:#5AA0F5;--accent-hover:#83B8F8;--on-accent:#0B1B2B;--mark-core:#E4EAEE;--status:#E9A33D;--status-halo:rgba(233,163,61,.16)}}
html,body{margin:0;background:var(--surface);color:var(--ink)}
.bs,.bs *{box-sizing:border-box}
.bs{min-height:100vh;min-height:100dvh;display:flex;flex-direction:column;background:var(--surface);color:var(--ink);font:400 16px/1.6 var(--font);-webkit-font-smoothing:antialiased;overflow-wrap:break-word}
.bs .wrap{width:100%;max-width:1200px;margin:0 auto;padding:0 var(--gutter)}
.bs header{border-bottom:1px solid var(--hairline)}
.bs header .wrap{height:68px;display:flex;align-items:center}
.bs .logo{display:inline-flex;align-items:flex-end;gap:3px;font-weight:700;font-size:21px;letter-spacing:-.03em;line-height:1;color:var(--mark-core)}
.bs .logo svg{display:block;margin-bottom:1px}
.bs main{flex:1;display:flex;align-items:center;padding:64px 0}
.bs main .wrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,400px);gap:80px;align-items:center}
.bs .copy{max-width:620px}
.bs .pill{display:inline-flex;align-items:center;gap:8px;padding:6px 12px 6px 10px;border:1px solid var(--hairline);border-radius:999px;font-size:13px;font-weight:500;line-height:1.4;color:var(--ink-body)}
.bs .dot{width:8px;height:8px;border-radius:50%;background:var(--status);box-shadow:0 0 0 4px var(--status-halo);animation:bs-pulse 2.4s ease-in-out infinite}
.bs .ring{transform-origin:50px 50px;opacity:0;animation:bs-ripple 7.5s ease-out infinite}
.bs h1{margin:28px 0 0;font-size:clamp(2.125rem,1.2rem + 3.9vw,3.5rem);line-height:1.06;letter-spacing:-.03em;font-weight:600;text-wrap:balance}
.bs .lead{margin:20px 0 0;max-width:520px;font-size:clamp(1.0625rem,1rem + .3vw,1.1875rem);color:var(--ink-muted);text-wrap:pretty}
.bs .actions{margin-top:36px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px}
.bs .btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;min-width:152px;padding:0 24px;border-radius:9px;background:var(--accent);color:var(--on-accent);font-size:16px;font-weight:600;text-decoration:none;transition:background .18s cubic-bezier(.2,.7,.3,1)}
.bs .btn:hover{background:var(--accent-hover)}
.bs .link{padding:12px 2px;color:var(--accent);font-weight:600;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}
.bs .link:hover{color:var(--accent-hover)}
.bs a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:9px}
.bs .spin{display:none;width:14px;height:14px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;border-bottom-color:transparent;animation:bs-spin .8s linear infinite}
.bs .l-load{display:none}
.bs [data-state=loading] .spin,.bs [data-state=loading] .l-load{display:block}
.bs [data-state=loading] .l-idle{display:none}
.bs [data-state=loading] .btn{cursor:progress}
.bs .again{display:none;margin:14px 0 0;font-size:14px;color:var(--ink-body)}
.bs [data-state=retry] .again{display:block}
.bs .safe{margin:36px 0 0;max-width:520px;font-size:15px;color:var(--ink-muted)}
.bs .safe strong{color:var(--ink-body);font-weight:600}
.bs .note{margin-top:32px;padding-top:20px;border-top:1px solid var(--hairline);max-width:520px}
.bs .eyebrow{display:flex;gap:12px;font:500 12px/1.4 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted)}
.bs .note p{margin:8px 0 0;font-size:15px;color:var(--ink-body)}
.bs .motif{justify-self:end;width:100%;max-width:420px;height:auto}
.bs footer{border-top:1px solid var(--hairline)}
.bs footer .wrap{padding-top:24px;padding-bottom:24px;font-size:13px;color:var(--ink-muted)}
.bs .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.bs .tag{position:fixed;top:12px;right:12px;padding:4px 10px;border:1px dashed var(--ink-muted);border-radius:6px;font:500 11px/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted);background:var(--surface)}
@keyframes bs-pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes bs-spin{to{transform:rotate(360deg)}}
@keyframes bs-ripple-sm{0%{transform:scale(1);opacity:.5}100%{transform:scale(1.5);opacity:0}}
@keyframes bs-ripple{0%{transform:scale(1);opacity:.5}100%{transform:scale(1.9);opacity:0}}
@media (max-width:760px){
.bs header .wrap{height:56px}
.bs main{align-items:flex-start;padding:40px 0 56px;overflow-x:clip}
.bs main .wrap{grid-template-columns:minmax(0,1fr);gap:0}
.bs .motif{order:-1;justify-self:start;width:144px;margin:-36px 0 -8px -36px}
.bs .ring{animation-name:bs-ripple-sm}
.bs h1{margin-top:24px}
.bs .btn{flex:1 1 100%}
}
@media (prefers-reduced-motion:reduce){.bs .dot,.bs .spin,.bs .ring{animation:none}.bs .ring:first-of-type{opacity:.25;transform:scale(1.35)}.bs .btn{transition:none}}
`.trim();

