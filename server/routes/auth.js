const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const { register, login, getMe, getUsers, updateProfile } = require('../controllers/authController');

// @route   POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], register);

// @route   POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

// @route   GET /api/auth/me
router.get('/me', auth, getMe);

// @route   PUT /api/auth/profile
router.put('/profile', auth, updateProfile);

// @route   GET /api/auth/users
router.get('/users', auth, getUsers);

module.exports = router;
