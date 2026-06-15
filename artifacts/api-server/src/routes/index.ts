import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import searchRouter from "./search";
import historyRouter from "./history";
import providersRouter from "./providers";
import adminRouter from "./admin";
import uploadsRouter from "./uploads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(searchRouter);
router.use(historyRouter);
router.use(providersRouter);
router.use(adminRouter);
router.use(uploadsRouter);

export default router;
