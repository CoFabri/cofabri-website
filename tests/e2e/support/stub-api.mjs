// Minimal stand-in for cofabri-api's root route, used by the healthy-API
// backstop e2e (tests/e2e/backstop-healthy.spec.ts).
import http from 'node:http';

// Must match the stub API URL hard-coded in playwright.config.ts.
const port = 3200;

http
  .createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0];
    res.setHeader('Content-Type', 'application/json');
    if (path === '/') {
      res.statusCode = 200;
      res.end(JSON.stringify({ message: 'CoFabri API is running (stub)' }));
    } else {
      res.statusCode = 404;
      res.end('{}');
    }
  })
  .listen(port, '127.0.0.1');
