const express = require('express');
const router = express.Router();
const { getQuestions, askQuestion, getAnswers, answerQuestion } = require('../controllers/questionController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

router.get('/', getQuestions);                             // public
router.get('/:id/answers', getAnswers);                   // public
router.post('/', authenticateUser, askQuestion);           // any logged-in user
router.post('/:id/answers', authenticateUser, authorizeRole('EXPERT', 'SELLER', 'ADMIN'), answerQuestion);

module.exports = router;
