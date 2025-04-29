import { getCoverage } from "../services/bluebutton.services.js";

export const searchCoverage = async (req, res) => {
  console.log("getCoverage called");

  if (!req.session.bbAccessToken) {
    console.log("No access token found in session:", req.session);
    // return res
    //   .status(401)
    //   .json({ redirect: true, url: "http://localhost:5500/api/auth/login" });
    res.redirect("http://localhost:5500/api/auth/login"); //eob testing
  }

  try {
    const response = await getCoverage(req.session.bbAccessToken);

    //console.log("data" + response.data);
    res.json(response);
    console.log(JSON.stringify(response.entry[0], null, 2));
  } catch (err) {
    console.log(err);
  }
};
