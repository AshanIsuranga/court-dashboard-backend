const { pool } = require('../config/db');

exports.getCourtDetailsDaoNew = (province, district, searchText, page, limit) => {
    return new Promise((resolve, reject) => {
        // Validate input parameters

        page = page || 1;
        limit = limit || 10;

        const offset = (page - 1) * limit;
        let paramIndex = 1;

        let queryParams = [];
        let countParams = [];

        // Base count query
        let countSql = `
            SELECT COUNT(*) as "totalCount" from public.courts c WHERE 1 = 1
        `;

        // Base data query
        let dataSql = `
            SELECT * from public.courts c WHERE 1 = 1
        `;

        // Add search conditions if searchText is provided
        if (searchText) {
            dataSql += ` AND (c.courtnameenglish ILIKE $${paramIndex} )`;
            countSql += ` AND (c.courtnameenglish ILIKE $${paramIndex} )`;
            queryParams.push(`%${searchText}%`);
            countParams.push(`%${searchText}%`);
            paramIndex += 1;
        }

        if (province) {
            dataSql += ` AND c.province = $${paramIndex} `;
            countSql += ` AND c.province = $${paramIndex} `;
            queryParams.push(province);
            countParams.push(province);
            paramIndex += 1;
        }

        // Add conditions for district if provided
        if (district) {
            dataSql += ` AND c.district = $${paramIndex} `;
            countSql += ` AND c.district = $${paramIndex} `;
            queryParams.push(district);
            countParams.push(district);
            paramIndex += 1;
        }

        // Add pagination
        dataSql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        // Execute both queries using pool
        Promise.all([
            pool.query(dataSql, queryParams),
            pool.query(countSql, countParams)
        ])
        .then(([dataResults, countResults]) => {
            const totalItems = parseInt(countResults.rows[0].totalCount);
            const totalPages = Math.ceil(totalItems / limit);

            console.log('results', dataResults.rows)

            resolve({
                totalItems,
                items: dataResults.rows
            });
        })
        .catch((err) => {
            console.error('Error executing query:', err);
            reject(err);
        });
    });
};

exports.getCourtOfficerDetailsDao = (courtId, province, district, searchText, page, limit) => {
    return new Promise((resolve, reject) => {
        // Validate input parameters

        page = page || 1;
        limit = limit || 10;

        const offset = (page - 1) * limit;
        let paramIndex = 1;

        let queryParams = [courtId];
        let countParams = [courtId];

        // Base count query
        let countSql = `
            SELECT COUNT(*) as "totalCount" from public.officers c WHERE courtid = $${paramIndex}
        `;

        // Base data query
        let dataSql = `
            SELECT * from public.officers c WHERE courtid = $${paramIndex}
        `;

        paramIndex += 1;

        // Add search conditions if searchText is provided
        if (searchText) {
            dataSql += ` AND (c.firstname ILIKE $${paramIndex} OR c.officercode ILIKE $${paramIndex} OR c.officerrole ILIKE $${paramIndex} )`;
            countSql += ` AND (c.firstname ILIKE $${paramIndex} OR c.officercode ILIKE $${paramIndex} OR c.officerrole ILIKE $${paramIndex})`;
            queryParams.push(`%${searchText}%`);
            countParams.push(`%${searchText}%`);
            paramIndex += 1;
        }

        if (province) {
            dataSql += ` AND c.province = $${paramIndex} `;
            countSql += ` AND c.province = $${paramIndex} `;
            queryParams.push(province);
            countParams.push(province);
            paramIndex += 1;
        }

        // Add conditions for district if provided
        if (district) {
            dataSql += ` AND c.district = $${paramIndex} `;
            countSql += ` AND c.district = $${paramIndex} `;
            queryParams.push(district);
            countParams.push(district);
            paramIndex += 1;
        }

        // Add pagination
        dataSql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        // Execute both queries using pool
        Promise.all([
            pool.query(dataSql, queryParams),
            pool.query(countSql, countParams)
        ])
        .then(([dataResults, countResults]) => {
            const totalItems = parseInt(countResults.rows[0].totalCount);
            const totalPages = Math.ceil(totalItems / limit);

            console.log('results', dataResults.rows)

            resolve({
                totalItems,
                items: dataResults.rows
            });
        })
        .catch((err) => {
            console.error('Error executing query:', err);
            reject(err);
        });
    });
};

