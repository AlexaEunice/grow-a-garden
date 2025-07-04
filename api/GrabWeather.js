// api/getweather.js
import https from "https";

function processTimestamps(obj) {
  if (typeof obj !== 'object' || obj === null) return;

  for (const key of Object.keys(obj)) {
    const val = obj[key];

    if (val && typeof val === 'object' && 'timestamp' in val && typeof val.timestamp === 'string') {
      const originalTimestamp = val.timestamp;
      const numericTimestamp = new Date(originalTimestamp).getTime();
      obj[key] = {
        ...val,
        timestamp: numericTimestamp,
        LastSeen: originalTimestamp
      };
    } else if (val && typeof val === 'object') {
      processTimestamps(val);
    }
  }
}

function fetchWeather() {
  const options = {
    method: "GET",
    hostname: "growagarden.gg",
    path: "/api/v1/weather/gag",
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=1, i",
      referer: "https://growagarden.gg/weather",
      "Content-Length": "0"
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];

      res.on("data", (chunk) => chunks.push(chunk));

      res.on("end", () => {
        const body = Buffer.concat(chunks).toString();
        try {
          const weatherData = JSON.parse(body);
          processTimestamps(weatherData);
          resolve({ success: true, ...weatherData });
        } catch (e) {
          reject({ status: 500, message: "Failed to parse weather data" });
        }
      });
    });

    req.on("error", (err) => {
      reject({ status: 500, message: err.message });
    });

    req.end();
  });
}

export default async function handler(req, res) {
  try {
    const result = await fetchWeather();
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
}
