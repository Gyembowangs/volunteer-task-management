const { Task, Volunteer } = require('../models');
const { Sequelize } = require('sequelize');

exports.getUserDashboard = async (req, res) => {
  try {
    const user = req.session.user;

    // Fetch all tasks for everyone (no filtering on isOpen)
    const allTasks = await Task.findAll({
      attributes: {
        include: [
          // Add volunteer count per task using subquery
          [Sequelize.literal(`(
            SELECT COUNT(*)
            FROM "Volunteers" AS volunteer
            WHERE volunteer."taskId" = "Task"."id"
          )`), 'currentVolunteers']
        ]
      },
      order: [['date', 'ASC']]
    });

    let appliedTaskIds = [];

    if (user) {
      // Find which tasks the user has applied for
      const userVolunteers = await Volunteer.findAll({
        where: { userId: user.id },
        attributes: ['taskId']
      });

      appliedTaskIds = userVolunteers.map(v => v.taskId);
    }

    // Prepare tasks with hasApplied flag and parse currentVolunteers
    const tasks = allTasks.map(task => {
      const t = task.get({ plain: true });
      t.currentVolunteers = parseInt(t.currentVolunteers, 10) || 0;
      t.hasApplied = appliedTaskIds.includes(t.id);
      return t;
    });

    res.render('dashboard', { tasks, user });
  } catch (error) {
    console.error('Error loading user dashboard:', error);
    res.status(500).send('Internal Server Error');
  }
};
