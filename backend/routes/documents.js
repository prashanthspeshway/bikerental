import express from 'express';
import { authenticateToken } from './auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get user documents (or all documents if admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If admin, return all documents from all users with user info
    if (currentUser.role === 'admin') {
      const users = await User.find().select('name email documents');
      const allDocuments = [];
      
      users.forEach(user => {
        if (user.documents && user.documents.length > 0) {
          user.documents.forEach(doc => {
            allDocuments.push({
              id: doc._id.toString(),
              name: doc.name,
              type: doc.type,
              url: doc.url,
              status: doc.status,
              uploadedAt: doc.uploadedAt,
              userId: user._id.toString(),
              userName: user.name,
              userEmail: user.email,
            });
          });
        }
      });
      
      return res.json(allDocuments);
    }

    // Regular users get only their documents
    res.json(currentUser.documents || []);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

// Upload document
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, type, url } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newDocument = {
      name,
      type,
      url: url || '/documents/placeholder.pdf',
      status: 'pending',
      uploadedAt: new Date()
    };

    user.documents.push(newDocument);
    await user.save();

    const savedDoc = user.documents[user.documents.length - 1];
    res.status(201).json(savedDoc);
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Error uploading document' });
  }
});

// Update document status (admin only)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const currentUser = await User.findById(req.user.userId);
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Find user with this document
    const user = await User.findOne({ 'documents._id': req.params.id });
    if (!user) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const doc = user.documents.id(req.params.id);
    doc.status = status;
    await user.save();

    res.json(doc);
  } catch (error) {
    console.error('Update document status error:', error);
    res.status(500).json({ message: 'Error updating document status' });
  }
});

// Delete document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const doc = user.documents.id(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    doc.deleteOne();
    await user.save();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Error deleting document' });
  }
});

export default router;
