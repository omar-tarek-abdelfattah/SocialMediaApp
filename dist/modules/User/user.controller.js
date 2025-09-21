"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authentication_middleware_1 = require("../../middlewares/authentication.middleware");
const user_service_1 = __importDefault(require("./user.service"));
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const validators = __importStar(require("./user.validation"));
const token_security_1 = require("../../utils/security/token.security");
const multer_cloud_1 = require("../../utils/multer/multer.cloud");
const user_authorization_1 = require("./user.authorization");
const router = (0, express_1.Router)();
router.get(`/`, (0, authentication_middleware_1.authentication)(), user_service_1.default.profile);
router.post(`/logout`, (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.logout), user_service_1.default.logout);
router.patch(`/profile-image`, (0, authentication_middleware_1.authentication)(), user_service_1.default.profileImage);
router.patch(`/cover-images`, (0, authentication_middleware_1.authentication)(), (0, multer_cloud_1.cloudFileUpload)({
    validation: multer_cloud_1.fileValidation.image,
    storageType: multer_cloud_1.StorageEnum.disk,
    maxSizeMb: 4
}).array(`images`), user_service_1.default.coverImages);
router.patch("/update-basic", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.updateBasic), user_service_1.default.updateBasic);
router.patch("/send-update-password", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.updatePasswordRequest), user_service_1.default.updatePasswordRequest);
router.patch("/update-password", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.updatePassword), user_service_1.default.updatePassword);
router.delete("{/:userId}/freeze-account", (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.freezeAccount), user_service_1.default.freezeAccount);
router.delete("/:userId", (0, authentication_middleware_1.authorization)(user_authorization_1.endpoint.hardDelete), (0, validation_middleware_1.validation)(validators.hardDelete), user_service_1.default.hardDeleteAccount);
router.patch("/:userId/restore-account", (0, authentication_middleware_1.authorization)(user_authorization_1.endpoint.restoreAccount), (0, validation_middleware_1.validation)(validators.restoreAccount), user_service_1.default.restoreAccount);
router.patch('/enable-2fa', (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.enable2Fa), user_service_1.default.enable2Fa);
router.patch('/verify-2fa', (0, authentication_middleware_1.authentication)(), (0, validation_middleware_1.validation)(validators.verify2Fa), user_service_1.default.verify2Fa);
router.post(`/refresh-token`, (0, authentication_middleware_1.authentication)(token_security_1.TokenEnum.refresh), user_service_1.default.refreshToken);
exports.default = router;
