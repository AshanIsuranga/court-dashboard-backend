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
    console.log('fullUrl', fullUrl)
    try {

        const formData = req.body;
        console.log('req.body', req.body)
        console.log('formData', formData)
        const lastCode = await CoreDAO.getOfficerCodeDao(formData.officerrole)

        const prefix = formData.officerrole === 'Registrar' ? 'REG' : 'CLR';

        let nextId;

        if (!lastCode) {
            nextId = `${prefix}0001`;
        } else {
            const num = parseInt(lastCode.replace(prefix, ''), 10);
            const next = (num + 1).toString().padStart(4, '0');

            nextId = `${prefix}${next}`;
            
        }

        console.log('nextId', nextId)   
        const plainPassword = generatePassword(10);

        // 🔹 3. Hash password
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // 🔹 4. Send email
        await sendEmail(formData.email, nextId, plainPassword);

        const result = await CoreDAO.createRegistrarDao({
            ...formData,
            officercode: nextId,
            password: hashedPassword
        });

        // const result = await CoreDAO.createRegistrarDao()
        if (result.length === 0) {
            return res.json({ message: "no data found!", status: false });
        }

        res.status(200).json({
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

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
    
}

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
    console.log('fullUrl', fullUrl)
    try {

        const formData = req.body;
        const courtid = req.user.courtid
        console.log('req.body', req.body)
        console.log('formData', formData)
        const lastCode = await CoreDAO.getOfficerCodeDao(formData.officerrole)

        const prefix = formData.officerrole === 'Registrar' ? 'REG' : 'CLR';

        let nextId;

        if (!lastCode) {
            nextId = `${prefix}0001`;
        } else {
            const num = parseInt(lastCode.replace(prefix, ''), 10);
            const next = (num + 1).toString().padStart(4, '0');

            nextId = `${prefix}${next}`;
            
        }

        console.log('nextId', nextId)   
        const plainPassword = generatePassword(10);

        // 🔹 3. Hash password
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // 🔹 4. Send email
        await sendEmail(formData.email, nextId, plainPassword);

        const result = await CoreDAO.createClerkDao({
            ...formData,
            officercode: nextId,
            password: hashedPassword,
            courtid
        });

        // const result = await CoreDAO.createRegistrarDao()
        if (result.length === 0) {
            return res.json({ message: "no data found!", status: false });
        }

        res.status(200).json({
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

        console.error("Error fetching recived complaind:", error);
        return res.status(500).json({ error: "An error occurred while fetching recived complaind" });
    }
    
}