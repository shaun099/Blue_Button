/**
 * Filters a FHIR Bundle to return only carrier ExplanationOfBenefit resources.
 * @param {object} bundle - The FHIR bundle from Blue Button 2.0 API
 * @returns {object} - A bundle containing only carrier ExplanationOfBenefit resources
 */
export function filterCarrierEOB(bundle) {
  if (!bundle || !Array.isArray(bundle.entry)) {
    return { ...bundle, entry: [] };
  }
  const filteredEntries = bundle.entry.filter((e) => {
    const res = e.resource;
    if (!res || res.resourceType !== "ExplanationOfBenefit") return false;
    if (!res.type || !res.type.coding) return false;
    return res.type.coding.some(
      (coding) =>
        coding.system ===
          "https://bluebutton.cms.gov/resources/codesystem/eob-type" &&
        coding.code === "CARRIER"
    );
  });
  return {
    ...bundle,
    entry: filteredEntries,
    total: filteredEntries.length,
  };
}

// export function transformEOB(rawFHIR) {
//   if (!rawFHIR?.entry?.[0]?.resource) {
//     throw new Error("Invalid FHIR input: no claim resource found.");
//   }
//   const claim = rawFHIR.entry[0].resource;

//   const findAmount = (adjudications, keyword) => {
//     const entry = adjudications.find((a) =>
//       a.category.coding.some((c) => c.code.toLowerCase().includes(keyword))
//     );
//     return entry?.amount?.value ?? 0;
//   };

//   const careTeamBySequence = new Map(
//     (claim.careTeam || []).map((ct) => [
//       ct.sequence,
//       {
//         name: ct.provider?.display || "Not provided",
//         npi: ct.provider?.identifier?.value || null,
//         role: ct.role?.coding?.[0]?.display || "Unknown",
//         specialty:
//           ct.qualification?.coding?.find((c) =>
//             c.system.includes("prvdr_spclty")
//           )?.display || null,
//       },
//     ])
//   );

//   const diagnosisBySequence = new Map(
//     (claim.diagnosis || []).map((d) => [
//       d.sequence,
//       {
//         code: d.diagnosisCodeableConcept?.coding?.[0]?.code || "Unknown",
//         description:
//           d.diagnosisCodeableConcept?.coding?.[0]?.display?.replace(/"/g, "") ||
//           "Not provided",
//         type: d.type?.[0]?.coding?.[0]?.display || "Unknown",
//       },
//     ])
//   );

//   const services = (claim.item || []).map((item) => {
//     const adjudications = item.adjudication || [];

//     const linkedDiagnoses = (item.diagnosisSequence || []).map(
//       (seq) =>
//         diagnosisBySequence.get(seq) || {
//           code: "Unknown",
//           description: "Not linked",
//           type: "Unknown",
//         }
//     );

//     const linkedCareTeam = (item.careTeamSequence || []).map(
//       (seq) =>
//         careTeamBySequence.get(seq) || {
//           name: "Not provided",
//           npi: null,
//           role: "Unknown",
//           specialty: null,
//         }
//     );

//     return {
//       description: item.category?.coding?.[0]?.display || "Unknown service",
//       code: item.productOrService?.coding?.[0]?.code || "N/A",
//       serviceDate: item.servicedPeriod?.start || "Unknown",
//       location: item.locationCodeableConcept?.coding?.[0]?.display || "Unknown",
//       diagnoses: linkedDiagnoses,
//       providers: linkedCareTeam,
//       costBreakdown: {
//         submittedAmount: findAmount(adjudications, "submitted"),
//         allowedAmount: findAmount(adjudications, "eligible"),
//         insuranceCovered: findAmount(adjudications, "benefit"),
//         paidToProvider: findAmount(adjudications, "paidtoprovider"),
//         paidToPatient: findAmount(adjudications, "paidtopatient"),
//         coinsurance: findAmount(adjudications, "coinsurance"),
//         deductible: findAmount(adjudications, "deductible"),
//       },
//     };
//   });

