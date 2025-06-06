require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const bodyParser = require('body-parser');

const uploadRouter = require('./src/routes/upload');
const downloadCertificateRouter = require('./src/routes/downloadCertificate');
const downloadLessonRouter = require('./src/routes/downloadLesson');
const downloadCourseRouter = require('./src/routes/downloadCourse');
const katexRouter = require('./src/routes/katex');
const sendEmailRouter = require('./src/routes/sendEmail');

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

// Register routes
app.use('/downloadCertificate', downloadCertificateRouter);
app.use('/downloadLesson', downloadLessonRouter);
app.use('/downloadCourse', downloadCourseRouter);
app.use('/upload', uploadRouter);
app.use('/katex', katexRouter);
app.use('/sendEmail', sendEmailRouter);

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
  console.error('Exception error caught:', error);

  // Capture and send the error to Sentry
  // sentry.captureException(error);

  // Respond with a 500 Internal Server Error
  res.status(500).json({ error: 'Internal Server Error' });
});
