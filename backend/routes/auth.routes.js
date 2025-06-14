import { Router } from "express";
import { getAuthUrl } from "../services/auth.services.js";
import { handleCallback } from "../controllers/auth.controllers.js";

const router = Router();

router.get("/login", (req, res) => {
  const state = Math.random().toString(36).substring(7);
  req.session.state = state;
  console.log("Generated state:", state);
  console.log("Session state set:", req.session.state);
  res.redirect(getAuthUrl(state));
});

router.get("/callback",handleCallback);

export default router;