//   const testResults = (claim.contained || [])
//     .filter((r) => r.resourceType === "Observation")
//     .map((obs) => ({
//       testName: obs.code?.coding?.[0]?.display || "Unknown Test",
//       result: obs.valueQuantity?.value ?? null,
//     }));

//   return {
//     claimId: claim.id,
//     claimDate: claim.billablePeriod?.start || "Unknown",
//     claimStatus: claim.status || "Unknown",
//     claimOutcome: claim.outcome || "Unknown",
//     provider: {
//       name:
//         claim.careTeam?.find((ct) =>
//           ct.role?.coding?.some((r) => r.code === "primary")
//         )?.provider?.display || "Not provided",
//       npi:
//         claim.provider?.identifier?.value !== "UNKNOWN"
//           ? claim.provider?.identifier?.value
//           : null,
//       location: {
//         state:
//           claim.item?.[0]?.locationCodeableConcept?.extension?.find((e) =>
//             e.url.includes("state")
//           )?.valueCoding?.code || "Unknown",
//         zip:
//           claim.item?.[0]?.locationCodeableConcept?.extension?.find((e) =>
//             e.url.includes("zip")
//           )?.valueCoding?.code || "Unknown",
//       },
//     },
//     services,
//     careTeam: Array.from(careTeamBySequence.values()),
//     diagnosis: Array.from(diagnosisBySequence.values()),
//     financialSummary: {
//       submittedTotal:
//         claim.benefitBalance?.[0]?.financial?.find((f) =>
//           f.type?.coding?.some((c) => c.code.includes("sbmtd"))
//         )?.usedMoney?.value || 0,
//       allowedTotal:
//         claim.benefitBalance?.[0]?.financial?.find((f) =>
//           f.type?.coding?.some((c) => c.code.includes("alowd"))
//         )?.usedMoney?.value || 0,
//       paidToProvider:
//         claim.benefitBalance?.[0]?.financial?.find((f) =>
//           f.type?.coding?.some((c) => c.code.includes("prvdr_pmt"))
//         )?.usedMoney?.value || 0,
//       paidToPatient:
//         claim.benefitBalance?.[0]?.financial?.find((f) =>
//           f.type?.coding?.some((c) => c.code.includes("bene_pmt"))
//         )?.usedMoney?.value || 0,
//       deductibleApplied:
//         claim.benefitBalance?.[0]?.financial?.find((f) =>
//           f.type?.coding?.some((c) => c.code.includes("ddctbl"))
//         )?.usedMoney?.value || 0,
//       payer: claim.insurer?.identifier?.value || "Not provided",
//       paymentMethod: (() => {
//         const adj = claim.item?.[0]?.adjudication || [];
//         const paidToProvider = findAmount(adj, "paidtoprovider");
//         const paidToPatient = findAmount(adj, "paidtopatient");
//         if (paidToProvider > 0) return "Direct to provider";
//         if (paidToPatient > 0) return "Reimbursement to patient";
//         return "Unknown";
//       })(),
//     },
//     testResults,
//   };
// }

//test 2---
// /**
//  * Transforms Carrier EOB data from Blue Button 2.0 API
//  * @param {Object} rawFHIR - Raw FHIR response containing carrier claims
//  * @returns {Object} Simplified carrier claim data
//  */
// export function transformEOB(rawFHIR) {
//   if (!rawFHIR?.entry?.length) {
//     throw new Error("Invalid FHIR input: no entries found")
//   }

//   // Extract the carrier claim (first entry in this case)
//   const claim = rawFHIR.entry[0].resource;
//   if (!claim || claim.resourceType !== 'ExplanationOfBenefit') {
//     throw new Error("Invalid FHIR input: no ExplanationOfBenefit resource found");
//   }

//   // Helper to safely extract values with defaults
//   const getValue = (obj, path, defaultValue = null) => {
//     return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : defaultValue), obj);
//   };