exports.getAllCourtsDao = async () => {
    const sql = `
        SELECT c.id AS courtid, c.courtnameenglish
        FROM public.courts c
    `;

    try {
        const result = await pool.query(sql);
        return result.rows;
    } catch (err) {
        throw err;
    }
};


exports.getOfficerCodeDao = async (role) => {

    const prefix = role === 'Registrar' ? 'REG' : 'CLR';

    const sql = `
        SELECT officercode
        FROM public.officers
        WHERE officerrole = $1
        ORDER BY CAST(SUBSTRING(officercode FROM ${prefix.length + 1}) AS INTEGER) DESC
        LIMIT 1
    `;

    try {
        const result = await pool.query(sql, [role]);
        return result.rows[0]?.officercode || null;
    } catch (err) {
        throw err;
    }
};


exports.createRegistrarDao = async (data) => {

    const sql = `
        INSERT INTO public.officers (
            courtid,
            firstname,
            lastname,
            officerrole,
            officercode,
            phonecode01,
            phonenumber01,
            phonecode02,
            phonenumber02,
            nic,
            email,
            password,
            ispasswordchanged,
            housenumber,
            streetname,
            city,
            district,
            province,
            country
        )
        VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, $16, $17, $18, $19
        )
        RETURNING *;
    `;

    const values = [
        data.courtid,
        data.firstname,
        data.lastname,
        data.officerrole,
        data.officercode,
        data.phonecode01,
        data.phonenumber01,
        data.phonecode02,
        data.phonenumber02,
        data.nic,
        data.email,
        data.password,              
        0,                          
        data.housenumber,
        data.streetname,
        data.city,
        data.district,
        data.province,
        data.country
    ];

    try {
        const result = await pool.query(sql, values);
        return result.rows[0]; // return inserted row
    } catch (err) {
        throw err;
    }
};


exports.getRegistrarOfficerDetailsDao = (courtId, searchText, page, limit) => {
    return new Promise((resolve, reject) => {
        // Validate input parameters

        page = page || 1;
        limit = limit || 10;

        const offset = (page - 1) * limit;
        let paramIndex = 1;

        let queryParams = [courtId];
        let countParams = [courtId];

        // Base count query
        let countSql = `
            SELECT COUNT(*) as "totalCount" from public.officers c WHERE courtid = $${paramIndex}
        `;

        // Base data query
        let dataSql = `
            SELECT * from public.officers c WHERE courtid = $${paramIndex}
        `;

        paramIndex += 1;

        // Add search conditions if searchText is provided
        if (searchText) {
            dataSql += ` AND (c.firstname ILIKE $${paramIndex} OR c.officercode ILIKE $${paramIndex} OR c.officerrole ILIKE $${paramIndex} )`;
            countSql += ` AND (c.firstname ILIKE $${paramIndex} OR c.officercode ILIKE $${paramIndex} OR c.officerrole ILIKE $${paramIndex})`;
            queryParams.push(`%${searchText}%`);
            countParams.push(`%${searchText}%`);
            paramIndex += 1;
        }

        // Add pagination
        dataSql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        // Execute both queries using pool
        Promise.all([
            pool.query(dataSql, queryParams),
            pool.query(countSql, countParams)
        ])
        .then(([dataResults, countResults]) => {
            const totalItems = parseInt(countResults.rows[0].totalCount);
            const totalPages = Math.ceil(totalItems / limit);

            console.log('results', dataResults.rows)

            resolve({
                totalItems,
                items: dataResults.rows
            });
        })
        .catch((err) => {
            console.error('Error executing query:', err);
            reject(err);
        });
    });
};


exports.createClerkDao = async (data) => {

    const sql = `
        INSERT INTO public.officers (
            courtid,
            firstname,
            lastname,
            officerrole,
            officercode,
            phonecode01,
            phonenumber01,
            phonecode02,
            phonenumber02,
            nic,
            email,
            password,
            ispasswordchanged,
            housenumber,
            streetname,
            city,
            district,
            province,
            country
        )
        VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, $16, $17, $18, $19
        )
        RETURNING *;
    `;

    const values = [
        data.courtid,
        data.firstname,
        data.lastname,
        data.officerrole,
        data.officercode,
        data.phonecode01,
        data.phonenumber01,
        data.phonecode02,
        data.phonenumber02,
        data.nic,
        data.email,
        data.password,              
        0,                          
        data.housenumber,
        data.streetname,
        data.city,
        data.district,
        data.province,
        data.country
    ];

    try {
        const result = await pool.query(sql, values);
        return result.rows[0]; // return inserted row
    } catch (err) {
        throw err;
    }
};
