const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const CasesEP = require('../end-point/Cases-ep')

const router = express.Router();

router.get(
    "/get-all-cases",
    authMiddleware,
    CasesEP.getCenterDetails
)

router.get('/get-selected-case/:caseId', 
    authMiddleware,
    CasesEP.getSelectedCaseEp
);

router.get('/get-pending-connections', 
    authMiddleware,
    CasesEP.getPendingConnectionDetailsEp
);

router.post('/create-connection', 
    authMiddleware,
    CasesEP.createConnectionEp
);

router.post('/create-connection-for-org', 
    authMiddleware,
    CasesEP.createConnectioOrgnEp
);

module.exports = router;