//   // Helper to find amounts in adjudications
//   const findAmount = (adjudications, keyword) => {
//     const entry = (adjudications || []).find(a =>
//       a.category?.coding?.some(c =>
//         c.code?.toLowerCase().includes(keyword.toLowerCase())
//       )
//     );
//     return entry?.amount?.value ?? 0;
//   };

//   // Extract important extensions
//   const extensions = {
//     carrierNumber: getValue(claim, 'extension[?(@.url=="https://bluebutton.cms.gov/resources/variables/carr_num")].valueIdentifier.value'),
//     claimControlNumber: getValue(claim, 'extension[?(@.url=="https://bluebutton.cms.gov/resources/variables/carr_clm_cntl_num")].valueIdentifier.value'),
//     assignmentCode: getValue(claim, 'extension[?(@.url=="https://bluebutton.cms.gov/resources/variables/asgmntcd")].valueCoding.display'),
//     claimEntryCode: getValue(claim, 'extension[?(@.url=="https://bluebutton.cms.gov/resources/variables/carr_clm_entry_cd")].valueCoding.display')
//   };

//   // Process care team members
//   const careTeam = (claim.careTeam || []).map(ct => ({
//     sequence: ct.sequence,
//     providerId: getValue(ct, 'provider.identifier.value'),
//     name: getValue(ct, 'provider.display', 'Not provided'),
//     npi: getValue(ct, 'provider.identifier.value'),
//     role: getValue(ct, 'role.coding.0.display', 'Unknown'),
//     isResponsible: ct.responsible || false,
//     specialty: (ct.qualification?.coding || []).find(c =>
//       c.system?.includes('prvdr_spclty')
//     )?.display,
//     participation: getValue(ct, 'extension[?(@.url=="https://bluebutton.cms.gov/resources/variables/prtcptng_ind_cd")].valueCoding.display')
//   }));

//   // Find performing provider (responsible = true)
//   const performingProvider = careTeam.find(ct => ct.isResponsible) || {};

//   // Process diagnoses
//   const diagnoses = (claim.diagnosis || []).map(d => ({
//     sequence: d.sequence,
//     code: getValue(d, 'diagnosisCodeableConcept.coding.0.code', 'Unknown'),
//     description: (getValue(d, 'diagnosisCodeableConcept.coding.0.display', 'Not provided') || '').replace(/"/g, ''),
//     type: getValue(d, 'type.0.coding.0.display', 'Unknown')
//   }));

//   // Process line items
//   const lineItems = (claim.item || []).map(item => {
//     const adjudications = item.adjudication || [];

//     // Extract line-level extensions
//     const lineExtensions = {
//       betosCode: getValue(item, 'extension[?(@.url=="https://bluebutton.cms.gov/resources/variables/betos_cd")].valueCoding.display'),
//       processingIndicator: getValue(item, 'extension[?(@.url=="https://bluebutton.cms.gov/resources/variables/line_prcsg_ind_cd")].valueCoding.display'),
//       cliaLabNumber: getValue(item, 'extension[?(@.url=="https://bluebutton.cms.gov/resources/variables/carr_line_clia_lab_num")].valueIdentifier.value')
//     };

//     // Extract NDC code if present
//     const ndcCode = getValue(item, 'productOrService.extension[?(@.url=="http://hl7.org/fhir/sid/ndc")].valueCoding.code');

