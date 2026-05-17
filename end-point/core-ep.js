const CoreValidation = require('../validations/core-validaion')
const CoreDAO = require('../dao/core-dao')
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');


exports.getCourtDetails = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
      console.log('user', req.user);
    //   const courtId = req.user.courtId;
      const { province, district, searchText, page, limit } = req.query;
      const { totalItems, items } = await CoreDAO.getCourtDetailsDaoNew(
        province,
        district,
        searchText,
        parseInt(page),
        parseInt(limit)
      );

      console.log('items', items)
  
      res.status(200).json({ totalItems, items });
    } catch (error) {
      console.error("Error retrieving center data:", error);
      return res.status(500).json({ error: "An error occurred while fetching the data" });
    }
  };

exports.getAllCourtOfficerDetails = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
      console.log('user', req.user);
    //   const courtId = req.user.courtId;
      const {courtId} = req.params
      console.log('courtId', req.params)
      const { province, district, searchText, page, limit } = req.query;
      const { totalItems, items } = await CoreDAO.getCourtOfficerDetailsDao(
        Number(courtId),
        province,
        district,
        searchText,
        parseInt(page),
        parseInt(limit)
      );

      console.log('items', items)
  
      res.status(200).json({ totalItems, items });
    } catch (error) {
      console.error("Error retrieving center data:", error);
      return res.status(500).json({ error: "An error occurred while fetching the data" });
    }
  };

  exports.getAllCourts = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
        const result = await CoreDAO.getAllCourtsDao()
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


  exports.createRegitrar = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl);

    try {
        const formData = req.body;

        console.log('req.body', req.body);

        // 🔹 1. CHECK DUPLICATES FIRST
        const duplicateFields = [];

        const existingUser = await CoreDAO.checkRegistrarDuplicatesDao({
            nic: formData.nic,
            email: formData.email,
            phoneNumber01: formData.phonenumber01,
            phoneNumber02: formData.phonenumber02
        });


        if (existingUser?.nic) duplicateFields.push("nic");
        if (existingUser?.email) duplicateFields.push("email");
        if (existingUser?.phoneNumber01) duplicateFields.push("phoneNumber01");
        if (existingUser?.phoneNumber02) duplicateFields.push("phoneNumber02");

        if (duplicateFields.length > 0) {
            return res.status(409).json({
                status: false,
                message: "Duplicate fields found",
                duplicates: duplicateFields
            });
        }

        // 🔹 2. GENERATE OFFICER CODE
        const lastCode = await CoreDAO.getOfficerCodeDao(formData.officerrole);

        const prefix = formData.officerrole === 'Registrar' ? 'REG' : 'CLR';

        let nextId;

        if (!lastCode) {
            nextId = `${prefix}0001`;
        } else {
            const num = parseInt(lastCode.replace(prefix, ''), 10);
            const next = (num + 1).toString().padStart(4, '0');
            nextId = `${prefix}${next}`;
        }

        console.log('nextId', nextId);

        // 🔹 3. PASSWORD GENERATION
        const plainPassword = generatePassword(10);

        // 🔹 4. HASH PASSWORD
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // 🔹 5. SEND EMAIL
        await sendEmail(formData.email, nextId, plainPassword);

        // 🔹 6. CREATE USER
        const result = await CoreDAO.createRegistrarDao({
            ...formData,
            officercode: nextId,
            password: hashedPassword
        });

        if (!result) {
            return res.json({ message: "no data found!", status: false });
        }

        return res.status(200).json({
            status: true,
            message: "Registrar created successfully",
            data: {
                officercode: nextId
            }
        });

    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error creating registrar:", error);
        return res.status(500).json({
            error: "An error occurred while creating registrar"
        });
    }
};

function generatePassword(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
    let password = '';

    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
}


async function sendEmail(toEmail, officerCode, password) {
    console.log('officerCode', officerCode)

//     const transporter = nodemailer.createTransport({
//     host: 'smtp.gmail.com',
//     port: 587,
//     secure: false, 
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
// });

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false 
    }
});

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: 'Your Account Credentials',
            html: `
            <h3>Welcome to Court System</h3>
            <p><b>Officer Code:</b> ${officerCode}</p>
            <p><b>Password:</b> ${password}</p>
            <p>Please change your password after login.</p>
        `
        };


    await transporter.sendMail(mailOptions);
}


