const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember
} = require('../controllers/projectController');

// @route   POST /api/projects
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Project name is required')
], createProject);

// @route   GET /api/projects
router.get('/', auth, getProjects);

// @route   GET /api/projects/:id
router.get('/:id', auth, getProject);

// @route   PUT /api/projects/:id
router.put('/:id', auth, updateProject);

// @route   DELETE /api/projects/:id
router.delete('/:id', auth, deleteProject);

// @route   POST /api/projects/:id/members
router.post('/:id/members', auth, [
  body('email').isEmail().withMessage('Valid email is required')
], addMember);

// @route   DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', auth, removeMember);

module.exports = router;
