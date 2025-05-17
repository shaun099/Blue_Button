import { getEob } from "../services/bluebutton.services.js";
import { parseEOB } from "../utils/fields.utils.js";

export const searchEob = async (req, res) => {
  console.log("get Eob called");
  if (!req.session.bbAccessToken) {
    console.log("No access token found in session:", req.session);
    return res
      .status(401)
      .json({ redirect: true, url: "http://localhost:5500/api/auth/login" });
  }
  try {
    const { type } = req.query; // type=carrier,snf
    const types = type ? type.split(",") : null;

    const PatientEob = await getEob(req.session.bbAccessToken, types);
    const response = parseEOB(PatientEob);
    res.json(response);
  } catch (err) {
    console.log(err);
  }
};
