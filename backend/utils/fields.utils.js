export const PatientField = (patients) => {
  const entries = patients.entry || [];

  return entries.map((e) => {
    const nameObj = e.resource.name?.[0] || {};
    const firstname = nameObj.given?.[0] || "N/A";
    const middlename = nameObj.given?.[1] || "N/A";
    const lastname = nameObj.family || "N/A";

    const birthDate = e.resource.birthDate || "N/A";
    const gender = e.resource.gender || "N/A";

    const addressObj = e.resource.address?.[0] || {};
    const postalCode = addressObj.postalCode || "N/A";
    const state = addressObj.state || "N/A";

    const race = e.resource?.extension?.[1]?.valueCoding?.display || "N/A";
    const deceased = e.resource.deceasedBoolean ? "Yes" : "No";

    return {
      firstname,
      middlename,
      lastname,
      birthDate,
      gender,
      postalCode,
      state,
      race,
      deceased,
      id: e.resource.id || "N/A",
    };
  });
};


export const parseEOB = (data) => {
  const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
  
  if (!jsonData) return [];
  
  // Handle Bundle case
  if (jsonData.resourceType === 'Bundle' && jsonData.entry?.length) {
    return jsonData.entry
      .map(entry => entry.resource)
      .filter(resource => resource?.resourceType === 'ExplanationOfBenefit')
      .map(extractEOBFields);
  }
  
  // Handle direct EOB case
  if (jsonData.resourceType === 'ExplanationOfBenefit') {
    return extractEOBFields(jsonData);
  }
  
  return [];
};


const extractEOBFields = (eob) => {
  if (!eob) return {};
  
  // Helper function to get first matching coding entry
  const getCodingValue = (codingArray, systemPattern) => {
    if (!codingArray?.length) return {};
    const match = codingArray.find(c => c.system?.includes(systemPattern));
    return match || {};
  };

  // Extract basic information
  const typeCoding = getCodingValue(eob.type?.coding, 'claim-type');
  const primaryProvider = (eob.careTeam || []).find(ct => 
    ct.role?.coding?.some(c => c.code === 'primary' || c.display?.toLowerCase().includes('primary'))
  );

  // Process items with optimized array operations
  const items = (eob.item || []).map(item => {
    const coding = item.productOrService?.coding?.[0] || {};
    const adjudication = item.adjudication || [];
    
    const getAdjudicationAmount = (code) => adjudication.find(adj => 
      adj.category?.coding?.some(c => c.code === code)
    )?.amount?.value || 0;

    return {
      sequence: item.sequence || 0,
      productCode: coding.code || "N/A",
      productSystem: coding.system || "N/A",
      ndcCode: item.productOrService?.extension?.find(ext => 
        ext.url?.includes('ndc') && ext.valueCoding?.code
      )?.valueCoding?.code || "N/A",
      modifiers: (item.modifier || [])
        .map(mod => mod.coding?.[0]?.code)
        .filter(Boolean),
      serviceDate: item.servicedDate || (item.servicedPeriod ? 
        `${item.servicedPeriod.start || "N/A"} to ${item.servicedPeriod.end || "N/A"}` : 
        "N/A"),
      locationCode: item.locationCodeableConcept?.coding?.[0]?.code || "N/A",
      locationDisplay: item.locationCodeableConcept?.coding?.[0]?.display || "N/A",
      quantity: item.quantity?.value || 0,
      submittedAmount: getAdjudicationAmount('submitted'),
      allowedAmount: getAdjudicationAmount('eligible'),
      paidAmount: getAdjudicationAmount('benefit') || getAdjudicationAmount('paidtoprovider'),
      coinsuranceAmount: getAdjudicationAmount('coinsurance'),
      deductibleAmount: getAdjudicationAmount('deductible'),
      diagnosisReferences: item.diagnosisSequence || []
    };
  });

  // Process benefit balance with flatMap
  const benefitBalance = (eob.benefitBalance || []).flatMap(bb => 
    (bb.financial || []).map(fin => ({
      type: fin.type?.coding?.[0]?.display || "N/A",
      code: fin.type?.coding?.[0]?.code || "N/A",
      amount: fin.usedMoney?.value || 0,
      currency: fin.usedMoney?.currency || "USD"
    }))
  );

  return {
    id: eob.id || "N/A",
    status: eob.status || "N/A",
    created: eob.created || "N/A",
    patientReference: eob.patient?.reference || "N/A",
    type: {
      code: typeCoding.code || "N/A",
      display: typeCoding.display || "N/A"
    },
    billablePeriod: {
      start: eob.billablePeriod?.start || "N/A",
      end: eob.billablePeriod?.end || "N/A"
    },
    payment: {
      amount: eob.payment?.amount?.value || 0,
      currency: eob.payment?.amount?.currency || "USD"
    },
    provider: {
      name: primaryProvider?.provider?.display || "N/A",
      npi: primaryProvider?.provider?.identifier?.value || "N/A"
    },
    diagnoses: (eob.diagnosis || []).map(diag => {
      const coding = diag.diagnosisCodeableConcept?.coding?.[0] || {};
      return {
        sequence: diag.sequence || 0,
        code: coding.code || "N/A",
        display: coding.display || "N/A",
        system: coding.system || "N/A",
        type: diag.type?.[0]?.coding?.[0]?.code || "N/A"
      };
    }),
    items,
    benefitBalance
  };
};



export const CoverageField = (coverageBundle) => {
  // Early return if no valid data
  if (!coverageBundle?.entry?.length) return [];
  
  // Helper function to extract display value from coding
  const getDisplayValue = (codingArray) => {
    const coding = codingArray?.[0];
    return coding?.display || coding?.code || 'N/A';
  };

  return coverageBundle.entry.reduce((acc, entry) => {
    const resource = entry?.resource;
    
    // Skip if not a Coverage resource
    if (resource?.resourceType !== 'Coverage') return acc;
    
    // Extract common fields
    const coverage = {
      id: resource.id || 'N/A',
      status: resource.status || 'N/A',
      subscriberId: resource.subscriberId || 'N/A',
      beneficiaryReference: resource.beneficiary?.reference || 'N/A',
      relationship: getDisplayValue(resource.relationship?.coding),
      payor: resource.payor?.[0]?.identifier?.value || 'N/A',
    };

    // Extract plan type information
    const planClass = resource.class?.find(c => 
      c.type?.coding?.[0]?.code === 'plan'
    );
    const groupClass = resource.class?.find(c => 
      c.type?.coding?.[0]?.code === 'group'
    );
    
    coverage.type = planClass?.value ? 
      `${planClass.value} (${groupClass?.value || 'N/A'})` : 
      'N/A';

    // Process extensions
    const extensions = resource.extension || [];
    extensions.forEach(ext => {
      const key = ext.url.split('/').pop();
      
      if (ext.valueCoding) {
        coverage[key] = ext.valueCoding.display || ext.valueCoding.code || 'N/A';
      } else if (ext.valueDate) {
        coverage[key] = new Date(ext.valueDate).getFullYear().toString() || 'N/A';
      } else {
        coverage[key] = 'N/A';
      }
    });

    return [...acc, coverage];
  }, []);
};