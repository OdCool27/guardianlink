const express = require('express');
const auth = require('../middleware/auth');
const { User, EmergencyContact, CompanionSession, AlertHistory } = require('../models');
const { sendSosAlert, sendSafeNotification } = require('../utils/emailService');
const { sendSosSms, sendSafeSms } = require('../utils/smsService');
const sequelize = require('../config/database');

const router = express.Router();

// Activate SOS
router.post('/activate', auth, async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { latitude, longitude } = req.body;
    const user = await User.findByPk(req.userId);
    const contacts = await EmergencyContact.findAll({ where: { userId: req.userId } });

    if (contacts.length === 0) {
      return res.status(400).json({ error: 'No emergency contacts configured' });
    }

    // Create a temporary tracking session for SOS (expires in 24 hours)
    const session = await CompanionSession.create({
      userId: req.userId,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      durationMinutes: 24 * 60,
      isActive: true,
      isSosTriggered: true // Mark as SOS-triggered session
    });

    // Log SOS activation
    await AlertHistory.create({
      userId: req.userId,
      eventType: 'SOS_ACTIVATED',
      latitude,
      longitude,
      metadata: 'SOS activated by user'
    }, { transaction });

    await transaction.commit();

    // Send notifications asynchronously (fire and forget - don't block response)
    setImmediate(() => {
      contacts.forEach(async (contact) => {
        try {
          if (user.sosAlertsEnabled) {
            // Create public tracking link
            const locationLink = `${process.env.APP_BASE_URL}/track/${session.id}`;
            
            // Send email and SMS in parallel, don't await
            Promise.all([
              sendSosAlert(contact.email, user.fullName, locationLink).catch(err => 
                console.error(`Email failed for ${contact.email}:`, err.message)
              ),
              contact.phoneNumber ? sendSosSms(contact.phoneNumber, user.fullName, locationLink).catch(err =>
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
    res.json({ message: 'SOS activated successfully', latitude, longitude });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

// Mark as safe
router.post('/mark-safe', auth, async (req, res, next) => {
  try {
    const { safeword } = req.body;
    const user = await User.findByPk(req.userId);

    // Validate safeword
    if (!safeword || safeword.trim() === '') {
      return res.status(400).json({ error: 'Safeword is required' });
    }

    // Case-insensitive comparison
    if (safeword.trim().toLowerCase() !== (user.safeword || '').toLowerCase()) {
      return res.status(403).json({ error: 'Incorrect safeword' });
    }

    const contacts = await EmergencyContact.findAll({ where: { userId: req.userId } });

    await AlertHistory.create({
      userId: req.userId,
      eventType: 'MARKED_SAFE',
      metadata: 'User marked as safe'
    });

    // Stop active session
    await CompanionSession.update(
      { isActive: false, stoppedAt: new Date() },
      { where: { userId: req.userId, isActive: true } }
    );

    // Notify contacts asynchronously (fire and forget)
    setImmediate(() => {
      contacts.forEach(async (contact) => {
        try {
          if (user.statusUpdatesEnabled) {
            Promise.all([
              sendSafeNotification(contact.email, user.fullName).catch(err =>
                console.error(`Email failed for ${contact.email}:`, err.message)
              ),
              contact.phoneNumber ? sendSafeSms(contact.phoneNumber, user.fullName).catch(err =>
                console.error(`SMS failed for ${contact.phoneNumber}:`, err.message)
              ) : Promise.resolve()
            ]);
          }
        } catch (err) {
          console.error(`Failed to notify ${contact.email}:`, err);
        }
      });
    });

    res.json({ message: 'Marked as safe successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
