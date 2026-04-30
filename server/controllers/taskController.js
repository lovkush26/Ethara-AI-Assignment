const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

// @desc    Create a new task
// @route   POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, project, assignee, priority, dueDate } = req.body;

    // Verify project exists and user is a member
    const proj = await Project.findById(project);
    if (!proj) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = proj.members.some(m => m.toString() === req.user._id.toString());
    const isAdmin = proj.admin.toString() === req.user._id.toString();

    if (!isMember && !isAdmin) {
      return res.status(403).json({ message: 'You must be a project member to create tasks' });
    }

    // Only admin can assign tasks to others
    if (assignee && !isAdmin && assignee !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can assign tasks to other members' });
    }

    const task = new Task({
      title,
      description,
      project,
      assignee: assignee || null,
      createdBy: req.user._id,
      priority: priority || 'Medium',
      dueDate: dueDate || null
    });

    await task.save();

    // Create notification for assignee if exists
    if (assignee && assignee !== req.user._id.toString()) {
      await Notification.create({
        user: assignee,
        type: 'accent',
        title: 'New Task Assigned',
        message: `You have been assigned to: ${title}`,
        project: proj._id,
        task: task._id,
        targetUrl: `/projects/${proj._id}`
      });
    }

    await task.populate(['assignee', 'createdBy']);

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
};

// @desc    Get tasks for a project
// @route   GET /api/tasks/project/:projectId
exports.getProjectTasks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some(m => m.toString() === req.user._id.toString());
    const isAdmin = project.admin.toString() === req.user._id.toString();

    if (!isMember && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let query = { project: req.params.projectId };

    // Members can only see their assigned tasks
    if (!isAdmin) {
      query.assignee = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name admin');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching task' });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const isAdmin = project.admin.toString() === req.user._id.toString();
    const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();

    // Members can only update status of their assigned tasks
    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, assignee, status, priority, dueDate } = req.body;

    const oldStatus = task.status;
    const oldAssignee = task.assignee ? task.assignee.toString() : null;

    // Members can only update status
    if (!isAdmin) {
      if (status) task.status = status;
    } else {
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignee !== undefined) task.assignee = assignee || null;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
    }

    await task.save();
    await task.populate(['assignee', 'createdBy']);

    // NOTIFICATIONS
    // 1. If assigned to someone new
    if (isAdmin && task.assignee && task.assignee._id.toString() !== oldAssignee && task.assignee._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: task.assignee._id,
        type: 'accent',
        title: 'Task Assigned',
        message: `You were assigned a task: ${task.title}`,
        project: project._id,
        task: task._id,
        targetUrl: `/projects/${project._id}`
      });
    }

    const currentAssignee = task.assignee ? task.assignee._id.toString() : null;

    // 2. If removed from a task, notify the old assignee
    if (isAdmin && oldAssignee && oldAssignee !== currentAssignee && oldAssignee !== req.user._id.toString()) {
      await Notification.create({
        user: oldAssignee,
        type: 'warning',
        title: 'Task Removed',
        message: `You were removed from the task: ${task.title}`,
        project: project._id,
        task: task._id,
        targetUrl: `/projects/${project._id}`
      });
    }

    // 3. If a member updates progress, notify admin
    if (status && status !== oldStatus && req.user._id.toString() !== project.admin.toString()) {
      await Notification.create({
        user: project.admin,
        type: status === 'Done' ? 'success' : 'info',
        title: status === 'Done' ? 'Task Completed' : 'Task Progress Updated',
        message: `${req.user.name} moved "${task.title}" from ${oldStatus} to ${status}`,
        project: project._id,
        task: task._id,
        targetUrl: `/projects/${project._id}`
      });
    }

    // 4. If admin updates status, notify assignee
    if (isAdmin && status && status !== oldStatus && task.assignee && task.assignee._id.toString() !== req.user._id.toString()) {
       await Notification.create({
        user: task.assignee._id,
        type: 'info',
        title: 'Task Updated',
        message: `Status of "${task.title}" changed to ${status}`,
        project: project._id,
        task: task._id,
        targetUrl: `/projects/${project._id}`
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating task' });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const isAdmin = project.admin.toString() === req.user._id.toString();

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admin can delete tasks' });
    }

    if (task.assignee && task.assignee.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: task.assignee,
        type: 'danger',
        title: 'Task Removed',
        message: `The task "${task.title}" was removed from project: ${project.name}`,
        project: project._id,
        task: task._id,
        targetUrl: `/projects/${project._id}`
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting task' });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/tasks/dashboard/stats
exports.getDashboardStats = async (req, res) => {
  try {
    // Get all projects where user is a member
    const projects = await Project.find({
      $or: [
        { admin: req.user._id },
        { members: req.user._id }
      ]
    });

    const projectIds = projects.map(p => p._id);

    // Get all tasks in user's projects
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignee', 'name email')
      .populate('project', 'name');

    const now = new Date();

    // Total tasks
    const totalTasks = allTasks.length;

    // Tasks by status
    const tasksByStatus = {
      'To Do': allTasks.filter(t => t.status === 'To Do').length,
      'In Progress': allTasks.filter(t => t.status === 'In Progress').length,
      'Done': allTasks.filter(t => t.status === 'Done').length
    };

    // Tasks by priority
    const tasksByPriority = {
      'Low': allTasks.filter(t => t.priority === 'Low').length,
      'Medium': allTasks.filter(t => t.priority === 'Medium').length,
      'High': allTasks.filter(t => t.priority === 'High').length,
      'Critical': allTasks.filter(t => t.priority === 'Critical').length
    };

    // Overdue tasks
    const overdueTasks = allTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done'
    ).length;

    // Tasks per user
    const tasksPerUser = {};
    allTasks.forEach(task => {
      if (task.assignee) {
        const key = task.assignee.name;
        if (!tasksPerUser[key]) {
          tasksPerUser[key] = { total: 0, done: 0 };
        }
        tasksPerUser[key].total++;
        if (task.status === 'Done') tasksPerUser[key].done++;
      }
    });

    // My tasks
    const myTasks = allTasks.filter(
      t => t.assignee && t.assignee._id.toString() === req.user._id.toString()
    ).length;

    // Recent tasks
    const recentTasks = allTasks
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    res.json({
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      tasksPerUser,
      myTasks,
      totalProjects: projects.length,
      recentTasks
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};
