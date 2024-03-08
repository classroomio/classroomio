const express = require('express');
const zod = require('zod');
const { generateLessonPdf } = require('../utils/lesson');

const router = express.Router();

const lesson = {
  title: '',
  number: '01',
  orgName: '',
  note: '',
  slideUrl: '',
  video: [],
  courseTitle: '',
};

// localhost:3002/downloadLesson
router.post('/', async (req, res) => {
  try {
    // Validate
    const mySchema = zod.object({
      title: zod.string(),
      number: zod.string(),
      orgName: zod.string(),
      note: zod.string(),
      slideUrl: zod.string().optional(),
      video: zod.string().array().optional(),
      courseTitle: zod.string(),
    });
    console.log('req.body', req.body);

    mySchema.parse(req.body);

    const pdfBuffer = await generateLessonPdf(req.body);

    res.contentType('application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error', error);
    res.status(400).json({
      success: false,
      error,
    });
  }
});

module.exports = router;