exports.getAllRegistrarOfficerDetails = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl)
    try {
      console.log('user', req.user);
      const courtId = req.user.courtId;
      const { searchText, page, limit } = req.query;
      const { totalItems, items } = await CoreDAO.getRegistrarOfficerDetailsDao(
        Number(courtId),
        searchText,
        parseInt(page),
        parseInt(limit)
      );

      console.log('items', items)
  
      res.status(200).json({ totalItems, items });
    } catch (error) {
      console.error("Error retrieving center data:", error);
      return res.status(500).json({ error: "An error occurred while fetching the data" });
    }
  };


exports.createClerk = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl);

    try {
        const formData = req.body;
        const courtid = req.user.courtid;

        console.log('req.body', req.body);

        // 🔥 1. DUPLICATE CHECK FIRST
        const duplicateFields = [];

        const existing = await CoreDAO.checkClerkDuplicatesDao({
            nic: formData.nic,
            email: formData.email,
            phoneNumber01: formData.phoneNumber01,
            phoneNumber02: formData.phoneNumber02
        });

        if (existing?.nic) duplicateFields.push("nic");
        if (existing?.email) duplicateFields.push("email");
        if (existing?.phoneNumber01) duplicateFields.push("phoneNumber01");
        if (existing?.phoneNumber02) duplicateFields.push("phoneNumber02");

        if (duplicateFields.length > 0) {
            return res.status(409).json({
                status: false,
                message: "Duplicate fields found",
                duplicates: duplicateFields
            });
        }

        // 🔢 2. GENERATE OFFICER CODE
        const lastCode = await CoreDAO.getOfficerCodeDao(formData.officerrole);

        const prefix = formData.officerrole === 'Registrar' ? 'REG' : 'CLR';

        let nextId;

        if (!lastCode) {
            nextId = `${prefix}0001`;
        } else {
            const num = parseInt(lastCode.replace(prefix, ''), 10);
            const next = (num + 1).toString().padStart(4, '0');
            nextId = `${prefix}${next}`;
        }

        console.log('nextId', nextId);

        // 🔐 3. PASSWORD GENERATION
        const plainPassword = generatePassword(10);

        // 🔐 4. HASH PASSWORD
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // 📧 5. SEND EMAIL
        await sendEmail(formData.email, nextId, plainPassword);

        // 💾 6. CREATE CLERK
        const result = await CoreDAO.createClerkDao({
            ...formData,
            officercode: nextId,
            password: hashedPassword,
            courtid
        });

        if (!result) {
            return res.status(400).json({
                status: false,
                message: "Failed to create clerk"
            });
        }

        return res.status(200).json({
            status: true,
            message: "Clerk created successfully",
            data: {
                officercode: nextId
            }
        });

    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ error: error.details[0].message });
        }

        console.error("Error creating clerk:", error);

        return res.status(500).json({
            status: false,
            error: "An error occurred while creating clerk"
        });
    }
};

exports.updateClerkDetails = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl);
    try {
        const userId = req.params.userId;
        const formData = req.body;

        if (!userId) {
            return res.status(400).json({ status: false, message: "User ID is required" });
        }

        const duplicateFields = [];

        const existing = await CoreDAO.checkClerkDuplicatesExcludingSelfDao({
            id: userId,
            nic: formData.nic,
            email: formData.email,
            phonenumber01: formData.phonenumber01,
            phonenumber02: formData.phonenumber02
        });

        if (existing?.nic) duplicateFields.push("nic");
        if (existing?.email) duplicateFields.push("email");
        if (existing?.phonenumber01) duplicateFields.push("phonenumber01");
        if (existing?.phonenumber02) duplicateFields.push("phonenumber02");

        if (duplicateFields.length > 0) {
            return res.status(409).json({
                status: false,
                message: "Duplicate fields found",
                duplicates: duplicateFields
            });
        }

        console.log('duplicateFields', duplicateFields)

        const result = await CoreDAO.updateClerkDao(userId, formData);

        if (!result) {
            return res.status(404).json({ status: false, message: "Clerk not found" });
        }

        return res.status(200).json({ status: true, message: "Clerk updated successfully", data: result });

    } catch (error) {
        console.error("Error updating clerk:", error);
        return res.status(500).json({ status: false, error: "An error occurred while updating clerk" });
    }
};

exports.getClerkDetailsById = async (req, res) => {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    console.log('fullUrl', fullUrl);
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(400).json({
                status: false,
                message: "User ID is required"
            });
        }

        const result = await CoreDAO.getClerkDetailsByIdDao(userId);
        console.log('result', result)

        if (!result) {
            return res.status(404).json({
                status: false,
                message: "Clerk not found"
            });
        }

        return res.status(200).json({
            status: true,
            data: result
        });

    } catch (error) {
        console.error("Error fetching clerk details:", error);

        return res.status(500).json({
            status: false,
            message: "Server error while fetching clerk details"
        });
    }
};