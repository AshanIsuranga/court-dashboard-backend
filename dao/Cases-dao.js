const { pool } = require('../config/db');

exports.getCenterDetailsDaoNew = (courtid, province, district, searchText, page, limit) => {
    return new Promise((resolve, reject) => {
        // Validate input parameters
        if (!courtid) {
            return reject(new Error('Court ID is required'));
        }

        page = page || 1;
        limit = limit || 10;

        const offset = (page - 1) * limit;
        let paramIndex = 1;

        // Base count query
        let countSql = `
            SELECT COUNT(DISTINCT c.id) AS "totalCount"
            FROM public.cases c
            WHERE c.courtid = $${paramIndex}
        `;

        // Base data query
        let dataSql = `
            SELECT *
            FROM public.cases c
            WHERE c.courtid = $${paramIndex}
        `;

        // Prepare query parameters
        const queryParams = [courtid];
        const countParams = [courtid];
        paramIndex++;

        // Add search conditions if searchText is provided
        if (searchText) {
            dataSql += ` AND (c.casenumber ILIKE $${paramIndex} OR c.casetype ILIKE $${paramIndex + 1})`;
            countSql += ` AND (c.casenumber ILIKE $${paramIndex} OR c.casetype ILIKE $${paramIndex + 1})`;
            queryParams.push(`%${searchText}%`, `%${searchText}%`);
            countParams.push(`%${searchText}%`, `%${searchText}%`);
            paramIndex += 2;
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

            resolve({
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: limit,
                items: dataResults.rows
            });
        })
        .catch((err) => {
            console.error('Error executing query:', err);
            reject(err);
        });
    });
};

exports.getCaseDetailsDao = async (caseId) => {
    const sql = `
        SELECT 
            c.id,
            c.casenumber,
            c.casetype,
            c.casestatus,
            c."descriptionEnglish",
            c.closereason,
            c.closuredate,
            c."closeNoteEnglish",
            c.createdat,
            c.updatedat,
            o.firstname,
            o.lastname,
            co.type,
            co.city,
            co.courtnameenglish,
            co.district,
            co.province
        FROM public.cases c
        LEFT JOIN officers o ON c.createdofficerid = o.id
        LEFT JOIN courts co ON c.courtid = co.id
        WHERE c.id = $1
    `;

    try {
        const result = await pool.query(sql, [caseId]);
        return result.rows;
    } catch (err) {
        throw err;
    }
};

exports.getCasePartiesDao = async (caseId) => {
    const sql = `
    SELECT 
    cp.id AS partyId,
    cp.partyrole,
    cp.partystatus,
    cp.partynic,
    cp.partyname,
    cp.ispolicestation,
    cp.lawyerstatus,
    cp.lawyerid,
    cp.partyaddress,
    cp.phone AS partyPhone,
    cp.district AS partyDistrict,
    cp.province AS partyProvince,
    cp.city AS partyCity,

    -- Police Station Details (only when joined)
    CASE WHEN cp.ispolicestation = 1 THEN ps.stationname END AS stationname,
    CASE WHEN cp.ispolicestation = 1 THEN ps.phonenumber01 END AS policePhoneNo,
    CASE WHEN cp.ispolicestation = 1 THEN ps.phonecode01 END AS policePhoneCode,
    CASE WHEN cp.ispolicestation = 1 THEN ps.houseno END AS policeHouseNo,
    CASE WHEN cp.ispolicestation = 1 THEN ps.streetname END AS policeStreetName,
    CASE WHEN cp.ispolicestation = 1 THEN ps.city END AS policeCity,
    CASE WHEN cp.ispolicestation = 1 THEN ps.district END AS policeDistrict,
    CASE WHEN cp.ispolicestation = 1 THEN ps.province END AS policeProvince,

    -- Lawyer Details (only when joined)
    CASE WHEN cp.lawyerstatus = 1 THEN l.lawyerfirstnameenglish END AS lawyerFirstName,
    CASE WHEN cp.lawyerstatus = 1 THEN l.lawyerlastnameenglish END AS lawyerLastName,
    CASE WHEN cp.lawyerstatus = 1 THEN l.barcode END AS lawyerBarcode,
    CASE WHEN cp.lawyerstatus = 1 THEN l.phonenumber01 END AS lawyerPhoneNo,
    CASE WHEN cp.lawyerstatus = 1 THEN l.phonecode01 END AS lawyerPhoneCode,
    CASE WHEN cp.lawyerstatus = 1 THEN l.houseno END AS lawyerHouseNo,
    CASE WHEN cp.lawyerstatus = 1 THEN l.streetname END AS lawyerStreetName,
    CASE WHEN cp.lawyerstatus = 1 THEN l.city END AS lawyerCity,
    CASE WHEN cp.lawyerstatus = 1 THEN l.district END AS lawyerDistrict,
    CASE WHEN cp.lawyerstatus = 1 THEN l.province END AS lawyerProvince,
    CASE WHEN cp.lawyerstatus = 1 THEN l.specialities END AS specialities

FROM public.case_parties cp

LEFT JOIN policestations ps 
    ON cp.policestationid = ps.id
    AND cp.ispolicestation = 1

LEFT JOIN legalprofessionals l 
    ON cp.lawyerid = l.id
    AND cp.lawyerstatus = 1

WHERE cp.caseid = $1
    `;

    try {
        const result = await pool.query(sql, [caseId]);
        return result.rows;
    } catch (err) {
        throw err;
    }
};
