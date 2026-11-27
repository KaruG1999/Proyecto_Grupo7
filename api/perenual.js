// Función serverless (Vercel): hace de intermediaria con la API de Perenual
// para que la API key viva solo en el servidor y nunca llegue al navegador.
// La key se configura como variable de entorno PERENUAL_API_KEY
// (en Vercel: Settings → Environment Variables; en local: archivo .env).

const PERENUAL_URL = 'https://perenual.com/api/species-list';

module.exports = async function handler(req, res) {
  const query = String(req.query?.q ?? '').trim();

  if (!query || query.length > 60) {
    return res.status(400).json({ error: 'Parámetro "q" inválido' });
  }

  const apiKey = process.env.PERENUAL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta configurar PERENUAL_API_KEY' });
  }

  try {
    const url = `${PERENUAL_URL}?key=${apiKey}&q=${encodeURIComponent(query)}`;
    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    // Cachea en el CDN un día: menos llamadas y menos riesgo de pasar el límite gratuito
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(respuesta.status).json(datos);
  } catch (error) {
    return res.status(502).json({ error: 'No se pudo consultar Perenual' });
  }
};
