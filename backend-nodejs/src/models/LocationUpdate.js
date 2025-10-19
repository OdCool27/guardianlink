const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LocationUpdate = sequelize.define('LocationUpdate', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  sessionId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: 'session_id'
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: false
  },
  accuracy: {
    type: DataTypes.DOUBLE
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'location_updates',
  timestamps: false,
  underscored: true
});

module.exports = LocationUpdate;
