const { pool } = require('../config/db');

exports.getCaseDetailsForHearingDao = async (caseId) => {
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
        console.log('result', result.rows[0])
        return result.rows[0];
    } catch (err) {
        throw err;
    }
};


exports.getCasePartyDetailsForHearingDao = async (caseId) => {
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

exports.createHearingDao = async (hearingData, officerId) => {
    const sql = `
      INSERT INTO public.hearings (
        caseid,
        createdofficerid,
        hearingtype,
        hearingstatus,
        hearingdate,
        descriptionenglish,
        descriptionsinhala,
        descriptiontamil,
        judgename
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
  
    const values = [
      hearingData.caseId,
      officerId, // must be provided separately
      hearingData.hearingType,
      hearingData.hearingStatus || 'SCHEDULED',
      hearingData.date, // should be full timestamp ideally
      hearingData.descriptions?.en || null,
      hearingData.descriptions?.si || null,
      hearingData.descriptions?.ta || null,
      hearingData.presidingJudge
    ];
  
    try {
      const result = await pool.query(sql, values);
      return result.rows[0];
    } catch (err) {
      throw err;
    }
  };