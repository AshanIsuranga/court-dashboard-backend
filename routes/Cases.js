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

router.post('/reject-connection', 
    authMiddleware,
    CasesEP.rejectConnectionEp
);

router.post('/create-connection-for-org', 
    authMiddleware,
    CasesEP.createConnectioOrgnEp
);

router.post('/reject-connection-for-org', 
    authMiddleware,
    CasesEP.rejectConnectioOrgnEp
);


router.get('/get-organization-party-details/:partyId', 
    authMiddleware,
    CasesEP.getOrganizationPartyUserDetailsEp
);


router.post('/create-case', 
    authMiddleware,
    CasesEP.createCaseEp
);

router.get('/get-approved-connections', 
    authMiddleware,
    CasesEP.getApprovedConnectionDetailsEp
);

router.get('/get-rejected-connections', 
    authMiddleware,
    CasesEP.getRejectedConnectionDetailsEp
);

router.get('/get-pending-lawyers', 
    authMiddleware,
    CasesEP.getPendingLawyers
);

router.post('/approve-lawyer', 
    authMiddleware,
    CasesEP.approveLawyers
);

router.get('/get-approved-lawyers', 
    authMiddleware,
    CasesEP.getApprovedLawyers
);

module.exports = router;