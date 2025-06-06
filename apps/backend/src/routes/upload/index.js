const express = require('express');
const uploadRouter = express.Router();

uploadRouter.use('/presign', require('./presign'));

module.exports = uploadRouter;
