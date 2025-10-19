const express = require('express');
const { CompanionSession, LocationUpdate, User } = require('../models');

const router = express.Router();

// View live location (public, no auth)
router.get('/:sessionId', async (req, res, next) => {
  try {
    const session = await CompanionSession.findByPk(req.params.sessionId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['fullName']
        }
      ]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.isActive) {
      return res.json({
        active: false,
        message: 'This location sharing session has ended'
      });
    }

    const latestLocation = await LocationUpdate.findOne({
      where: { sessionId: session.id },
      order: [['timestamp', 'DESC']]
    });

    res.json({
      active: true,
      userName: session.user.fullName,
      startTime: session.startTime,
      endTime: session.endTime,
      isSosTriggered: session.isSosTriggered,
      location: latestLocation || null
    });
  } catch (error) {
    next(error);
  }
});

// Get location history
router.get('/:sessionId/history', async (req, res, next) => {
  try {
    const locations = await LocationUpdate.findAll({
      where: { sessionId: req.params.sessionId },
      order: [['timestamp', 'DESC']]
    });
    res.json(locations);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
