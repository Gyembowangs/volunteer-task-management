// controllers/volunteerController.js
const { Volunteer, Task, User } = require('../models');

exports.applyForTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { name, email, course, year, phone } = req.body;
    const userId = req.session.user?.id;

    if (!userId) return res.status(401).send('User not authenticated');

    // 1. Check if task exists
    const task = await Task.findByPk(taskId);
    if (!task) return res.status(404).send('Task not found');

    // 2. Prevent duplicate application
    const alreadyApplied = await Volunteer.findOne({ where: { taskId, userId } });
    if (alreadyApplied) return res.status(400).send('Already applied for this task');

    // 3. Check volunteer limit
    if (task.currentVolunteers >= task.requiredVolunteers) {
      return res.status(400).send('Task already filled');
    }

    // 4. Create new volunteer entry
    await Volunteer.create({
      name,
      email,
      course,
      year,
      phone,
      taskId,
      userId
    });

    // 5. Increment volunteers and update status if needed
    task.currentVolunteers += 1;
    if (task.currentVolunteers >= task.requiredVolunteers) {
      task.isOpen = false;
    }

    // 6. Save task
    await task.save();
    console.log('✅ Task updated:', task.currentVolunteers);

    res.redirect('/dashboard');
  } catch (err) {
    console.error('❌ Error in applyForTask:', err);
    res.status(500).send('Server error');
  }
};
