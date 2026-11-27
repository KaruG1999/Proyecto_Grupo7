// Servidor local para desarrollo: sirve el sitio estático y la función /api/perenual
// igual que Vercel en producción.
// Uso: node --env-file=.env dev-server.js   →   http://localhost:5500

const http = require('http');
const fs = require('fs');
const path = require('path');
const perenual = require('./api/perenual');

const PORT = process.env.PORT || 5500;
const ROOT = __dirname;
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/api/perenual') {
      // Adapta la respuesta de Node a la API mínima que usa la función de Vercel
      req.query = Object.fromEntries(url.searchParams);
      res.status = (code) => ((res.statusCode = code), res);
      res.json = (body) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(body));
      };
      return perenual(req, res);
    }

    let ruta = path.normalize(path.join(ROOT, decodeURIComponent(url.pathname)));
    const relativa = path.relative(ROOT, ruta);
    // Nunca servir archivos ocultos (.env, .git) ni el código del servidor
    const prohibida =
      relativa.startsWith('..') ||
      relativa.split(path.sep).some((parte) => parte.startsWith('.')) ||
      /^(api|dev-server\.js)/.test(relativa);
    if (prohibida) return res.writeHead(404).end('No encontrado');
    if (fs.existsSync(ruta) && fs.statSync(ruta).isDirectory()) ruta = path.join(ruta, 'index.html');

    fs.readFile(ruta, (error, contenido) => {
      if (error) return res.writeHead(404).end('No encontrado');
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta)] || 'application/octet-stream' });
      res.end(contenido);
    });
  })
  .listen(PORT, () => console.log(`Siempre Verde en http://localhost:${PORT}`));
