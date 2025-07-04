// api/item-info.js (Vercel-compatible API route)
import https from 'https';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'api', 'Database.json');

const options = {
  method: 'GET',
  hostname: 'growagarden.gg',
  port: null,
  path: '/api/v1/items/Gag/all?page=1&limit=1000000&sortBy=position',
  headers: {
    accept: '*/*',
    'accept-language': 'en-US,en;q=0.9',
    priority: 'u=1, i',
    referer: 'https://growagarden.gg/values',
    'Content-Length': '0'
  }
};

let cachedData = null;

function fetchAndUpdateData() {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try {
          const body = Buffer.concat(chunks);
          const jsonResponse = JSON.parse(body.toString());

          delete jsonResponse.pagination;
          if (jsonResponse.items && Array.isArray(jsonResponse.items)) {
            jsonResponse.items.forEach(item => {
              delete item.id;
              delete item.trend;
            });
          }

          fs.writeFile(DATA_FILE, JSON.stringify(jsonResponse, null, 2), (err) => {
            if (err) return reject(err);
            cachedData = jsonResponse;
            resolve();
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

function loadCachedData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const dataStr = fs.readFileSync(DATA_FILE, 'utf-8');
      cachedData = JSON.parse(dataStr);
    }
  } catch (err) {
    console.error('[Item-Info] Error loading cached data:', err);
  }
}

function filterItems(items, filters) {
  return items.filter(item => {
    const matchesCategory = filters.category ? item.category.toLowerCase() === filters.category.toLowerCase() : true;
    const matchesRarity = filters.rarity ? item.rarity.toLowerCase() === filters.rarity.toLowerCase() : true;
    const matchesName = filters.name ? item.name.toLowerCase().includes(filters.name.toLowerCase()) : true;
    return matchesCategory && matchesRarity && matchesName;
  });
}

// Main Vercel handler
export default async function handler(req, res) {
  if (!cachedData || !cachedData.items) {
    try {
      await fetchAndUpdateData();
    } catch (err) {
      loadCachedData();
    }
  }

  if (!cachedData || !cachedData.items) {
    return res.status(500).json({ error: 'Item data not available' });
  }

  const filters = {
    category: req.query.filter || req.query.category,
    rarity: req.query.rarity,
    name: req.query.name
  };

  const filtered = filterItems(cachedData.items, filters);
  res.status(200).json(filtered);
} 

// Initial fetch (once on cold start)
await fetchAndUpdateData().catch(() => loadCachedData());
