const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmergencyContact = sequelize.define('EmergencyContact', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'user_id'
  },
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'full_name'
  },
  phoneNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'phone_number'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'emergency_contacts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true
});

module.exports = EmergencyContact;
