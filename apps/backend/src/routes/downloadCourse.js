const express = require('express');
const zod = require('zod');
const { generateCoursePdf } = require('../utils/course.js');

const router = express.Router();

// localhost:3002/downloadCourse
router.post('/', async (req, res) => {
  try {
    // Validate
    const mySchema = zod.object({
      courseTitle: zod.string(),
      orgName: zod.string(),
      orgTheme: zod.string(),
      lessons: zod.array(
        zod.object({
          lessonTitle: zod.string(),
          lessonNumber: zod.string(),
          lessonNote: zod.string(),
          slideUrl: zod.string().optional(),
          video: zod.string().array().optional(),
        })
      ),
    });
    console.log('req.body', req.body);

    mySchema.parse(req.body);

    const pdfBuffer = await generateCoursePdf(req.body);

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
