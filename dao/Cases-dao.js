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
    cp.linkeduserid,
    cp.ispolicestation,
    cp.lawyerstatus,
    cp.lawyerid,
    cp.partyaddress,
    cp.phone AS partyPhone,
    cp.district AS partyDistrict,
    cp.province AS partyProvince,
    cp.partytype,
    cp.city AS partyCity,
    cp.connectionstatus,

    -- Police Station Details (only when joined)
    CASE WHEN cp.partytype = 'Organization' THEN o.id END AS oranizationid,
    CASE WHEN cp.partytype = 'Organization' THEN o.name END AS oranizationname,
    CASE WHEN cp.partytype = 'Organization' THEN o.registration_number END AS oranizationregno,
    CASE WHEN cp.partytype = 'Organization' THEN o.email END AS oranizationemail,
    CASE WHEN cp.partytype = 'Organization' THEN o.phone END AS oranizationphone,
    CASE WHEN cp.partytype = 'Organization' THEN o.addresss END AS oranizationaddress,
    CASE WHEN cp.partytype = 'Organization' THEN o.city END AS oranizationcity,
    CASE WHEN cp.partytype = 'Organization' THEN o.district END AS oranizationdistrict,
    CASE WHEN cp.partytype = 'Organization' THEN o.province END AS oranizationprovince,

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

LEFT JOIN organizations o 
    ON cp.organizationid = o.id
    AND cp.partytype = 'Organization'
    
    
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


exports.getPendingConnectionDetailsDao = async (page, limit, searchText, courtid) => {
    const offset = (page - 1) * limit;
  
    let countSql = `
      SELECT COUNT(*) AS total
      FROM public.case_parties cp
LEFT JOIN cases c 
    ON cp.caseid = c.id 

LEFT JOIN organizations o
    ON cp.partytype = 'Organization'
    AND cp.organizationid = o.id
    
LEFT JOIN organization_users ou
    ON cp.partytype = 'Organization'
    AND ou.organization_id = cp.organizationid
    AND ou.linkeduserid IS null AND ou.orguserconnectionstatus = 'Pending'

JOIN public.users u
    ON u.nic = COALESCE(cp.partynic, ou.organizationusernic)

WHERE 
    c.courtid = $1
    AND ((cp.connectionstatus = 'Pending' AND cp.partytype = 'Individual') OR (ou.orguserconnectionstatus = 'Pending' AND cp.partytype = 'Organization')) AND u.id IS NOT NULL 
        AND (cp.linkeduserid IS null or ou.linkeduserid IS null) 
    	AND (cp.connectionstatus IS NULL or cp.connectionstatus = 'Pending')
    `;
  
    let dataSql = `
    SELECT 
    c.casenumber,
    c.casestatus,
    c.casetype,
    c.createdat,
    cp.partyrole,
    cp.id AS partyid,
    c.id AS caseid,
    u.id AS userid,
    u.fullnameenglish AS userfullname,
    u.phonenumber AS userphonenumber,
    u.phonecode AS userphonecode,
    u.nic AS usernic,
    cp.partystatus,
    cp.partynic,
    cp.partyname,
    cp.partytype,
    cp.organizationid,
    cp.connectionstatus,
    ou.id as organizationuserid,
    o.name as organizationname,
    ou.organizationusernic,
    ou.organizationusername,
    
    ou.orguserconnectionstatus
FROM public.case_parties cp
LEFT JOIN cases c 
    ON cp.caseid = c.id 

LEFT JOIN organizations o
    ON cp.partytype = 'Organization'
    AND cp.organizationid = o.id
    
LEFT JOIN organization_users ou
    ON cp.partytype = 'Organization'
    AND ou.organization_id = cp.organizationid
    AND ou.linkeduserid IS null AND ou.orguserconnectionstatus = 'Pending'

JOIN public.users u
    ON u.nic = COALESCE(cp.partynic, ou.organizationusernic)

WHERE 
    c.courtid = $1
    AND cp.connectionstatus = 'Pending' AND u.id IS NOT NULL 
        AND (cp.linkeduserid IS null or ou.linkeduserid IS null) 
    	AND (cp.connectionstatus IS NULL or cp.connectionstatus = 'Pending')
    `;
  
    const countParams = [courtid];
    const dataParams = [courtid];
  
    if (searchText) {
      const searchValue = `%${searchText}%`;
  
      countSql += ` AND (cp.partynic ILIKE $2 OR cp.partyname ILIKE $3)`;
      dataSql += ` AND (cp.partynic ILIKE $2 OR cp.partyname ILIKE $3)`;
  
      countParams.push(searchValue, searchValue);
      dataParams.push(searchValue, searchValue);
    }
  
    // 📄 Pagination
    const limitIndex = dataParams.length + 1;
    const offsetIndex = dataParams.length + 2;
  
    dataSql += ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    dataParams.push(limit, offset);
  
    try {
      const countResult = await pool.query(countSql, countParams);
      const dataResult = await pool.query(dataSql, dataParams);
  
      return {
        items: dataResult.rows,
        total: parseInt(countResult.rows[0].total, 10)
        
      };
    } catch (err) {
      throw err;
    }
  };

