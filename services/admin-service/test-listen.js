const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('ok'));
const server = app.listen(3011, () => console.log('Listening on 3011'));
