import { Router } from "express";
import {searchPatients} from '../controllers/patient.controllers.js';


const router = Router();

router.get("/", searchPatients);
//router.get("/patient/:id",readPatient);



export default router;