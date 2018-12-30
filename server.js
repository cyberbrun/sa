const express = require('express');
const PORT = process.env.PORT || 8080;

var app = express();
app.use(express.static('./'));
const server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
