const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ScheduleEp = require('../end-point/Schedlues-ep')

const router = express.Router();

router.get('/get-case-details-for-hearing/:caseId', 
    authMiddleware,
    ScheduleEp.getCaseDetailsForHearingEp
);

router.post('/create-hearing', 
    authMiddleware,
    ScheduleEp.createHearingEp
);

module.exports = router;