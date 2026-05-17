const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const CoreEp = require('../end-point/core-ep')

const router = express.Router();

router.get(
    "/get-all-courts",
    authMiddleware,
    CoreEp.getCourtDetails
)

router.get(
    "/get-all-court-officer-details/:courtId",
    authMiddleware,
    CoreEp.getAllCourtOfficerDetails
)

router.get('/get-all-courts-for-dropdown', 
    authMiddleware,
    CoreEp.getAllCourts
);

router.post('/create-registrar', 
    authMiddleware,
    CoreEp.createRegitrar
);


router.get('/get-all-registrar-officer-details', 
    authMiddleware,
    CoreEp.getAllRegistrarOfficerDetails
);

router.post('/create-clerk', 
    authMiddleware,
    CoreEp.createClerk
);

router.get(
  "/get-clerk-details-by-id/:id",
    authMiddleware,
    CoreEp.getClerkDetailsById
);

router.put(
  "/update-clerk/:userId",
    authMiddleware,
    CoreEp.updateClerkDetails
);


module.exports = router;