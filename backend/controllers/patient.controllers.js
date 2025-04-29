import { getPatient } from "../services/bluebutton.services.js";

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
    res.json(patients);
    //console.log(patients);
    //console.log(JSON.stringify(patients.entry[0], null, 2));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patient" });
    console.log(err);
  }
};
