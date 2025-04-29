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
