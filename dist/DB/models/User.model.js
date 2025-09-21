"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.providerEnum = exports.roleEnum = exports.GenderEnum = void 0;
const mongoose_1 = require("mongoose");
const hash_security_1 = require("../../utils/security/hash.security");
const email_event_1 = require("../../utils/events/email.event");
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
    tempProfileImage: String,
    gender: { type: String, enum: GenderEnum, default: GenderEnum.male },
    role: { type: String, enum: roleEnum, default: roleEnum.user },
    provider: { type: String, enum: providerEnum, default: providerEnum.system },
    freezedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    freezedAt: Date,
    changeCredentialsTime: Date,
    phone: String,
    address: String,
    confirmEmail: Date,
    resetPasswordOtp: String,
    confirmEmailOtp: String,
    twoFA_Activated: { type: Boolean, default: false },
    twoFA_Otp: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strictQuery: true
});
userSchema.virtual('username').set(function (value) {
    const [firstName, lastName] = value.split(" ") || [];
    this.set({ firstName, lastName });
}).get(function () {
    return this.firstName + " " + this.lastName;
});
userSchema.pre("save", async function (next) {
    this.wasNew = this.isNew;
    if (this.isModified("password")) {
        this.password = await (0, hash_security_1.generateHash)(this.password);
    }
    if (this.isModified("confirmEmailOtp")) {
        this.confirmEmailPlainOtp = this.confirmEmailOtp;
        this.confirmEmailOtp = await (0, hash_security_1.generateHash)(this.confirmEmailOtp);
    }
    next();
});
userSchema.post("save", async function (doc, next) {
    const that = this;
    if (that.wasNew && that.confirmEmailPlainOtp) {
        email_event_1.emailEvent.emit("confirmEmail", { to: this.email, otp: that.confirmEmailPlainOtp });
    }
    next();
});
userSchema.pre(["find", 'findOne'], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
exports.UserModel = mongoose_1.models.User || (0, mongoose_1.model)('User', userSchema);
