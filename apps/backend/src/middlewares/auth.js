const { validateUser } = require('../utils/auth/validate-user');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization header provided'
      });
    }

    // Extract the token from "Bearer <token>"
    const token = authHeader.split(' ')[1];
    console.log('token', token);
    console.log('authHeader', authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header format'
      });
    }

    const user = await validateUser(token);
    req.user = user; // Attach the user to the request object
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
};

module.exports = authMiddleware;
