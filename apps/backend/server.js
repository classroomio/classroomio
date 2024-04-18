require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const bodyParser = require('body-parser');
const sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

const uploadVideo = require('./src/routes/uploadVideo');
const downloadCertificate = require('./src/routes/downloadCertificate');
const downloadLesson = require('./src/routes/downloadLesson');
const downloadCourse = require('./src/routes/downloadCourse');
const katex = require('./src/routes/katex');
const sendEmail = require('./src/routes/sendEmail');

sentry.init({
  dsn: process.env.DSN || '',
  integrations: [new ProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0
});

// Express server
const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 1000,
  max: 10
});
app.use(limiter);

// Integrate Sentry middleware
app.use(sentry.Handlers.requestHandler());
app.use(sentry.Handlers.errorHandler());

// Register routes
app.use('/downloadCertificate', downloadCertificate);
app.use('/downloadLesson', downloadLesson);
app.use('/downloadCourse', downloadCourse);
app.use('/uploadVideo', uploadVideo);
app.use('/katex', katex);
app.use('/sendEmail', sendEmail);

app.get('/', (req, res) => {
  res.send('Welcome to ClassroomIO');
});

// Start server
app.listen(port, () => {
  console.log(`ClassroomIO Backend listening on port ${port}!`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught error', err);
});

// Error-handling middleware
app.use((error, req, res, next) => {
  console.error('Error caught:', error);

  // Capture and send the error to Sentry
  sentry.captureException(error);

  // Respond with a 500 Internal Server Error
  res.status(500).json({ error: 'Internal Server Error' });
});
