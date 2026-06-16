const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holidayController');

router.get('/', holidayController.getAllHolidays);
router.post('/', holidayController.createHoliday);

module.exports = router;
