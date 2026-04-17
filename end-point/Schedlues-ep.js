const ScheduleValidation = require('../validations/Schedules-validation')
const ScheduleDAO = require('../dao/Schedules-dao')


exports.getCaseDetailsForHearingEp = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
      const { caseId } = await ScheduleValidation.getparmasIdSchema.validateAsync(req.params);
      console.log('user', req.user);
      const result = await ScheduleDAO.getCaseDetailsForHearingDao(caseId);

      console.log('result', result)

      const parties = await ScheduleDAO.getCasePartyDetailsForHearingDao(caseId)
  
      res.status(200).json({  message: "Data found!", status: true, data: result, partyData: parties });
    } catch (error) {
      console.error("Error retrieving center data:", error);
      return res.status(500).json({ error: "An error occurred while fetching the company data" });
    }
  };

  exports.createHearingEp = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl);
  
    try {
      const userId = req.user.officerId;

      console.log(req.user)

      // const hearingData = req.body.payload
      const hearingData = {
        caseId: 3,
        caseNumber: 'dsdsdsdd',
        hearingType: 'FIRST_CALLING',
        hearingStatus: 'SCHEDULED',
        date: '2026-04-12',
        presidingJudge: 'sdsd',
        descriptions: { en: 'sdss', si: 'sdsd', ta: 'dsdsds' },
        parties: [ 12, 13 ]
      }

      const partyIds = hearingData.parties
      console.log('hearingData', hearingData)
      const result = await ScheduleDAO.createHearingDao(hearingData, userId);
  
      console.log('result', result)
  
      if (result.length === 0) {
        return res.json({ message: "hearing creation failed!", status: false });
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
