const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlertHistory = sequelize.define('AlertHistory', {
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
  eventType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'event_type',
    validate: {
      isIn: [['SOS_ACTIVATED', 'SOS_CANCELLED', 'MARKED_SAFE', 'COMPANION_STARTED', 'COMPANION_ENDED']]
    }
  },
  latitude: {
    type: DataTypes.DOUBLE
  },
  longitude: {
    type: DataTypes.DOUBLE
  },
  metadata: {
    type: DataTypes.TEXT
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'alert_history',
  timestamps: false,
  underscored: true
});

module.exports = AlertHistory;
