const express = require('express');
const auth = require('../middleware/auth');
const { User, EmergencyContact, CompanionSession, LocationUpdate, AlertHistory } = require('../models');
const { sendCompanionModeAlert } = require('../utils/emailService');
const { sendCompanionModeSms } = require('../utils/smsService');
const { Op } = require('sequelize');

const router = express.Router();

// Start companion session
router.post('/start', auth, async (req, res, next) => {
  try {
    const { contactIds, durationMinutes, latitude, longitude } = req.body;
    const user = await User.findByPk(req.userId);

    // Check for active session
    const existingSession = await CompanionSession.findOne({
      where: { userId: req.userId, isActive: true }
    });

    if (existingSession) {
      return res.status(400).json({ 
        error: 'You already have an active companion session',
        existingSession: {
          id: existingSession.id,
          startTime: existingSession.startTime,
          endTime: existingSession.endTime,
          isSosTriggered: existingSession.isSosTriggered
        }
      });
    }

    const session = await CompanionSession.create({
      userId: req.userId,
      startTime: new Date(),
      endTime: new Date(Date.now() + durationMinutes * 60000),
      durationMinutes,
      isActive: true
    });

    const contacts = await EmergencyContact.findAll({
      where: { id: contactIds, userId: req.userId }
    });

    await session.setSharedWithContacts(contacts);

    await AlertHistory.create({
      userId: req.userId,
      eventType: 'COMPANION_STARTED',
      latitude,
      longitude,
      metadata: `Companion mode started for ${durationMinutes} minutes`
    });

    const locationLink = `${process.env.APP_BASE_URL}/track/${session.id}`;

    // Send notifications asynchronously (fire and forget - don't block response)
    setImmediate(() => {
      contacts.forEach(async (contact) => {
        try {
          if (user.companionUpdatesEnabled) {
            // Send email and SMS in parallel, don't await
            Promise.all([
              sendCompanionModeAlert(contact.email, user.fullName, locationLink, durationMinutes).catch(err =>
                console.error(`Email failed for ${contact.email}:`, err.message)
              ),
              contact.phoneNumber ? sendCompanionModeSms(contact.phoneNumber, user.fullName, locationLink, durationMinutes).catch(err =>
                console.error(`SMS failed for ${contact.phoneNumber}:`, err.message)
              ) : Promise.resolve()
            ]);
          }
        } catch (err) {
          console.error(`Failed to notify ${contact.email}:`, err);
        }
      });
    });

    // Return immediately - don't wait for notifications
    res.json({ sessionId: session.id, message: 'Companion mode started' });
  } catch (error) {
    next(error);
  }
});

// Stop companion session
router.post('/stop', auth, async (req, res, next) => {
  try {
    const updated = await CompanionSession.update(
      { isActive: false, stoppedAt: new Date() },
      { where: { userId: req.userId, isActive: true } }
    );

    if (!updated[0]) {
      return res.status(404).json({ error: 'No active session found' });
    }

    await AlertHistory.create({
      userId: req.userId,
      eventType: 'COMPANION_ENDED',
      metadata: 'Companion mode ended'
    });

    res.json({ message: 'Companion mode stopped' });
  } catch (error) {
    next(error);
  }
});

