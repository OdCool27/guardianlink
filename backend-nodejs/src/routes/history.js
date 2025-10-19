const express = require('express');
const auth = require('../middleware/auth');
const { AlertHistory } = require('../models');

const router = express.Router();

// Get user alert history
router.get('/', auth, async (req, res, next) => {
  try {
    const history = await AlertHistory.findAll({
      where: { userId: req.userId },
      order: [['timestamp', 'DESC']]
    });
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Get specific alert
router.get('/:id', auth, async (req, res, next) => {
  try {
    const alert = await AlertHistory.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
