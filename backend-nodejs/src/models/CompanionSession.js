const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanionSession = sequelize.define('CompanionSession', {
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
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_time'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_time'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  isSosTriggered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_sos_triggered'
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    field: 'duration_minutes'
  },
  stoppedAt: {
    type: DataTypes.DATE,
    field: 'stopped_at'
  },
  distressDetected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'distress_detected'
  },
  distressContext: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'distress_context'
  }
}, {
  tableName: 'companion_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true
});

module.exports = CompanionSession;
