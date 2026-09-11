const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const {
  requestMentorship, getMentorshipRequests, updateMentorshipStatus
} = require('../controllers/mentorshipController');

router.post('/', authenticateUser, requestMentorship);
router.get('/', authenticateUser, getMentorshipRequests);
router.put('/:id', authenticateUser, updateMentorshipStatus);

module.exports = router;