exports.createConnectionDao = async (partyId, userId) => {
    const sql = `
      UPDATE case_parties 
      SET linkeduserid = $2, connectionstatus = 'Connected'
      WHERE id = $1
      RETURNING *;
    `;
  
    try {
      const result = await pool.query(sql, [partyId, userId]);
      return result.rows;
    } catch (err) {
      throw err;
    }
};


exports.rejectConnectionDao = async (partyId) => {
  const sql = `
    UPDATE case_parties 
    SET 
      connectionstatus = 'Rejected'
    WHERE id = $1
    RETURNING *;
  `;

  try {
    const result = await pool.query(sql, [partyId]);
    return result.rows;
  } catch (err) {
    throw err;
  }
};



exports.createConnectionOrgDao = async (orgUserId, userId, partyId) => {
  const sql = `
    INSERT INTO public.org_user_party_connection
      (org_user_id, linked_user_id, party_id, connection_status)
    VALUES ($1, $2, $3, 'Connected')
    RETURNING *;
  `;

  try {
    const result = await pool.query(sql, [orgUserId, userId, partyId]);
    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

exports.rejectConnectionOrgDao = async (orgUserId, userId, partyId) => {
  const sql = `
    INSERT INTO public.org_user_party_connection
      (org_user_id, linked_user_id, party_id, connection_status)
    VALUES ($1, $2, $3, 'Rejected')
    RETURNING *;
  `;

  try {
    const result = await pool.query(sql, [orgUserId, userId, partyId]);
    return result.rows;
  } catch (err) {
    throw err;
  }
};

  exports.updateConnectionStatusOrgDao  = async (partyId) => {
    const sql = `
    UPDATE case_parties 
    SET connectionstatus = 'Connected'
    WHERE id = $1
    RETURNING *;
    `;
  
    try {
      const result = await pool.query(sql, [partyId]);
      return result.rows;
    } catch (err) {
      throw err;
    }
  };

  exports.getPartyConnectionStatusDao = async (partyId) => {
  const sql = `
    SELECT connectionstatus 
    FROM case_parties 
    WHERE id = $1
  `;

  try {
    const result = await pool.query(sql, [partyId]);
    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

  exports.updateConnectionStatusOrgRejectDao  = async (partyId) => {
    const sql = `
    UPDATE case_parties 
    SET connectionstatus = 'Rejected'
    WHERE id = $1
    RETURNING *;
    `;
  
    try {
      const result = await pool.query(sql, [partyId]);
      return result.rows;
    } catch (err) {
      throw err;
    }
  };


  exports.getOrganizationPartyUserDetailsDao = async (partyId) => {
    const sql = `
        SELECT 
        cp.id,
        ou.id AS organizationuserid,
        ou.linkeduserid,
        ou.organizationusernic,
        ou.organizationusername,
        ou.organizationuserdistrict AS district,
        ou.organizationuserprovince AS province
        FROM public.case_parties cp
        LEFT JOIN public.organizations o ON cp.organizationid = o.id
        LEFT JOIN organization_users ou ON o.id = ou.organization_id
        WHERE cp.id = $1
    `;

    try {
        const result = await pool.query(sql, [partyId]);
        return result.rows;
    } catch (err) {
        throw err;
    }
};

exports.createCaseDao = async (caseDetails, officerId, courtId) => {
  const sql = `
    INSERT INTO public.cases (
      casenumber,
      casetype,
      "descriptionEnglish",
      "descriptionSinhala",
      "descriptionTamil",
      casestatus,
      createdofficerid,
      courtid
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id;
  `;

  const values = [
    caseDetails.casenumber,
    caseDetails.casetype,
    caseDetails.descriptionEnglish,
    caseDetails.descriptionSinhala,
    caseDetails.descriptionTamil,
    caseDetails.casestatus,
    officerId,
    courtId,
  ];

  const result = await pool.query(sql, values);
  return result.rows[0].id;
};

exports.createOrganizationDao = async (org) => {
  const sql = `
    INSERT INTO public.organizations (
      name,
      registration_number,
      email,
      phone,
      addresss,
      city,
      district,
      province
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id;
  `;

  const values = [
    org.organizationname,
    org.regno,
    org.organizationemail,
    org.organizationphone,
    org.organizationaddress,
    org.organizationcity,
    org.organizationdistrict,
    org.organizationprovince,
  ];

  const result = await pool.query(sql, values);
  return result.rows[0].id;
};

exports.createOrganizationUserDao = async (organizationId, orgUser) => {
  const sql = `
    INSERT INTO public.organization_users (
      organization_id,
      organizationusernic,
      organizationusername
    )
    VALUES ($1, $2, $3)
    RETURNING id;
  `;

  const values = [
    organizationId,
    orgUser.nic,
    orgUser.name,
  ];

  const result = await pool.query(sql, values);
  return result.rows[0].id;
};


exports.createCasePartyDao = async (caseId, party, linkedUserId, organizationId) => {
  const sql = `
    INSERT INTO public.case_parties (
      caseid,
      linkeduserid,
      partyrole,
      partystatus,
      partytype,
      partynic,
      partyname,
      phone,
      district,
      province,
      organizationid,
      connectionstatus
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id;
  `;

  const isIndividual = party.partytype === 'Individual';

  const values = [
    caseId,
    linkedUserId ?? null,
    party.partyrole,
    party.partystatus,
    party.partytype,
    isIndividual ? party.nic      : null,
    isIndividual ? party.name     : null,
    isIndividual ? party.phone    : null,
    isIndividual ? party.district : null,
    isIndividual ? party.province : null,
    organizationId ?? null,
    'Not Connected'
  ];

  const result = await pool.query(sql, values);
  return result.rows[0].id;
};

  exports.getPendingConnectionDetailsIndividualDao = async (page, limit, searchText, courtid) => {
    const offset = (page - 1) * limit;
  
    let countSql = `
      SELECT COUNT(*) AS total
FROM public.case_parties cp
LEFT JOIN cases c 
    ON cp.caseid = c.id 

JOIN public.users u
    ON u.nic = cp.partynic

WHERE 
    c.courtid = $1
    AND cp.connectionstatus = 'Pending' 
    AND u.id IS NOT NULL 
        AND cp.linkeduserid is null
    `;
  
    let dataSql = `
    SELECT 
    c.casenumber,
    c.casestatus,
    c.casetype,
    c.createdat,
    cp.partyrole,
    cp.id AS partyid,
    c.id AS caseid,
    u.id AS userid,
    u.fullnameenglish AS userfullname,
    u.phonenumber AS userphonenumber,
    u.phonecode AS userphonecode,
    u.nic AS usernic,
    cp.partystatus,
    cp.partynic,
    cp.partyname,
    cp.partytype,
    cp.connectionstatus
    
FROM public.case_parties cp
LEFT JOIN cases c 
    ON cp.caseid = c.id 

JOIN public.users u
    ON u.nic = cp.partynic

WHERE 
    c.courtid = $1
    AND cp.connectionstatus = 'Pending' 
    AND u.id IS NOT NULL 
        AND cp.linkeduserid is null
    `;
  
    const countParams = [courtid];
    const dataParams = [courtid];
  
    if (searchText) {
      const searchValue = `%${searchText}%`;
  
      countSql += ` AND (cp.partynic ILIKE $2 OR cp.partyname ILIKE $3)`;
      dataSql += ` AND (cp.partynic ILIKE $2 OR cp.partyname ILIKE $3)`;
  
      countParams.push(searchValue, searchValue);
      dataParams.push(searchValue, searchValue);
    }
  
    // 📄 Pagination
    const limitIndex = dataParams.length + 1;
    const offsetIndex = dataParams.length + 2;
  
    dataSql += ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    dataParams.push(limit, offset);
  
    try {
      const countResult = await pool.query(countSql, countParams);
      const dataResult = await pool.query(dataSql, dataParams);
  
      return {
        indItems: dataResult.rows,
        indTotal: parseInt(countResult.rows[0].total, 10)
        
      };
    } catch (err) {
      throw err;
    }
  };


  exports.getPendingConnectionDetailsOrgDao = async (page, limit, searchText, courtid) => {
    const offset = (page - 1) * limit;
  
    let countSql = `
      SELECT COUNT(*) AS total
      FROM public.case_parties cp

LEFT JOIN cases c 
    ON cp.caseid = c.id 

LEFT JOIN organizations o
    ON cp.partytype = 'Organization'
    AND cp.organizationid = o.id
    
LEFT JOIN organization_users ou
    ON cp.partytype = 'Organization'
    AND ou.organization_id = cp.organizationid

JOIN public.users u
    ON u.nic = ou.organizationusernic

LEFT JOIN public.org_user_party_connection oupc
    ON cp.id = oupc.party_id
    AND ou.id = oupc.org_user_id

WHERE 
    c.courtid = $1
    AND u.id IS NOT NULL
    -- AND cp.connectionstatus = 'Pending'

    -- only get rows that DO NOT exist in org_user_party_connection
    AND oupc.id IS NULL
    `;
  
    let dataSql = `
    SELECT 
    c.casenumber,
    c.casestatus,
    c.casetype,
    c.createdat,

    cp.partyrole,
    cp.id AS partyid,
    c.id AS caseid,

    u.id AS userid,
    u.fullnameenglish AS userfullname,
    u.phonenumber AS userphonenumber,
    u.phonecode AS userphonecode,
    u.nic AS usernic,

    cp.partystatus,
    cp.partynic,
    cp.partyname,
    cp.partytype,
    cp.organizationid,
    cp.connectionstatus,

    ou.id AS organizationuserid,
    o.name AS organizationname,
    ou.organizationusernic,
    ou.organizationusername,
    ou.orguserconnectionstatus,
    
    oupc.id as oupcId,
    oupc.linked_user_id

FROM public.case_parties cp

LEFT JOIN cases c 
    ON cp.caseid = c.id 

LEFT JOIN organizations o
    ON cp.partytype = 'Organization'
    AND cp.organizationid = o.id
    
LEFT JOIN organization_users ou
    ON cp.partytype = 'Organization'
    AND ou.organization_id = cp.organizationid

JOIN public.users u
    ON u.nic = ou.organizationusernic

LEFT JOIN public.org_user_party_connection oupc
    ON cp.id = oupc.party_id
    AND ou.id = oupc.org_user_id

WHERE 
    c.courtid = $1
    AND u.id IS NOT NULL
    -- AND cp.connectionstatus = 'Pending'

    -- only get rows that DO NOT exist in org_user_party_connection
    AND oupc.id IS NULL
    `;
  
    const countParams = [courtid];
    const dataParams = [courtid];
  
    if (searchText) {
      const searchValue = `%${searchText}%`;
  
      countSql += ` AND (cp.partynic ILIKE $2 OR cp.partyname ILIKE $3)`;
      dataSql += ` AND (cp.partynic ILIKE $2 OR cp.partyname ILIKE $3)`;
  
      countParams.push(searchValue, searchValue);
      dataParams.push(searchValue, searchValue);
    }
  
    // 📄 Pagination
    const limitIndex = dataParams.length + 1;
    const offsetIndex = dataParams.length + 2;
  
    dataSql += ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    dataParams.push(limit, offset);
  
    try {
      const countResult = await pool.query(countSql, countParams);
      const dataResult = await pool.query(dataSql, dataParams);
  
      return {
        orgItems: dataResult.rows,
        orgTotal: parseInt(countResult.rows[0].total, 10)
        
      };
    } catch (err) {
      throw err;
    }
  };

  exports.getApprovedConnectionDetailsIndividualDao = async (page, limit, searchText, courtid) => {
    const offset = (page - 1) * limit;
  
    let countSql = `
      SELECT COUNT(*) AS total
FROM public.case_parties cp
LEFT JOIN cases c 
    ON cp.caseid = c.id 

JOIN public.users u
    ON u.nic = cp.partynic

WHERE 
    c.courtid = $1
    AND cp.connectionstatus = 'Connected' 
    AND u.id IS NOT NULL 
        AND cp.linkeduserid is NOT null
    `;
  
    let dataSql = `
    SELECT 
    c.casenumber,
    c.casestatus,
    c.casetype,
    c.createdat,
    cp.partyrole,
    cp.id AS partyid,
    c.id AS caseid,
    u.id AS userid,
    u.fullnameenglish AS userfullname,
    u.phonenumber AS userphonenumber,
    u.phonecode AS userphonecode,
    u.nic AS usernic,
    cp.partystatus,
    cp.partynic,
    cp.partyname,
    cp.partytype,
    cp.connectionstatus
    
FROM public.case_parties cp
LEFT JOIN cases c 
    ON cp.caseid = c.id 

JOIN public.users u
    ON u.nic = cp.partynic

WHERE 
    c.courtid = $1
    AND cp.connectionstatus = 'Connected' 
    AND u.id IS NOT NULL 
        AND cp.linkeduserid is NOT null
    `;
  
    const countParams = [courtid];
    const dataParams = [courtid];
  
    if (searchText) {
      const searchValue = `%${searchText}%`;
  
      countSql += ` AND (cp.partynic ILIKE $2 OR cp.partyname ILIKE $3)`;
      dataSql += ` AND (cp.partynic ILIKE $2 OR cp.partyname ILIKE $3)`;
  
      countParams.push(searchValue, searchValue);
      dataParams.push(searchValue, searchValue);
    }
  
    // 📄 Pagination
    const limitIndex = dataParams.length + 1;
    const offsetIndex = dataParams.length + 2;
  
    dataSql += ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    dataParams.push(limit, offset);
  
    try {
      const countResult = await pool.query(countSql, countParams);
      const dataResult = await pool.query(dataSql, dataParams);
  
      return {
        indItems: dataResult.rows,
        indTotal: parseInt(countResult.rows[0].total, 10)
        
      };
    } catch (err) {
      throw err;
    }
  };

  exports.getApprovedConnectionDetailsOrgDao = async (page, limit, searchText, courtid) => {
    const offset = (page - 1) * limit;
  
    let countSql = `
      SELECT COUNT(*) AS total
      FROM public.case_parties cp

LEFT JOIN cases c 
    ON cp.caseid = c.id 

LEFT JOIN organizations o
    ON cp.partytype = 'Organization'
    AND cp.organizationid = o.id
    
LEFT JOIN organization_users ou
    ON cp.partytype = 'Organization'
    AND ou.organization_id = cp.organizationid

JOIN public.users u
    ON u.nic = ou.organizationusernic

LEFT JOIN public.org_user_party_connection oupc
    ON cp.id = oupc.party_id
    AND ou.id = oupc.org_user_id

WHERE 
    c.courtid = $1
    AND u.id IS NOT NULL
    AND cp.connectionstatus = 'Connected'

    -- only get rows that DO NOT exist in org_user_party_connection
    AND oupc.id IS Not NULL AND oupc.connection_status = 'Connected'
    `;
  
    let dataSql = `
    SELECT 
    c.casenumber,
    c.casestatus,
    c.casetype,
    c.createdat,

    cp.partyrole,
    cp.id AS partyid,
    c.id AS caseid,

    u.id AS userid,
    u.fullnameenglish AS userfullname,
    u.phonenumber AS userphonenumber,
    u.phonecode AS userphonecode,
    u.nic AS usernic,

    cp.partystatus,
    cp.partynic,
    cp.partyname,
    cp.partytype,
    cp.organizationid,
    cp.connectionstatus,

    ou.id AS organizationuserid,
    o.name AS organizationname,
    ou.organizationusernic,
    ou.organizationusername,
    ou.orguserconnectionstatus,
    
    oupc.id as oupcId,
    oupc.linked_user_id

FROM public.case_parties cp

LEFT JOIN cases c 
    ON cp.caseid = c.id 

LEFT JOIN organizations o
    ON cp.partytype = 'Organization'
    AND cp.organizationid = o.id
    
LEFT JOIN organization_users ou
    ON cp.partytype = 'Organization'
    AND ou.organization_id = cp.organizationid

JOIN public.users u
    ON u.nic = ou.organizationusernic

LEFT JOIN public.org_user_party_connection oupc
    ON cp.id = oupc.party_id
    AND ou.id = oupc.org_user_id

WHERE 
    c.courtid = $1
    AND u.id IS NOT NULL
    AND cp.connectionstatus = 'Connected'

    -- only get rows that DO NOT exist in org_user_party_connection
    AND oupc.id IS NOT NULL AND oupc.connection_status = 'Connected'
    `;
  
    const countParams = [courtid];
    const dataParams = [courtid];
  
    if (searchText) {
      const searchValue = `%${searchText}%`;
  
      countSql += ` AND (cp.partynic ILIKE $2 OR cp.partyname ILIKE $3)`;
      dataSql += ` AND (cp.partynic ILIKE $2 OR cp.partyname ILIKE $3)`;
  
      countParams.push(searchValue, searchValue);
      dataParams.push(searchValue, searchValue);
    }
  
    // 📄 Pagination
    const limitIndex = dataParams.length + 1;
    const offsetIndex = dataParams.length + 2;
  
    dataSql += ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    dataParams.push(limit, offset);
  
    try {
      const countResult = await pool.query(countSql, countParams);
      const dataResult = await pool.query(dataSql, dataParams);
  
      return {
        orgItems: dataResult.rows,
        orgTotal: parseInt(countResult.rows[0].total, 10)
        
      };
    } catch (err) {
      throw err;
    }
  };

  exports.getRejectedConnectionDetailsIndividualDao = async (page, limit, searchText, courtid) => {
    const offset = (page - 1) * limit;
  
    let countSql = `
      SELECT COUNT(*) AS total
FROM public.case_parties cp
LEFT JOIN cases c 
    ON cp.caseid = c.id 

JOIN public.users u
    ON u.nic = cp.partynic

WHERE 
    c.courtid = $1
    AND cp.connectionstatus = 'Rejected' 
    AND u.id IS NOT NULL 
        AND cp.linkeduserid is NOT null
    `;
  
    let dataSql = `
    SELECT 
    c.casenumber,
    c.casestatus,
    c.casetype,
    c.createdat,
    cp.partyrole,
    cp.id AS partyid,
    c.id AS caseid,
    u.id AS userid,
    u.fullnameenglish AS userfullname,
    u.phonenumber AS userphonenumber,
    u.phonecode AS userphonecode,
    u.nic AS usernic,
    cp.partystatus,
    cp.partynic,
    cp.partyname,
    cp.partytype,
    cp.connectionstatus
    
FROM public.case_parties cp
LEFT JOIN cases c 
    ON cp.caseid = c.id 

JOIN public.users u
    ON u.nic = cp.partynic

WHERE 
    c.courtid = $1
    AND cp.connectionstatus = 'Rejected' 
    AND u.id IS NOT NULL 
        AND cp.linkeduserid is NOT null
    `;
  
    const countParams = [courtid];
    const dataParams = [courtid];
  
    if (searchText) {
      const searchValue = `%${searchText}%`;
  
      countSql += ` AND (cp.partynic ILIKE $2 OR cp.partyname ILIKE $3)`;
      dataSql += ` AND (cp.partynic ILIKE $2 OR cp.partyname ILIKE $3)`;
  
      countParams.push(searchValue, searchValue);
      dataParams.push(searchValue, searchValue);
    }
  
    // 📄 Pagination
    const limitIndex = dataParams.length + 1;
    const offsetIndex = dataParams.length + 2;
  
    dataSql += ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    dataParams.push(limit, offset);
  
    try {
      const countResult = await pool.query(countSql, countParams);
      const dataResult = await pool.query(dataSql, dataParams);
  
      return {
        indItems: dataResult.rows,
        indTotal: parseInt(countResult.rows[0].total, 10)
        
      };
    } catch (err) {
      throw err;
    }
  };

  exports.getRejectedConnectionDetailsOrgDao = async (page, limit, searchText, courtid) => {
    const offset = (page - 1) * limit;
  
    let countSql = `
      SELECT COUNT(*) AS total
      FROM public.case_parties cp

LEFT JOIN cases c 
    ON cp.caseid = c.id 

LEFT JOIN organizations o
    ON cp.partytype = 'Organization'
    AND cp.organizationid = o.id
    
LEFT JOIN organization_users ou
    ON cp.partytype = 'Organization'
    AND ou.organization_id = cp.organizationid

JOIN public.users u
    ON u.nic = ou.organizationusernic

LEFT JOIN public.org_user_party_connection oupc
    ON cp.id = oupc.party_id
    AND ou.id = oupc.org_user_id

WHERE 
    c.courtid = $1
    AND u.id IS NOT NULL

    -- only get rows that DO NOT exist in org_user_party_connection
    AND oupc.id IS Not NULL AND oupc.connection_status = 'Rejected'
    `;
  
    let dataSql = `
    SELECT 
    c.casenumber,
    c.casestatus,
    c.casetype,
    c.createdat,

    cp.partyrole,
    cp.id AS partyid,
    c.id AS caseid,

    u.id AS userid,
    u.fullnameenglish AS userfullname,
    u.phonenumber AS userphonenumber,
    u.phonecode AS userphonecode,
    u.nic AS usernic,

    cp.partystatus,
    cp.partynic,
    cp.partyname,
    cp.partytype,
    cp.organizationid,
    cp.connectionstatus,

    ou.id AS organizationuserid,
    o.name AS organizationname,
    ou.organizationusernic,
    ou.organizationusername,
    ou.orguserconnectionstatus,
    
    oupc.id as oupcId,
    oupc.linked_user_id

FROM public.case_parties cp

LEFT JOIN cases c 
    ON cp.caseid = c.id 

LEFT JOIN organizations o
    ON cp.partytype = 'Organization'
    AND cp.organizationid = o.id
    
LEFT JOIN organization_users ou
    ON cp.partytype = 'Organization'
    AND ou.organization_id = cp.organizationid

JOIN public.users u
    ON u.nic = ou.organizationusernic

LEFT JOIN public.org_user_party_connection oupc
    ON cp.id = oupc.party_id
    AND ou.id = oupc.org_user_id

WHERE 
    c.courtid = $1
    AND u.id IS NOT NULL

    -- only get rows that DO NOT exist in org_user_party_connection
    AND oupc.id IS NOT NULL AND oupc.connection_status = 'Rejected'
    `;
  
    const countParams = [courtid];
    const dataParams = [courtid];
  
    if (searchText) {
      const searchValue = `%${searchText}%`;
  
      countSql += ` AND (cp.partynic ILIKE $2 OR cp.partyname ILIKE $3)`;
      dataSql += ` AND (cp.partynic ILIKE $2 OR cp.partyname ILIKE $3)`;
  
      countParams.push(searchValue, searchValue);
      dataParams.push(searchValue, searchValue);
    }
  
    // 📄 Pagination
    const limitIndex = dataParams.length + 1;
    const offsetIndex = dataParams.length + 2;
  
    dataSql += ` LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    dataParams.push(limit, offset);
  
    try {
      const countResult = await pool.query(countSql, countParams);
      const dataResult = await pool.query(dataSql, dataParams);
  
      return {
        orgItems: dataResult.rows,
        orgTotal: parseInt(countResult.rows[0].total, 10)
        
      };
    } catch (err) {
      throw err;
    }
  };


exports.getPendingLawyersDao = async (province, district, searchText, page, limit) => {
  const offset = (page - 1) * limit;

  let countSql = `
    SELECT COUNT(*) AS total
    FROM public.legalprofessionals l
    left join courts c on l.nearestcourtid = c.id
    WHERE l.approvestatus = 'Pending'
  `;

  let dataSql = `
    SELECT l.*, c.courtnameenglish 
    FROM public.legalprofessionals l
    left join courts c on l.nearestcourtid = c.id
    WHERE l.approvestatus = 'Pending'
  `;

  const countParams = [];
  const dataParams = [];

  // 🔍 Optional province filter
  if (province) {
    countParams.push(province);
    dataParams.push(province);
    countSql += ` AND l.province = $${countParams.length}`;
    dataSql  += ` AND l.province = $${dataParams.length}`;
  }

  // 🔍 Optional district filter
  if (district) {
    countParams.push(district);
    dataParams.push(district);
    countSql += ` AND l.district = $${countParams.length}`;
    dataSql  += ` AND l.district = $${dataParams.length}`;
  }

  // 🔍 Optional search filter
  if (searchText) {
    const searchValue = `%${searchText}%`;
    countParams.push(searchValue);
    dataParams.push(searchValue);
    const idx = countParams.length; // same index for both since they're in sync

    countSql += ` AND (l.nic ILIKE $${idx} OR l.lawyerfirstnameenglish ILIKE $${idx})`;
    dataSql  += ` AND (l.nic ILIKE $${idx} OR l.lawyerfirstnameenglish ILIKE $${idx})`;
  }

  // 📄 Pagination (only on dataSql)
  dataParams.push(limit, offset);
  dataSql += ` LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`;

  try {
    const countResult = await pool.query(countSql, countParams);
    const dataResult  = await pool.query(dataSql, dataParams);

    return {
      items: dataResult.rows,
      totalItems: parseInt(countResult.rows[0].total, 10),
    };
  } catch (err) {
    throw err;
  }
};

exports.approveLawyerDao = async (id, status, adminId) => {
    const sql = `
     UPDATE public.legalprofessionals 
     SET 
       approvestatus = $2,
       approvedby = $3,
       approvedat = NOW()
     WHERE id = $1
     RETURNING *;
   `;

  try {
    const result = await pool.query(sql, [id, status, adminId]);
    return result.rows;
  } catch (err) {
    throw err;
  }
};

exports.getApprovedLawyersDao = async (tab, province, district, searchText, page, limit) => {
  const offset = (page - 1) * limit;

  let countSql = `
    SELECT COUNT(*) AS total
    FROM public.legalprofessionals l
    LEFT JOIN courts c ON l.nearestcourtid = c.id
    WHERE l.approvestatus = $1
  `;

  let dataSql = `
    SELECT l.*, c.courtnameenglish 
    FROM public.legalprofessionals l
    LEFT JOIN courts c ON l.nearestcourtid = c.id
    WHERE l.approvestatus = $1
  `;

  const countParams = [tab];
  const dataParams  = [tab];

  // 🔍 Optional province filter
  if (province) {
    countParams.push(province);
    dataParams.push(province);
    countSql += ` AND l.province = $${countParams.length}`;
    dataSql  += ` AND l.province = $${dataParams.length}`;
  }

  // 🔍 Optional district filter
  if (district) {
    countParams.push(district);
    dataParams.push(district);
    countSql += ` AND l.district = $${countParams.length}`;
    dataSql  += ` AND l.district = $${dataParams.length}`;
  }

  // 🔍 Optional search filter
  if (searchText) {
    const searchValue = `%${searchText}%`;
    countParams.push(searchValue);
    dataParams.push(searchValue);
    const idx = countParams.length;

    countSql += ` AND (l.nic ILIKE $${idx} OR l.lawyerfirstnameenglish ILIKE $${idx})`;
    dataSql  += ` AND (l.nic ILIKE $${idx} OR l.lawyerfirstnameenglish ILIKE $${idx})`;
  }

  // 📄 Pagination (only on dataSql)
  dataParams.push(limit, offset);
  dataSql += ` LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`;

  try {
    const countResult = await pool.query(countSql, countParams);
    const dataResult  = await pool.query(dataSql, dataParams);

    return {
      items: dataResult.rows,
      totalItems: parseInt(countResult.rows[0].total, 10),
    };
  } catch (err) {
    throw err;
  }
};