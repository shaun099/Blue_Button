import { Router } from "express";
import {searchEob} from "../controllers/eob.controllers.js";

const router = Router();

router.get("/",searchEob);

export default router;
