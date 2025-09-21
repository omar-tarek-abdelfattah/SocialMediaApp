import { roleEnum } from "../../DB/models/User.model";

export const endpoint = {
    profile: [roleEnum.user],
    restoreAccount:[roleEnum.admin],
    hardDelete:[roleEnum.admin],

}