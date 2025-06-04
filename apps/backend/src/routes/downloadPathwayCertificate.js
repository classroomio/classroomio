const express = require('express');
const zod = require('zod');
const { generateCertificate } = require('../utils/certificate');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // Validate
    const mySchema = zod.object({
      theme: zod.string(),
      studentName: zod.string(),
      courseName: zod.string(),
      courseDescription: zod.string(),
      orgLogoUrl: zod.string(),
      orgName: zod.string(),
    });
    console.log('req.body', req.body);

    mySchema.parse(req.body);

    const pdfBuffer = await generateCertificate(req.body);

    res.contentType('application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error', error);
    res.json({
      success: false,
      error,
    });
  }
});

module.exports = router;
