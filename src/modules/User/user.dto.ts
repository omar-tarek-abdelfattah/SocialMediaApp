import z from "zod";
import { logout } from "./user.validation";

export type ILogoutBodyInput = z.infer<typeof logout.body>