// Get active session
router.get('/active', auth, async (req, res, next) => {
  try {
    const session = await CompanionSession.findOne({
      where: { userId: req.userId, isActive: true },
      include: [{ model: EmergencyContact, as: 'sharedWithContacts' }]
    });

    if (!session) {
      return res.status(204).send();
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

// Update location
router.post('/location', auth, async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    
    const session = await CompanionSession.findOne({
      where: { userId: req.userId, isActive: true }
    });

    if (!session) {
      return res.status(404).json({ error: 'No active companion session' });
    }

    const location = await LocationUpdate.create({
      sessionId: session.id,
      latitude,
      longitude,
      accuracy
    });

    // Broadcast via WebSocket (handled in server.js)
    if (req.app.get('io')) {
      req.app.get('io').to(`session-${session.id}`).emit('location-update', { latitude, longitude, accuracy });
    }

    res.json({ message: 'Location updated' });
  } catch (error) {
    next(error);
  }
});

// Get sessions shared with me
router.get('/shared-with-me', auth, async (req, res, next) => {
  try {
    const currentUser = await User.findByPk(req.userId);
    
    if (!currentUser) {
      return res.json([]);
    }

    if (!currentUser.email) {
      console.log('User has no email, cannot find shared sessions');
      return res.json([]);
    }

    // Find all emergency contact records where I am listed as a contact
    // (matching by email or phone number)
    const contactsWhereIAmListed = await EmergencyContact.findAll({
      where: {
        [Op.or]: [
          { email: currentUser.email },
          // Optionally match by phone if you store it on User model
          // { phoneNumber: currentUser.phoneNumber }
        ]
      }
    });

    if (!contactsWhereIAmListed.length) {
      return res.json([]);
    }

    const contactIds = contactsWhereIAmListed.map(c => c.id);

    // Find active sessions that are shared with these contact records
    const sessions = await CompanionSession.findAll({
      where: { 
        isActive: true,
        userId: { [Op.ne]: req.userId } // Exclude my own sessions
      },
      include: [
        {
          model: EmergencyContact,
          as: 'sharedWithContacts',
          where: { id: contactIds },
          required: true
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    // Get latest location for each session separately
    const sessionsWithLocation = await Promise.all(
      sessions.map(async (session) => {
        const latestLocation = await LocationUpdate.findOne({
          where: { sessionId: session.id },
          attributes: ['latitude', 'longitude', 'accuracy', 'timestamp'],
          order: [['timestamp', 'DESC']]
        });
        
        return {
          ...session.toJSON(),
          latestLocation
        };
      })
    );

    res.json(sessionsWithLocation);
  } catch (error) {
    console.error('Error in /shared-with-me endpoint:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to load shared sessions',
      details: error.message 
    });
  }
});

// Get current user's active companion session
router.get('/my-active-session', auth, async (req, res, next) => {
  try {
    const activeSession = await CompanionSession.findOne({
      where: { 
        userId: req.userId,
        isActive: true 
      },
      include: [
        {
          model: EmergencyContact,
          as: 'sharedWithContacts',
          attributes: ['id', 'fullName', 'email', 'phoneNumber']
        }
      ]
    });

    if (!activeSession) {
      return res.json(null);
    }

    res.json(activeSession);
  } catch (error) {
    console.error('Error getting active session:', error);
    res.status(500).json({ 
      error: 'Failed to get active session',
      details: error.message 
    });
  }
});

// Public endpoint: Get session info for tracking (no auth required)
router.get('/track/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    const session = await CompanionSession.findOne({
      where: { 
        id: sessionId,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName']
        }
      ]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    // Check if session has expired
    if (new Date() > new Date(session.endTime)) {
      return res.status(410).json({ error: 'Session has expired' });
    }

    res.json({
      id: session.id,
      userName: session.user.fullName,
      startTime: session.startTime,
      endTime: session.endTime,
      isSosTriggered: session.isSosTriggered
    });
  } catch (error) {
    next(error);
  }
});

// Public endpoint: Get latest location for a session (no auth required)
router.get('/track/:sessionId/location', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // Verify session exists and is active
    const session = await CompanionSession.findOne({
      where: { 
        id: sessionId,
        isActive: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    // Check if session has expired
    if (new Date() > new Date(session.endTime)) {
      return res.status(410).json({ error: 'Session has expired' });
    }

    // Get the most recent location update
    const location = await LocationUpdate.findOne({
      where: { sessionId },
      order: [['timestamp', 'DESC']]
    });

    if (!location) {
      return res.status(404).json({ error: 'No location data available yet' });
    }

    res.json({
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: location.timestamp
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
