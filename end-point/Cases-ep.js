const CaseValidation = require('../validations/Case-validation')
const CasesDAO = require('../dao/Cases-dao')


exports.getCenterDetails = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
      console.log('user', req.user);
      const courtId = req.user.courtId;
      const { province, district, searchText, page, limit } = req.query;
      const { totalItems, items } = await CasesDAO.getCenterDetailsDaoNew(
        courtId,
        province,
        district,
        searchText,
        parseInt(page),
        parseInt(limit)
      );
  
      res.status(200).json({ items, totalItems });
    } catch (error) {
      console.error("Error retrieving center data:", error);
      return res.status(500).json({ error: "An error occurred while fetching the company data" });
    }
  };

  exports.getSelectedCaseEp = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
        const { caseId } = await CaseValidation.getparmasIdSchema.validateAsync(req.params);
        const result = await CasesDAO.getCaseDetailsDao(caseId)
        if (result.length === 0) {
            return res.json({ message: "no data found!", status: false });
        }

        const parties = await CasesDAO.getCasePartiesDao(caseId)

        console.log('parties', parties)

        res.status(200).json({ message: "Data found!", status: true, data: result[0], partyData: parties });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
}


exports.getPendingConnectionDetailsEp = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl)
  try {
      const courtId = req.user.courtId;
      const {page, limit, searchText} = await CaseValidation.getAllConnectionDetailsSchema.validateAsync(req.query);
      // const {items, total} = await CasesDAO.getPendingConnectionDetailsDao(page, limit, searchText, courtId)
      const {indItems, indTotal} = await CasesDAO.getPendingConnectionDetailsIndividualDao(page, limit, searchText, courtId)
      const {orgItems, orgTotal} = await CasesDAO.getPendingConnectionDetailsOrgDao(page, limit, searchText, courtId)

      console.log('indItems', indItems, 'orgItems', orgItems)

      res.status(200).json({ message: "Data found!", status: true, indItems, indTotal, orgItems, orgTotal});
  } catch (error) {
      if (error.isJoi) {
          return res.status(400).json({ error: error.details[0].message });
      }

      console.error("Error fetching recived complaind:", error);
      return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
  }
}


exports.createConnectionEp = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl);

  try {
    const {  partyId, userId } = await CaseValidation.getConnectionSchema.validateAsync(req.body);

    const result = await CasesDAO.createConnectionDao(partyId, userId);

    console.log('result', result)

    if (result.length === 0) {
      return res.json({ message: "connection creation failed!", status: false });
   }

    return res.status(200).json({
      message: "Connection created!",
      status: true,
      data: result
    });

  } catch (error) {
    console.error("Error creating connection:", error);
    return res.status(500).json({
      error: "An error occurred while creating connection"
    });
  }
};

exports.rejectConnectionEp = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl);

  try {
    const {  partyId, userId } = await CaseValidation.getConnectionSchema.validateAsync(req.body);

    const result = await CasesDAO.rejectConnectionDao(partyId);

    console.log('result', result)

    if (result.length === 0) {
      return res.json({ message: "connection creation failed!", status: false });
   }

    return res.status(200).json({
      message: "Connection created!",
      status: true,
      data: result
    });

  } catch (error) {
    console.error("Error creating connection:", error);
    return res.status(500).json({
      error: "An error occurred while creating connection"
    });
  }
};



exports.createConnectioOrgnEp = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl);

  try {
    const {  partyId, userId, orgId, orgUserId } = await CaseValidation.getConnectionOrgSchema.validateAsync(req.body);

    const result = await CasesDAO.createConnectionOrgDao(orgUserId, userId, partyId);

    console.log('result', result)

    if (result.length === 0) {
      return res.json({ message: "connection creation failed!", status: false });
   }

   const resul2 = await CasesDAO.updateConnectionStatusOrgDao(partyId);

   if (resul2.length === 0) {
    return res.json({ message: "connection creation failed!", status: false });
 }


    return res.status(200).json({
      message: "Connection created!",
      status: true,
      data: result
    });

  } catch (error) {
    console.error("Error creating connection:", error);
    return res.status(500).json({
      error: "An error occurred while creating connection"
    });
  }
};

exports.rejectConnectioOrgnEp = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl);

  try {
    const {  partyId, userId, orgId, orgUserId } = await CaseValidation.getConnectionOrgSchema.validateAsync(req.body);

    const result = await CasesDAO.rejectConnectionOrgDao(orgUserId, userId, partyId);

    console.log('result', result)

    if (result.length === 0) {
      return res.json({ message: "connection creation failed!", status: false });
   }

//    const partyOrgUserConnectionStatus = await CasesDAO.rejectConnectionOrgDao(orgUserId);

let result2;

   const partyConnectionStatus = await CasesDAO.getPartyConnectionStatusDao(partyId);

   console.log('partyConnectionStatus', partyConnectionStatus.connectionstatus)

if (partyConnectionStatus.connectionstatus !== 'Connected') {
  result2 = await CasesDAO.updateConnectionStatusOrgRejectDao(partyId);

  if (result2.length === 0) {
    return res.json({ message: "connection creation failed!", status: false });
 }
}

    return res.status(200).json({
      message: "Connection rejected!",
      status: true,
      data: result
    });

  } catch (error) {
    console.error("Error creating connection:", error);
    return res.status(500).json({
      error: "An error occurred while creating connection"
    });
  }
};

exports.getOrganizationPartyUserDetailsEp = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
        const { partyId } = await CaseValidation.getPartyparmasIdSchema.validateAsync(req.params);
        const result = await CasesDAO.getOrganizationPartyUserDetailsDao(partyId)
        if (result.length === 0) {
            return res.json({ message: "no data found!", status: false });
        }

        res.status(200).json({ message: "Data found!", status: true, data: result });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
}


