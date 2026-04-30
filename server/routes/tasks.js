const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
  getDashboardStats
} = require('../controllers/taskController');

// @route   GET /api/tasks/dashboard/stats
// Must be before /:id route
router.get('/dashboard/stats', auth, getDashboardStats);

// @route   POST /api/tasks
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('project').notEmpty().withMessage('Project ID is required')
], createTask);

// @route   GET /api/tasks/project/:projectId
router.get('/project/:projectId', auth, getProjectTasks);

// @route   GET /api/tasks/:id
router.get('/:id', auth, getTask);

// @route   PUT /api/tasks/:id
router.put('/:id', auth, updateTask);

// @route   DELETE /api/tasks/:id
router.delete('/:id', auth, deleteTask);

module.exports = router;