//     return {
//       lineNumber: item.sequence,
//       serviceDate: getValue(item, 'servicedPeriod.start') || getValue(item, 'servicedDate'),
//       procedureCode: getValue(item, 'productOrService.coding.0.code'),
//       procedureDescription: getValue(item, 'productOrService.coding.0.display'),
//       modifiers: (item.modifier || []).map(m => ({
//         code: getValue(m, 'coding.0.code'),
//         description: getValue(m, 'coding.0.display')
//       })),
//       diagnosisPointers: item.diagnosisSequence || [],
//       placeOfService: {
//         code: getValue(item, 'locationCodeableConcept.coding.0.code'),
//         description: getValue(item, 'locationCodeableConcept.coding.0.display'),
//         state: getValue(item, 'locationCodeableConcept.extension[?(@.url=="https://bluebutton.cms.gov/resources/variables/prvdr_state_cd")].valueCoding.code'),
//         zip: getValue(item, 'locationCodeableConcept.extension[?(@.url=="https://bluebutton.cms.gov/resources/variables/prvdr_zip")].valueCoding.code')
//       },
//       quantity: getValue(item, 'quantity.value'),
//       ndcCode: ndcCode,
//       extensions: lineExtensions,
//       pricing: {
//         submitted: findAmount(adjudications, 'submitted'),
//         allowed: findAmount(adjudications, 'eligible'),
//         payment: findAmount(adjudications, 'paidtoprovider'),
//         patientResponsibility: {
//           coinsurance: findAmount(adjudications, 'coinsurance'),
//           deductible: findAmount(adjudications, 'deductible'),
//           nonCovered: findAmount(adjudications, 'noncovered')
//         }
//       },
//       adjudicationDetails: adjudications.map(a => ({
//         category: getValue(a, 'category.coding.0.display'),
//         amount: a.amount?.value,
//         reason: getValue(a, 'reason.coding.0.display')
//       }))
//     };
//   });

//   // Process test results from contained resources
//   const testResults = (claim.contained || [])
//     .filter(r => r.resourceType === 'Observation')
//     .map(obs => ({
//       testId: obs.id,
//       testName: getValue(obs, 'code.coding.0.display', 'Unknown Test'),
//       code: getValue(obs, 'code.coding.0.code'),
//       result: obs.valueQuantity?.value ?? getValue(obs, 'valueString'),
//       unit: getValue(obs, 'valueQuantity.unit')
//     }));

//   // Calculate totals
//   const totals = {
//     submitted: lineItems.reduce((sum, item) => sum + item.pricing.submitted, 0),
//     allowed: lineItems.reduce((sum, item) => sum + item.pricing.allowed, 0),
//     paid: lineItems.reduce((sum, item) => sum + item.pricing.payment, 0),
//     patientResponsibility: {
//       coinsurance: lineItems.reduce((sum, item) => sum + item.pricing.patientResponsibility.coinsurance, 0),
//       deductible: lineItems.reduce((sum, item) => sum + item.pricing.patientResponsibility.deductible, 0),
//       nonCovered: lineItems.reduce((sum, item) => sum + item.pricing.patientResponsibility.nonCovered, 0)
//     }
//   };

//   // Extract claim-level payment information
//   const payment = {
//     amount: claim.payment?.amount?.value || 0,
//     date: claim.created,
//     method: totals.paid > 0 ? 'Direct to provider' :
//             totals.patientResponsibility.coinsurance > 0 ? 'Patient responsibility' :
//             'Unknown'
//   };

//   // Return the transformed structure
//   return {
//     claimInfo: {
//       id: claim.id,
//       type: getValue(claim, 'type.coding.0.display', 'Professional Claim'),
//       status: claim.status,
//       outcome: claim.outcome,
//       receivedDate: getValue(claim, 'supportingInfo[?(@.category.coding[0].code=="clmrecvddate")].timingDate'),
//       servicePeriod: {
//         start: claim.billablePeriod?.start,
//         end: claim.billablePeriod?.end
//       },
//       extensions: extensions
//     },
//     patient: {
//       id: getValue(claim, 'patient.reference'),
//       medicareId: getValue(claim, 'patient.identifier.value')
//     },
//     providers: {
//       performing: performingProvider,
//       billing: {
//         npi: getValue(claim, 'provider.identifier.value'),
//         name: getValue(claim, 'provider.display')
//       },
//       referral: careTeam.find(ct => ct.role === 'Referring'),
//       allMembers: careTeam
//     },
//     insurance: {
//       type: 'Medicare Part B',
//       payer: {
//         id: getValue(claim, 'insurer.identifier.value'),
//         name: 'Medicare'
//       },
//       isAssigned: extensions.assignmentCode === 'Assigned claim'
//     },
//     lineItems,
//     diagnoses,
//     testResults,
//     financials: {
//       totals,
//       payment,
//       benefitBalance: (claim.benefitBalance || []).map(b => ({
//         category: getValue(b, 'category.coding.0.display'),
//         financials: (b.financial || []).map(f => ({
//           type: getValue(f, 'type.coding.0.display'),
//           amount: f.usedMoney?.value
//         }))
//       }))
//     },
//     meta: {
//       lastUpdated: getValue(claim, 'meta.lastUpdated'),
//       profile: getValue(claim, 'meta.profile.0')
//     }
//   };
// }



