const express = require('express');
const auth = require('../middleware/auth');
const { EmergencyContact } = require('../models');

const router = express.Router();

// Get all contacts
router.get('/', auth, async (req, res, next) => {
  try {
    const contacts = await EmergencyContact.findAll({
      where: { userId: req.userId }
    });
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

// Create contact
router.post('/', auth, async (req, res, next) => {
  try {
    const contact = await EmergencyContact.create({
      ...req.body,
      userId: req.userId
    });
    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
});

// Update contact
router.put('/:id', auth, async (req, res, next) => {
  try {
    const contact = await EmergencyContact.findOne({
      where: { id: req.params.id, userId: req.userId }
    });
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await contact.update(req.body);
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

// Delete contact
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const deleted = await EmergencyContact.destroy({
      where: { id: req.params.id, userId: req.userId }
    });
    
    if (!deleted) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
