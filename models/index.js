const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Import model functions
const User = require('./User');
const Task = require('./Task');
const Volunteer = require('./Volunteer');


Task.hasMany(Volunteer, { foreignKey: 'taskId' });
Volunteer.belongsTo(Task, { foreignKey: 'taskId' });

User.hasMany(Volunteer, { foreignKey: 'userId' });
Volunteer.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  Sequelize,
  User,
  Task,
  Volunteer
};
