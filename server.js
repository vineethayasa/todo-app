/* eslint-disable linebreak-style */
/* eslint-disable no-unused-vars */
const cluster = require('cluster');
const os = require('os');
const express = require('express');

if (cluster.isPrimary) {
  const totalCPUs = os.cpus().length;

  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.id} exited. Restarting...`);
    cluster.fork();
  });
} else {
  const app = require('./app');
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`Server listening at port-${port},Worker ${cluster.worker.id}`);
  });
}
