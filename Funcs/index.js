const express = require('express');
const app = express();
app.use(express.json());

// Load your Funcs
require('./Funcs/GetStock.js')(app);
require('./Funcs/GrabWeather.js')(app); // Add others the same way

app.listen(3000, () => console.log('API LIVE 🚀'));
