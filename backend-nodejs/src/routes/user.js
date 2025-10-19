const express = require('express');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const { User } = require('../models');

const router = express.Router();

// Get current user
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/me', auth, async (req, res, next) => {
  try {
    const { 
      fullName, 
      profileImageUrl, 
      statusEmoji, 
      statusText, 
      safeword,
      theme,
      language,
      sosAlertsEnabled,
      companionUpdatesEnabled,
      statusUpdatesEnabled
    } = req.body;
    
    const updateData = {};
    
    // Only update fields that are provided
    if (fullName !== undefined) updateData.fullName = fullName;
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
    if (statusEmoji !== undefined) updateData.statusEmoji = statusEmoji;
    if (statusText !== undefined) updateData.statusText = statusText;
    if (safeword !== undefined) updateData.safeword = safeword;
    if (theme !== undefined) updateData.theme = theme;
    if (language !== undefined) updateData.language = language;
    if (sosAlertsEnabled !== undefined) updateData.sosAlertsEnabled = sosAlertsEnabled;
    if (companionUpdatesEnabled !== undefined) updateData.companionUpdatesEnabled = companionUpdatesEnabled;
    if (statusUpdatesEnabled !== undefined) updateData.statusUpdatesEnabled = statusUpdatesEnabled;
    
    await User.update(updateData, { where: { id: req.userId } });
    
    const user = await User.findByPk(req.userId, { attributes: { exclude: ['password'] } });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Change password
router.post('/password', auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.userId);
    
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Update settings
router.put('/settings', auth, async (req, res, next) => {
  try {
    const settings = req.body;
    await User.update(settings, { where: { id: req.userId } });
    const user = await User.findByPk(req.userId, { attributes: { exclude: ['password'] } });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