/**
 * Enhanced transformation for Blue Button 2.0 Carrier EOBs:
 * - Produces fully "connected" data: each line item includes its related diagnoses and care team members as full objects.
 * - Returns a structured summary for UI or downstream processing.
 *
 * @typedef {Object} Pricing
 * @property {number} submitted
 * @property {number} allowed
 * @property {number} payment
 * @property {Object} patientResponsibility
 *
 * @typedef {Object} CarrierLineItem
 * @property {number} lineNumber
 * @property {string} serviceDate
 * @property {string|null} procedureCode
 * @property {string|null} procedureDescription
 * @property {Array<{code: string, description: string}>} modifiers
 * @property {Array<number>} diagnosisPointers
 * @property {Object} placeOfService
 * @property {number|null} quantity
 * @property {string|null} ndcCode
 * @property {Object} extensions
 * @property {Pricing} pricing
 * @property {Array<Object>} adjudicationDetails
 * @property {Array<Object>} diagnoses    // <-- Full diagnosis objects (added)
 * @property {Array<Object>} careTeam     // <-- Full care team objects (added)
 */

/**
 * Safely access nested values using a path string (e.g., 'a.b.c')
 * @param {Object} obj
 * @param {string} path
 * @param {*} [defaultValue=null]
 * @returns {*}
 */
const getValue = (obj, path, defaultValue = null) => {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : defaultValue), obj);
};

/**
 * Extract value from extensions by matching URL
 * @param {Array} extensions
 * @param {string} url
 * @returns {*}
 */
const getExtensionValue = (extensions, url) => {
  return extensions?.find(e => e.url === url);
};

/**
 * Transform Carrier EOB from FHIR format to structured, relational JSON
 * Each line item includes its related diagnoses and care team as full objects.
 * @param {Object} rawFHIR - The raw FHIR ExplanationOfBenefit bundle
 * @returns {Object}
 */
