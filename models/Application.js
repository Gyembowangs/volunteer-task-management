const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
  message: DataTypes.STRING,
});

module.exports = Application;
