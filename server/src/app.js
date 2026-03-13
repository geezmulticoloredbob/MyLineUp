const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
  })
);
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'MyLineup API is running' });
});

app.use(errorHandler);

module.exports = app;
