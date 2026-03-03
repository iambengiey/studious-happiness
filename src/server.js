const http = require('http');
const { URL } = require('url');
const { renderDashboard } = require('./ui/adminConsole');

function parseAuth(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;

  const token = header.slice('Bearer '.length);
  const parts = token.split(':');
  if (parts.length < 2) return null;

  return {
    user_id: parts[0],
    role: parts[1],
    institution_id: parts[2] || null,
  };
}

function createServer() {
  return http.createServer((req, res) => {
    const user = parseAuth(req);
    if (!user) {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'auth_required', message: 'All routes require auth' }));
      return;
    }

    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/' || url.pathname === '/admin') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(renderDashboard(user));
      return;
    }

    if (url.pathname === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, user }));
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
  });
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`CampusConnect Africa admin console listening on ${port}`);
  });
}

module.exports = { createServer, parseAuth };
