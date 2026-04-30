const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new project
// @route   POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const project = new Project({
      name,
      description,
      admin: req.user._id,
      members: [req.user._id] // Admin is also a member
    });

    await project.save();
    await project.populate(['admin', 'members']);

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
};

// @desc    Get all projects for current user
// @route   GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { admin: req.user._id },
        { members: req.user._id }
      ]
    })
      .populate('admin', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching projects' });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a member or admin
    const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
    const isAdmin = project.admin._id.toString() === req.user._id.toString();

    if (!isMember && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching project' });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only admin can update
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project admin can update' });
    }

    const { name, description } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;

    await project.save();
    await project.populate(['admin', 'members']);

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating project' });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only admin can delete
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project admin can delete' });
    }

    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });

    const memberIds = project.members
      .map(member => member.toString())
      .filter(memberId => memberId !== req.user._id.toString());

    if (memberIds.length > 0) {
      await Notification.insertMany(memberIds.map(memberId => ({
        user: memberId,
        type: 'danger',
        title: 'Project Removed',
        message: `The project "${project.name}" has been removed.`,
        project: project._id
      })));
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project and all associated tasks deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting project' });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
exports.addMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only admin can add members
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project admin can add members' });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Check if already a member
    if (project.members.includes(user._id)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push(user._id);
    await project.save();
    
    // Create notification for the added user
    await Notification.create({
      user: user._id,
      type: 'success',
      title: 'Added to Project',
      message: `You have been added to the project: ${project.name}`,
      project: project._id,
      targetUrl: `/projects/${project._id}`
    });

    await project.populate(['admin', 'members']);

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error adding member' });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only admin can remove members
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project admin can remove members' });
    }

    // Can't remove admin
    if (req.params.userId === project.admin.toString()) {
      return res.status(400).json({ message: 'Cannot remove the project admin' });
    }

    project.members = project.members.filter(
      m => m.toString() !== req.params.userId
    );

    await project.save();

    // Create notification for the removed user
    await Notification.create({
      user: req.params.userId,
      type: 'danger',
      title: 'Removed from Project',
      message: `You have been removed from the project: ${project.name}`,
      project: project._id
    });

    await project.populate(['admin', 'members']);

    // Unassign tasks from removed member
    await Task.updateMany(
      { project: project._id, assignee: req.params.userId },
      { assignee: null }
    );

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error removing member' });
  }
};
