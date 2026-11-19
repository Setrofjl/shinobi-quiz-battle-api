const { Router } = require('express');
const router = Router();

// Hub Contract endpoints
router.use('/health', require('./health.routes'));
router.use('/game-info', require('./game-info.routes'));
router.use('/results', require('./results.routes'));

// API documentation
router.use('/', require('./docs.routes'));

// Authentication
router.use('/auth', require('./auth.routes'));

// Admin user management
router.use('/users', require('./user.routes'));

module.exports = router;