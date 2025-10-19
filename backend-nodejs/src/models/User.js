const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'full_name'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  profileImageUrl: {
    type: DataTypes.STRING(500),
    field: 'profile_image_url'
  },
  statusEmoji: {
    type: DataTypes.STRING(10),
    field: 'status_emoji'
  },
  statusText: {
    type: DataTypes.STRING(255),
    field: 'status_text'
  },
  safeword: {
    type: DataTypes.STRING(100)
  },
  theme: {
    type: DataTypes.STRING(20),
    defaultValue: 'automatic'
  },
  language: {
    type: DataTypes.STRING(10),
    defaultValue: 'en'
  },
  sosAlertsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'sos_alerts_enabled'
  },
  companionUpdatesEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'companion_updates_enabled'
  },
  statusUpdatesEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'status_updates_enabled'
  },
  elderlyMode: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'elderly_mode'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = User;
