require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const bodyParser = require('body-parser');

const { router: uploadVideo, io: uploadVideoIo } = require('./src/routes/uploadVideo');
const downloadCertificate = require('./src/routes/downloadCertificate');
const downloadLesson = require('./src/routes/downloadLesson');
const downloadCourse = require('./src/routes/downloadCourse');

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

app.use('/downloadCertificate', downloadCertificate);
app.use('/downloadLesson', downloadLesson);
app.use('/downloadCourse', downloadCourse);
app.use('/uploadVideo', uploadVideo);

app.get('/', (req, res) => {
  res.send('Welcome to ClassroomIO');
});

const server = app.listen(port, () => {
  console.log(`ClassroomIO Backend listening on port ${port}!`);
});

uploadVideoIo.attach(server);
