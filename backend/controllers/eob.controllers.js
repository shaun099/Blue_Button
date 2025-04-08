import { getEob } from "../services/bluebutton.services.js";
import { extractMajorFields } from "../utils/jsonSimplifier.utils.js";

export const searchEob = async (req, res) => {
  console.log("get Eob called");
  if (!req.session.bbAccessToken) {
    console.log("No access token found in session:", req.session);
    return res
      .status(401)
      .json({ redirect: true, url: "http://localhost:5500/api/auth/login" });
    //res.redirect("http://localhost:5500/api/auth/login"); //eob testing
  }
  try {
    const PatientEob = await getEob(req.session.bbAccessToken);
    const data = extractMajorFields(PatientEob);
    //res.json(PatientEob);
    res.json(data);
    console.log(data);
  } catch (err) {
    console.log(err);
  }
};

