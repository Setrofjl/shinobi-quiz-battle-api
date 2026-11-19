// Builds the Express app. Does NOT start listening - server.js does that.
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middlewares/not-found');
const errorHandler = require('./middlewares/error-handler');
const currentUser = require('./middlewares/current-user');

const app = express();

app.use(
  cors({
    origin: env.corsOrigins,
  })
);

app.use(express.json());
app.use(currentUser);

// Hub Contract: every endpoint lives under /api/v1
app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;