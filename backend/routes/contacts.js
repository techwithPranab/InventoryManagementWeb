const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { body, validationResult } = require('express-validator');
const { adminAuth } = require('../middleware/adminAuth');

// @route   GET /api/admin/contacts
// @desc    Get contact information
// @access  Public (for frontend) and Private (for admin)
router.get('/', async (req, res) => {
  try {
    const contact = await Contact.findOne().lean();

    if (!contact) {
      // Return default contact information if none exists
      return res.json({
        email: 'contact@inventorysystem.com',
        phone: '+1 (555) 123-4567',
        address: '123 Business Street, Suite 100, Business City, BC 12345',
        privacyEmail: 'privacy@inventorysystem.com',
        legalEmail: 'legal@inventorysystem.com',
        supportEmail: 'support@inventorysystem.com',
        businessName: 'Inventory Management System'
      });
    }

    res.json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/contacts
// @desc    Update contact information
// @access  Private (Admin only)
router.put('/', [
  adminAuth,
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim(),
  body('address').notEmpty().trim(),
  body('businessName').optional().trim(),
  body('privacyEmail').optional().isEmail().normalizeEmail(),
  body('legalEmail').optional().isEmail().normalizeEmail(),
  body('supportEmail').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, phone, address, businessName, privacyEmail, legalEmail, supportEmail } = req.body;

    let contact = await Contact.findOne();

    if (contact) {
      // Update existing contact
      contact.email = email;
      contact.phone = phone;
      contact.address = address;
      contact.businessName = businessName || contact.businessName;
      contact.privacyEmail = privacyEmail || email;
      contact.legalEmail = legalEmail || email;
      contact.supportEmail = supportEmail || email;
      contact.updatedBy = req.user._id;

      await contact.save();
    } else {
      // Create new contact
      contact = new Contact({
        email,
        phone,
        address,
        businessName: businessName || 'Inventory Management System',
        privacyEmail: privacyEmail || email,
        legalEmail: legalEmail || email,
        supportEmail: supportEmail || email,
        updatedBy: req.user._id
      });

      await contact.save();
    }

    res.json({
      message: 'Contact information updated successfully',
      contact
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/contacts/seed
// @desc    Seed default contact information
// @access  Private (Admin only)
router.post('/seed', adminAuth, async (req, res) => {
  try {
    const existingContact = await Contact.findOne();

    if (existingContact) {
      return res.status(400).json({ message: 'Contact information already exists' });
    }

    const contact = new Contact({
      email: 'contact@inventorysystem.com',
      phone: '+1 (555) 123-4567',
      address: '123 Business Street, Suite 100, Business City, BC 12345',
      privacyEmail: 'privacy@inventorysystem.com',
      legalEmail: 'legal@inventorysystem.com',
      supportEmail: 'support@inventorysystem.com',
      businessName: 'Inventory Management System',
      updatedBy: req.user._id
    });

    await contact.save();

    res.status(201).json({
      message: 'Default contact information created successfully',
      contact
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
