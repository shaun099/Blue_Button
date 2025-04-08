
export const extractMajorFields = (bundleJson) => {
    // Parse the JSON if it's a string, otherwise use directly
    const bundle = typeof bundleJson === 'string' ? JSON.parse(bundleJson) : bundleJson;
  
    // Initialize result array to store extracted data for each ExplanationOfBenefit
    const results = [];
  
    // Check if bundle and entries exist
    if (bundle.resourceType !== 'Bundle' || !bundle.entry || !Array.isArray(bundle.entry)) {
      console.error('Invalid Bundle structure');
      return results;
    }
  
    // Iterate over each entry in the bundle
    bundle.entry.forEach((entry, index) => {
      const eob = entry.resource;
  
      if (eob.resourceType !== 'ExplanationOfBenefit') {
        console.warn(`Entry ${index} is not an ExplanationOfBenefit, skipping...`);
        return;
      }
  
      // Extract major fields
      const extractedData = {
        id: eob.id,
        patientReference: eob.patient?.reference || 'N/A',
        status: eob.status,
        type: eob.type?.coding?.[0]?.display || eob.type?.coding?.[0]?.code || 'N/A',
        billablePeriod: {
          start: eob.billablePeriod?.start || 'N/A',
          end: eob.billablePeriod?.end || 'N/A',
        },
        organizationNPI: eob.organization?.identifier?.value || 'N/A',
        facilityType: eob.facility?.extension?.[0]?.valueCoding?.display || 'N/A',
        facilityNPI: eob.facility?.identifier?.value || 'N/A',
        servicedDate: eob.item?.[0]?.servicedDate || 'N/A',
        medication: eob.item?.[0]?.service?.coding?.[0]?.display || eob.item?.[0]?.service?.coding?.[0]?.code || 'N/A',
        quantity: {
          value: eob.item?.[0]?.quantity?.value || 'N/A',
          fillNum: eob.item?.[0]?.quantity?.extension?.find(ext => ext.url === 'https://bluebutton.cms.gov/resources/variables/fill_num')?.valueQuantity?.value || 'N/A',
          daysSupply: eob.item?.[0]?.quantity?.extension?.find(ext => ext.url === 'https://bluebutton.cms.gov/resources/variables/days_suply_num')?.valueQuantity?.value || 'N/A',
        },
        adjudications: eob.item?.[0]?.adjudication?.map(adjud => ({
          category: adjud.category?.coding?.[0]?.display || adjud.category?.coding?.[0]?.code || 'N/A',
          amount: adjud.amount?.value || 'N/A',
          currency: adjud.amount?.code || 'N/A',
        })) || [],
        information: eob.information?.map(info => ({
          sequence: info.sequence,
          category: info.category?.coding?.[0]?.display || info.category?.coding?.[0]?.code || 'N/A',
          code: info.code?.coding?.[0]?.display || info.code?.coding?.[0]?.code || 'N/A',
        })) || [],
      };
  
      results.push(extractedData);
    });
  
    return results;
  };