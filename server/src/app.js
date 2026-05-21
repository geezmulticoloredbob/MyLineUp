const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const env = require('./config/env');
const apiRoutes = require('./routes');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'MyLineup API is running' });
});

app.use(notFoundMiddleware);
app.use(errorHandler);

module.exports = app;
