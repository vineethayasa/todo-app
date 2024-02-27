const { dirname } = require('path');
const app = require('./app');
const port = process.env.PORT || 3000;

const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync(path.join(__dirname,'cert','key.pem')),
  cert: fs.readFileSync(path.join(__dirname,'cert','cert.pem')),
};

const server = https.createServer(options, app);

server.listen(port, () => {
  console.log(`server listening at port - ${port}`);
});