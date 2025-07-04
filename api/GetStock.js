import https from 'https';

const options = {
  method: 'GET',
  hostname: 'growagarden.gg',
  port: null,
  path: '/api/ws/stocks.getAll?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D',
  headers: {
    accept: '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    priority: 'u=1, i',
    referer: 'https://growagarden.gg/stocks',
    'trpc-accept': 'application/json',
    'x-trpc-source': 'gag'
  }
};

function fetchStocks() {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString();
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          reject({ message: 'Failed to parse response', code: 500 });
        }
      });
    });

    req.on('error', (e) => reject({ message: e.message, code: 502 }));
    req.end();
  });
}

function formatStockItems(items) {
  return items.map(item => ({
    name: item.name,
    value: item.value,
    image: item.image,
    emoji: item.emoji
  }));
}

function formatLastSeenItems(items) {
  return items.map(item => ({
    name: item.name,
    image: item.image,
    emoji: item.emoji,
    seen: new Date(item.seen).toLocaleString()
  }));
}

function formatStocks(data) {
  const stocks = data[0]?.result?.data?.json;
  if (!stocks) throw new Error('Invalid structure');

  return {
    gearStock: formatStockItems(stocks.gearStock),
    eggStock: formatStockItems(stocks.eggStock),
    seedsStock: formatStockItems(stocks.seedsStock),
    nightStock: formatStockItems(stocks.nightStock),
    bloodStock: formatStockItems(stocks.bloodStock),
    cosmeticsStock: formatStockItems(stocks.cosmeticsStock),
    lastSeen: {
      Seeds: formatLastSeenItems(stocks.lastSeen.Seeds),
      Gears: formatLastSeenItems(stocks.lastSeen.Gears),
      Weather: formatLastSeenItems(stocks.lastSeen.Weather),
      Eggs: formatLastSeenItems(stocks.lastSeen.Eggs)
    }
  };
}

export default async function handler(req, res) {
  try {
    const rawData = await fetchStocks();
    const result = formatStocks(rawData);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(err.code || 500).json({
      success: false,
      error: err.message
    });
  }
}
