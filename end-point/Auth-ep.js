const AuthValidate = require('../validations/Auth-validation')
const AuthDAO = require('../dao/Auth-dao')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



exports.loginUser = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log('fullUrl', fullUrl)
  try {
    const { userName, password } = await AuthValidate.loginUserSchema.validateAsync(req.body);

    const prefix = userName.substring(0, 3).toUpperCase();

    console.log('prefix', prefix)
    console.log('userName', userName);

    let user;
    if (prefix === 'CLR' || prefix === 'REG') {
      // Use DAO method 1
      user = await AuthDAO.loginOfficerDao(userName);
    } else {
      // Use DAO method 2
      user = await AuthDAO.loginAdminUserDao(userName);
    }

    console.log('user', user)

    let verify_password;

    if (!user) {
      return res.status(401).json({ error: "User not found." });
    }
    // const comapny = await AuthDAO.getCompanyImages(user.companyId);
    
    if ((user.officerrole === 'Registrar' || user.officerrole === 'Clerk') && user.approvalstatus != 'APPROVED') {
      return res.status(401).json({ error: "Not a approved user" });
    }

    if (user) {
      console.log('user.password', user.password, password);

const verify_password = bcrypt.compareSync(password, user.password);

console.log('password match:', verify_password);

if (!verify_password) {
  return res.status(401).json({ error: "Wrong password." });
}

      if (verify_password) {

        let adminId;
        let officerId;
        let courtid;
        let userName;
        let role;

        let token; 

        if (prefix === 'CLR' || prefix === 'REG') {
          // Use DAO method 1
          officerId = user.id;
          token = jwt.sign(
            { officerId, courtId: user.courtid, officerCode: user.officercode, role: user.officerrole },
            process.env.JWT_SECRET,
            { expiresIn: "5h" }
          );
        } else {
          // Use DAO method 2
          
          adminId = user.id;
          token = jwt.sign(
            { adminId },
            process.env.JWT_SECRET,
            { expiresIn: "5h" }
          )
        }

        let data;

        if (prefix === 'CLR' || prefix === 'REG') {
          // Use DAO method 1
          adminId = null;
          officerId = user.id;
          courtid = user.courtid;
          userName = user.officercode;
          role = user.officerrole;
        } else {
          adminId = user.id;
          officerId = null;
          courtid = null;
          userName = user.username;
          role = 'Admin'
        }

          data = {
            token,
            officerId,
            adminId,
            role,
            userName: userName,
            updatedPassword: user.ispasswordchanged,
            expiresIn: 18000,
            courtid
          };

          console.log('data', data)

        return res.json(data);
      }
    }

    res.status(401).json({ error: "Invalid username or password." });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "An error occurred during login." });
  }
};