export function transformEOB(rawFHIR) {
  if (!rawFHIR?.entry?.length) {
    throw new Error("Invalid FHIR input: no entries found");
  }

  const claim = rawFHIR.entry[0]?.resource;
  if (!claim || claim.resourceType !== "ExplanationOfBenefit") {
    throw new Error("Invalid FHIR input: ExplanationOfBenefit missing or invalid");
  }

  // --- Index diagnoses and care team by sequence for fast lookup ---
  const diagnoses = (claim.diagnosis || []).map(d => ({
    sequence: d.sequence,
    code: getValue(d, 'diagnosisCodeableConcept.coding.0.code', 'Unknown'),
    description: getValue(d, 'diagnosisCodeableConcept.coding.0.display', 'Not provided')?.replace(/"/g, ''),
    type: getValue(d, 'type.0.coding.0.display', 'Unknown')
  }));
  const diagnosisMap = Object.fromEntries(diagnoses.map(d => [d.sequence, d]));

  const careTeam = (claim.careTeam || []).map(ct => {
    const ext = ct.extension || [];
    return {
      sequence: ct.sequence,
      providerId: getValue(ct, 'provider.identifier.value'),
      name: getValue(ct, 'provider.display', 'Not provided'),
      npi: getValue(ct, 'provider.identifier.value'),
      role: getValue(ct, 'role.coding.0.display', 'Unknown'),
      isResponsible: ct.responsible || false,
      specialty: (ct.qualification?.coding || []).find(c => c.system?.includes('prvdr_spclty'))?.display || null,
      participation: getExtensionValue(ext, 'https://bluebutton.cms.gov/resources/variables/prtcptng_ind_cd')?.valueCoding?.display
    };
  });
  const careTeamMap = Object.fromEntries(careTeam.map(ct => [ct.sequence, ct]));

  const findAmount = (adjudications, keyword) => {
    const entry = (adjudications || []).find(a =>
      a.category?.coding?.some(c => c.code?.toLowerCase().includes(keyword.toLowerCase()))
    );
    return entry?.amount?.value ?? 0;
  };

  // --- Build connected line items ---
  const lineItems = (claim.item || []).map(item => {
    const adj = item.adjudication || [];
    const ext = item.extension || [];

    const ndcCode = getExtensionValue(item.productOrService?.extension, 'http://hl7.org/fhir/sid/ndc')?.valueCoding?.code;

    // Connections: diagnoses & care team
    const itemDiagnoses = (item.diagnosisSequence || []).map(seq => diagnosisMap[seq]).filter(Boolean);
    const itemCareTeam = (item.careTeamSequence || []).map(seq => careTeamMap[seq]).filter(Boolean);

    return {
      lineNumber: item.sequence,
      serviceDate: getValue(item, 'servicedPeriod.start') || getValue(item, 'servicedDate', 'Unknown'),
      procedureCode: getValue(item, 'productOrService.coding.0.code', null),
      procedureDescription: getValue(item, 'productOrService.coding.0.display', null),
      modifiers: (item.modifier || []).map(m => ({
        code: getValue(m, 'coding.0.code'),
        description: getValue(m, 'coding.0.display')
      })),
      diagnosisPointers: item.diagnosisSequence || [],
      placeOfService: {
        code: getValue(item, 'locationCodeableConcept.coding.0.code'),
        description: getValue(item, 'locationCodeableConcept.coding.0.display'),
        state: getExtensionValue(item.locationCodeableConcept?.extension, 'https://bluebutton.cms.gov/resources/variables/prvdr_state_cd')?.valueCoding?.code,
        zip: getExtensionValue(item.locationCodeableConcept?.extension, 'https://bluebutton.cms.gov/resources/variables/prvdr_zip')?.valueCoding?.code
      },
      quantity: getValue(item, 'quantity.value'),
      ndcCode,
      extensions: {
        betosCode: getExtensionValue(ext, 'https://bluebutton.cms.gov/resources/variables/betos_cd')?.valueCoding?.display,
        processingIndicator: getExtensionValue(ext, 'https://bluebutton.cms.gov/resources/variables/line_prcsg_ind_cd')?.valueCoding?.display,
        cliaLabNumber: getExtensionValue(ext, 'https://bluebutton.cms.gov/resources/variables/carr_line_clia_lab_num')?.valueIdentifier?.value
      },
      pricing: {
        submitted: findAmount(adj, 'submitted'),
        allowed: findAmount(adj, 'eligible'),
        payment: findAmount(adj, 'paidtoprovider'),
        patientResponsibility: {
          coinsurance: findAmount(adj, 'coinsurance'),
          deductible: findAmount(adj, 'deductible'),
          nonCovered: findAmount(adj, 'noncovered')
        }
      },
      adjudicationDetails: adj.map(a => ({
        category: getValue(a, 'category.coding.0.display'),
        amount: a.amount?.value,
        reason: getValue(a, 'reason.coding.0.display')
      })),
      diagnoses: itemDiagnoses,
      careTeam: itemCareTeam
    };
  });

  lineItems.sort((a, b) =>
    new Date(a.serviceDate || '2100-01-01') - new Date(b.serviceDate || '2100-01-01')
  );

  // Test Results
  const testResults = (claim.contained || [])
    .filter(r => r.resourceType === 'Observation')
    .map(obs => ({
      testId: obs.id,
      testName: getValue(obs, 'code.coding.0.display', 'Unknown Test'),
      code: getValue(obs, 'code.coding.0.code'),
      result: obs.valueQuantity?.value ?? getValue(obs, 'valueString'),
      unit: getValue(obs, 'valueQuantity.unit')
    }));

  // Totals
  const totals = {
    submitted: lineItems.reduce((sum, item) => sum + (item.pricing.submitted || 0), 0),
    allowed: lineItems.reduce((sum, item) => sum + (item.pricing.allowed || 0), 0),
    paid: lineItems.reduce((sum, item) => sum + (item.pricing.payment || 0), 0),
    patientResponsibility: {
      coinsurance: lineItems.reduce((sum, item) => sum + (item.pricing.patientResponsibility.coinsurance || 0), 0),
      deductible: lineItems.reduce((sum, item) => sum + (item.pricing.patientResponsibility.deductible || 0), 0),
      nonCovered: lineItems.reduce((sum, item) => sum + (item.pricing.patientResponsibility.nonCovered || 0), 0)
    }
  };

  const extensions = claim.extension || [];

  const payment = {
    amount: claim.payment?.amount?.value || 0,
    date: claim.created || null,
    method: totals.paid > 0 ? 'Direct to provider' :
            totals.patientResponsibility.coinsurance > 0 ? 'Patient responsibility' :
            'Unknown'
  };

  return {
    claimInfo: {
      id: claim.id,
      type: getValue(claim, 'type.coding.0.display', 'Professional Claim'),
      status: claim.status,
      outcome: claim.outcome,
      receivedDate: getValue(claim, 'supportingInfo[?(@.category.coding[0].code=="clmrecvddate")].timingDate'),
      servicePeriod: {
        start: claim.billablePeriod?.start,
        end: claim.billablePeriod?.end
      },
      extensions: {
        carrierNumber: getExtensionValue(extensions, 'https://bluebutton.cms.gov/resources/variables/carr_num')?.valueIdentifier?.value,
        claimControlNumber: getExtensionValue(extensions, 'https://bluebutton.cms.gov/resources/variables/carr_clm_cntl_num')?.valueIdentifier?.value,
        assignmentCode: getExtensionValue(extensions, 'https://bluebutton.cms.gov/resources/variables/asgmntcd')?.valueCoding?.display,
        claimEntryCode: getExtensionValue(extensions, 'https://bluebutton.cms.gov/resources/variables/carr_clm_entry_cd')?.valueCoding?.display
      }
    },
    patient: {
      id: getValue(claim, 'patient.reference'),
      medicareId: getValue(claim, 'patient.identifier.value')
    },
    providers: {
      allMembers: careTeam
    },
    insurance: {
      type: 'Medicare Part B',
      payer: {
        id: getValue(claim, 'insurer.identifier.value'),
        name: 'Medicare'
      },
      isAssigned: getExtensionValue(extensions, 'https://bluebutton.cms.gov/resources/variables/asgmntcd')?.valueCoding?.display === 'Assigned claim'
    },
    lineItems,
    diagnoses,
    testResults,
    financials: {
      totals,
      payment,
      benefitBalance: (claim.benefitBalance || []).map(b => ({
        category: getValue(b, 'category.coding.0.display'),
        financials: (b.financial || []).map(f => ({
          type: getValue(f, 'type.coding.0.display'),
          amount: f.usedMoney?.value
        }))
      }))
    },
    meta: {
      lastUpdated: getValue(claim, 'meta.lastUpdated'),
      profile: getValue(claim, 'meta.profile.0')
    }
  };
}

