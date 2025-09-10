"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.providerEnum = exports.roleEnum = exports.GenderEnum = void 0;
const mongoose_1 = require("mongoose");
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["male"] = "male";
    GenderEnum["female"] = "female";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var roleEnum;
(function (roleEnum) {
    roleEnum["admin"] = "admin";
    roleEnum["user"] = "user";
})(roleEnum || (exports.roleEnum = roleEnum = {}));
var providerEnum;
(function (providerEnum) {
    providerEnum["system"] = "system";
    providerEnum["google"] = "google";
})(providerEnum || (exports.providerEnum = providerEnum = {}));
const userSchema = new mongoose_1.Schema({
    firstName: { type: String, required: true, minLength: 2, maxLength: 25 },
    lastName: { type: String, required: true, minLength: 2, maxLength: 25 },
    email: { type: String, required: true, unique: true },
    password: {
        type: String, required: function () {
            return this.provider === providerEnum.google ? false : true;
        }
    },
    profileImage: { type: String },
    coverImages: [String],
    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    role: { type: String, enum: roleEnum, default: roleEnum.user },
    provider: { type: String, enum: providerEnum, default: providerEnum.system },
    changeCredentialsTime: Date,
    phone: String,
    address: String,
    confirmEmail: Date,
    resetPasswordOtp: String,
    confirmEmailOtp: String,
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema.virtual('username').set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName });
}).get(function () {
    return this.firstName + " " + this.lastName;
});
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)('User', userSchema);
