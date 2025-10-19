const User = require('./User');
const EmergencyContact = require('./EmergencyContact');
const CompanionSession = require('./CompanionSession');
const LocationUpdate = require('./LocationUpdate');
const AlertHistory = require('./AlertHistory');

// Define associations
User.hasMany(EmergencyContact, { foreignKey: 'userId', as: 'emergencyContacts' });
EmergencyContact.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(CompanionSession, { foreignKey: 'userId', as: 'companionSessions' });
CompanionSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

CompanionSession.hasMany(LocationUpdate, { foreignKey: 'sessionId', as: 'locationUpdates' });
LocationUpdate.belongsTo(CompanionSession, { foreignKey: 'sessionId' });

User.hasMany(AlertHistory, { foreignKey: 'userId', as: 'alertHistories' });
AlertHistory.belongsTo(User, { foreignKey: 'userId' });

// Many-to-many relationship between CompanionSession and EmergencyContact
CompanionSession.belongsToMany(EmergencyContact, {
  through: 'companion_session_contacts',
  foreignKey: 'session_id',
  otherKey: 'contact_id',
  as: 'sharedWithContacts'
});

EmergencyContact.belongsToMany(CompanionSession, {
  through: 'companion_session_contacts',
  foreignKey: 'contact_id',
  otherKey: 'session_id'
});

module.exports = {
  User,
  EmergencyContact,
  CompanionSession,
  LocationUpdate,
  AlertHistory
};
