const { Task } = require('../models');
const createCsvWriter = require('csv-writer').createObjectCsvStringifier;

// GET /admin/dashboard - Show Admin Dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    const tasks = await Task.findAll({ include: 'Volunteers' });
    const user = req.session.user;
    res.render('admin-dashboard', { tasks, user });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).send('Error fetching tasks');
  }
};

// POST /admin/create-task - Create New Task
exports.createTask = async (req, res) => {
  const { title, description, location, date, requiredVolunteers } = req.body;

  if (!req.session.user || !req.session.isAdmin) {
    return res.status(401).send('Unauthorized');
  }

  if (!title || !description || !location || !date || !requiredVolunteers) {
    return res.status(400).send('All fields are required');
  }

  try {
    await Task.create({
      title,
      description,
      location,
      date,
      requiredVolunteers,
      isOpen: true,
      userId: req.session.user.id
    });
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).send('Error creating task');
  }
};

// POST /admin/delete/:id - Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).send('Task not found');

    await task.destroy();
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).send('Error deleting task');
  }
};

// GET /admin/volunteers/:id - View Volunteers for a Task
exports.viewVolunteers = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: 'Volunteers'
    });

    if (!task) return res.status(404).send('Task not found');

    res.render('volunteerdetail', { task });
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).send('Error fetching volunteers');
  }
};

// GET /admin/generate-link/:id - Generate Public Form Link
exports.generateLink = async (req, res) => {
  const taskId = req.params.id;
  const link = `${req.protocol}://${req.get('host')}/user/task-form/${taskId}`;
  res.send(`Public form link: <a href="${link}" target="_blank">${link}</a>`);
};

// GET /admin/edit-task/:id - Render Edit Form
exports.getEditTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).send('Task not found');

    res.render('edit-task', { task });
  } catch (err) {
    console.error('Error fetching task for edit:', err);
    res.status(500).send('Server error');
  }
};

// POST /admin/edit-task/:id - Update Task
// POST /admin/edit-task/:id - Update Task
exports.postEditTask = async (req, res) => {
  const { title, description, location, date, requiredVolunteers } = req.body;

  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).send('Task not found');

    // Update fields
    task.title = title;
    task.description = description;
    task.location = location;
    task.date = date;

    const newRequiredVol = parseInt(requiredVolunteers, 10);
    const currentVol = parseInt(task.currentVolunteers, 10);

    task.requiredVolunteers = newRequiredVol;

    // LOG: Debugging
    console.log(`Current Volunteers: ${currentVol}, New Required Volunteers: ${newRequiredVol}`);

    // Check if task should be open
    if (newRequiredVol > currentVol) {
      task.isOpen = true;
      console.log("Setting isOpen = true");
    } else {
      // Optional: close the task if currentVolunteers >= requiredVolunteers
      task.isOpen = false;
      console.log("Setting isOpen = false");
    }

    await task.save();
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).send('Server error');
  }
};

// GET /admin/download-volunteers/:id - Download Volunteers CSV
exports.downloadVolunteersCSV = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: 'Volunteers'
    });

    if (!task) return res.status(404).send('Task not found');
    const volunteers = task.Volunteers;

    if (!volunteers || volunteers.length === 0) {
      return res.status(404).send('No volunteers found for this task');
    }

    const csvStringifier = createCsvWriter({
      header: [
        { id: 'name', title: 'Name' },
        { id: 'course', title: 'Course' },
        { id: 'year', title: 'Year' },
        { id: 'phone', title: 'Phone' }
      ]
    });

    const records = volunteers.map(v => ({
      name: v.name,
      course: v.course,
      year: v.year,
      phone: v.phone
    }));

    const header = csvStringifier.getHeaderString();
    const csvData = csvStringifier.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="volunteers_task_${req.params.id}.csv"`);

    res.send(header + csvData);
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).send('Error generating CSV file');
  }
};
