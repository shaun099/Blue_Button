import { getEob } from "../services/bluebutton.services.js";
//import { filterCarrierEOB, transformEOB } from "../utils/carrier.utils.js";

//import { filterOutpatientEOB, transformOutpatientEOB } from "../utils/outpatient.utils.js";
import { filterInpatientEOB,transformInpatientEOB } from "../utils/inpatient.utils.js";

export const searchEob = async (req, res) => {
  console.log("get Eob called");
  if (!req.session.bbAccessToken) {
    console.log("No access token found in session:", req.session);
    // return res
    //   .status(401)
    //   .json({ redirect: true, url: "http://localhost:5500/api/auth/login" });
    return res.redirect("http://localhost:5500/api/auth/login/");
  }
  try {
    const { type } = req.query; // type=carrier,snf
    const types = type ? type.split(",") : null;

    const PatientEob = await getEob(req.session.bbAccessToken, types);
    //res.json(PatientEob);
    //const data = filterCarrierEOB(PatientEob);
    //const data = filterOutpatientEOB(PatientEob);
    const data = filterInpatientEOB(PatientEob);
    const output = transformInpatientEOB(data);
    //const output = transformOutpatientEOB(data);
    //const output = transformEOB(data);
    return res.json(output);
  } catch (err) {
    console.log(err);
  }
};
