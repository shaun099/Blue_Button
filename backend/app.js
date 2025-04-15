import express from "express";
import session from "express-session";
import cors from "cors";
import passport from "passport";
import { PORT } from "./config/env.js";
import authRouter from "./routes/auth.routes.js";
import patientRouter from "./routes/patient.routes.js";
import eobRouter from "./routes/eob.routes.js";
import coverageRouter from "./routes/coverage.routes.js"

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  session({
    secret: "u4kXyZsH3gT8rBv2LpE7cWnAqDjMfYxQ",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true for production with HTTPS
      sameSite: "Lax", // Use 'Lax' for production or same-origin
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());



app.use("/api/auth", authRouter);
app.use("/api/patient", patientRouter);

app.use("/api/eob",eobRouter);

app.use("/api/coverage",coverageRouter);

app.get("/", (req, res) => {
  res.send("api running");
});

app.listen(PORT, () => {
  console.log(`api running on http://localhost:${PORT}`);
});
