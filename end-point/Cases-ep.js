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