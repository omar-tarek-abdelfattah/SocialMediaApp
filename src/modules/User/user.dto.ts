import z from "zod";
import { freezeAccount, logout, restoreAccount, updateBasic, updatePassword } from "./user.validation";

export type ILogoutBodyInput = z.infer<typeof logout.body>
export type IFreezeAccountParamsDTO = z.infer<typeof freezeAccount.params>
export type IRestoreAccountParamsDTO = z.infer<typeof restoreAccount.params>
export type IHardDeleteAccountParamsDTO = z.infer<typeof restoreAccount.params>
export type IUpdateBasicBodyDTO = z.infer<typeof updateBasic.body>
export type IUpdatePasswordBodyDTO = z.infer<typeof updatePassword.body>