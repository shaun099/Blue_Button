import { exchangeCodeForToken } from "../services/auth.services.js";

export const handleCallback = async (req, res) => {
  console.log("callback called");
  const { code, state } = req.query;

  if (!state || state !== req.session.state) {
    console.log("Callback: Query state:", state); //debug
    console.log("Callback: Session state:", req.session.state); //debug
    return res.status(400).json({ message: "Invalid state" });
  }

  try {
    const { accessToken, patientId } = await exchangeCodeForToken(code);
    req.session.bbAccessToken = accessToken;
    req.session.patient_id = patientId;

    //debug
    console.log("----callback----\n");
    console.log("access token :", accessToken);
    console.log("session after token :", req.session);

    req.session.save((err) => {
      if (err) {
        console.error("CALLBACK SESSION ERROR"); //debug
        return res.status(500).json({ message: "Session save failed" });
      }

      res.redirect("http://localhost:5173?auth=done");
      //res.redirect("http://localhost:5500/api/eob/");//eob debug
      //res.redirect("http://localhost:5500/api/coverage/");//coverage testing
    });
  } catch (err) {
    console.error("Callback: OAuth callback error:", err); //debug
    res.status(500).json({ message: "callback error" });
  }
};
