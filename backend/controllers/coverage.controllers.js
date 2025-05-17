import { getCoverage } from "../services/bluebutton.services.js";
import { CoverageField } from "../utils/fields.utils.js";

export const searchCoverage = async (req, res) => {
  console.log("getCoverage called");

  if (!req.session.bbAccessToken) {
    console.log("No access token found in session:", req.session);
    return res
      .status(401)
      .json({ redirect: true, url: "http://localhost:5500/api/auth/login" });
  }

  try {
    const coverage = await getCoverage(req.session.bbAccessToken);
    const response = CoverageField(coverage);
    res.json(response);
  } catch (err) {
    console.log(err);
  }
};