exports.createCaseEp = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl);

  try {
    const payload = req.body;
    const courtId = req.user.courtId;
    const userId = req.user.officerId;
    console.log('payload', payload);

    const {
      casenumber,
      casetype,
      descriptionEnglish,
      descriptionSinhala,
      descriptionTamil,
      casestatus,
      parties = [],
    } = payload;

    const caseDetails = {
      casenumber,
      casetype,
      descriptionEnglish,
      descriptionSinhala,
      descriptionTamil,
      casestatus,
    };

    // 1. Insert case
    const createdCaseId = await CasesDAO.createCaseDao(caseDetails, userId, courtId);

    if (!createdCaseId) {
      return res.status(400).json({ message: "Case creation failed!", status: false });
    }

    // 2. Insert each party independently
    for (const party of parties) {
      if (party.partytype === 'Organization') {
        const orgId = await CasesDAO.createOrganizationDao(party.organization);

        if (party.organization?.organizationusers?.length) {
          for (const orgUser of party.organization.organizationusers) {
            await CasesDAO.createOrganizationUserDao(orgId, orgUser);
          }
        }

        await CasesDAO.createCasePartyDao(createdCaseId, party, null, orgId);

      } else if (party.partytype === 'Individual') {
        await CasesDAO.createCasePartyDao(createdCaseId, party, null, null);
      }
    }

    return res.status(200).json({
      message: "Case created successfully!",
      status: true,
      caseId: createdCaseId,
    });

  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.error("Error creating case:", error);
    return res.status(500).json({ error: "An error occurred while creating the case" });
  }
};

exports.getApprovedConnectionDetailsEp = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl)
  try {
      const courtId = req.user.courtId;
      const {page, limit, searchText} = await CaseValidation.getAllConnectionDetailsSchema.validateAsync(req.query);
      const {indItems, indTotal} = await CasesDAO.getRejectedConnectionDetailsIndividualDao(page, limit, searchText, courtId)
      const {orgItems, orgTotal} = await CasesDAO.getRejectedConnectionDetailsOrgDao(page, limit, searchText, courtId)

      console.log('indItems', indItems)

      res.status(200).json({ message: "Data found!", status: true, indItems, indTotal, orgItems, orgTotal });
  } catch (error) {
      if (error.isJoi) {
          return res.status(400).json({ error: error.details[0].message });
      }

      console.error("Error fetching recived complaind:", error);
      return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
  }
}

exports.getRejectedConnectionDetailsEp = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl)
  try {
      const courtId = req.user.courtId;
      const {page, limit, searchText} = await CaseValidation.getAllConnectionDetailsSchema.validateAsync(req.query);
      const {indItems, indTotal} = await CasesDAO.getRejectedConnectionDetailsIndividualDao(page, limit, searchText, courtId)
      const {orgItems, orgTotal} = await CasesDAO.getRejectedConnectionDetailsOrgDao(page, limit, searchText, courtId)

      console.log('indItems', indItems)

      res.status(200).json({ message: "Data found!", status: true, indItems, indTotal, orgItems, orgTotal });
  } catch (error) {
      if (error.isJoi) {
          return res.status(400).json({ error: error.details[0].message });
      }

      console.error("Error fetching recived complaind:", error);
      return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
  }
}

exports.getPendingLawyers = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
      console.log('user', req.user);
      const { province, district, searchText, page, limit } = req.query;
      const { totalItems, items } = await CasesDAO.getPendingLawyersDao(
        province,
        district,
        searchText,
        parseInt(page),
        parseInt(limit)
      );

      console.log('items', items)
  
      res.status(200).json({ items, totalItems });
    } catch (error) {
      console.error("Error retrieving center data:", error);
      return res.status(500).json({ error: "An error occurred while fetching the company data" });
    }
  };

exports.approveLawyers = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log("fullUrl", fullUrl);

  try {
    console.log('user', req.user)
    const adminId = req.user?.adminId;
    if (!adminId) {
      return res.status(401).json({ error: "Unauthorized: missing admin user" });
    }

    // ✅ Validate request body
    const { id, status } = await CaseValidation.getlawyerStatusSchema.validateAsync(req.body);

    // ✅ Call DAO — it returns the updated row directly (not { result })
    const updatedLawyer = await CasesDAO.approveLawyerDao(id, status, adminId);

    // ✅ Handle "lawyer not found"
    if (!updatedLawyer) {
      return res.status(404).json({ error: "Lawyer not found" });
    }

    console.log("updatedLawyer", updatedLawyer);

    return res.status(200).json({
      message: `Lawyer ${status.toLowerCase()} successfully`,
      status: true,
      result: updatedLawyer,
    });
  } catch (error) {
    console.error("Error approving lawyer:", error);

    // ✅ Joi validation errors
    if (error.isJoi) {
      return res.status(400).json({ error: error.details[0].message });
    }

    return res.status(500).json({ error: "An error occurred while approving the lawyer" });
  }
};

exports.getApprovedLawyers = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
      console.log('user', req.user);
      const { tab, province, district, searchText, page, limit } = req.query;
      const { totalItems, items } = await CasesDAO.getApprovedLawyersDao(
        tab,
        province,
        district,
        searchText,
        parseInt(page),
        parseInt(limit)
      );

      console.log('items', items)
  
      res.status(200).json({ items, totalItems });
    } catch (error) {
      console.error("Error retrieving center data:", error);
      return res.status(500).json({ error: "An error occurred while fetching the company data" });
    }
  };