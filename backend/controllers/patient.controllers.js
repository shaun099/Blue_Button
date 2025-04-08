import { getPatient } from "../services/bluebutton.services.js";

const simplifyPatientBundle = (bundle) => {
  if (
    !bundle ||
    !bundle.entry ||
    !Array.isArray(bundle.entry) ||
    bundle.entry.length === 0
  ) {
    return null;
  }

  const patient = bundle.entry[0].resource;
  if (!patient) return null;

  // Extract full name
  let fullName = "";
  if (patient.name && patient.name.length > 0) {
    const nameObj = patient.name[0];
    const givenNames = nameObj.given ? nameObj.given.join(" ") : "";
    const familyName = nameObj.family || "";
    fullName = `${givenNames} ${familyName}`.trim();
  }

  // Extract race
  let race = null;
  if (patient.extension && Array.isArray(patient.extension)) {
    const raceExt = patient.extension.find(
      (ext) => ext.url === "https://bluebutton.cms.gov/resources/variables/race"
    );
    if (raceExt && raceExt.valueCoding && raceExt.valueCoding.display) {
      race = raceExt.valueCoding.display;
    }
  }

  // Extract address
  let address = {};
  if (patient.address && patient.address.length > 0) {
    const addr = patient.address[0];
    address = {
      state: addr.state || null,
      postalCode: addr.postalCode || null,
    };
  }

  return {
    id: patient.id,
    name: fullName,
    gender: patient.gender || null,
    birthDate: patient.birthDate || null,
    deceasedDateTime: patient.deceasedDateTime || null,
    address,
    race,
  };
};

export const searchPatients = async (req, res) => {
  console.log("search patient func");
  if (!req.session.bbAccessToken) {
    console.log("No access token found in session:", req.session);
    return res
      .status(401)
      .json({ redirect: true, url: "http://localhost:5500/api/auth/login" });
  }
  try {
    const patients = await getPatient(req.session.bbAccessToken);
    const simplified = simplifyPatientBundle(patients);
    res.json(simplified);
    console.log(simplified); //debug

    //res.json(patients);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patient" });
    console.log(err);
  }
};
