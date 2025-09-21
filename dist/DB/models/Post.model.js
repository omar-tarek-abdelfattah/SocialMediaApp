"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = exports.AvailabilityEnum = exports.AllowCommentsEnum = exports.LikeActionEnum = void 0;
const mongoose_1 = require("mongoose");
var LikeActionEnum;
(function (LikeActionEnum) {
    LikeActionEnum["like"] = "like";
    LikeActionEnum["unlike"] = "unlike";
})(LikeActionEnum || (exports.LikeActionEnum = LikeActionEnum = {}));
var AllowCommentsEnum;
(function (AllowCommentsEnum) {
    AllowCommentsEnum["allow"] = "allow";
    AllowCommentsEnum["deny"] = "deny";
})(AllowCommentsEnum || (exports.AllowCommentsEnum = AllowCommentsEnum = {}));
var AvailabilityEnum;
(function (AvailabilityEnum) {
    AvailabilityEnum["public"] = "public";
    AvailabilityEnum["friends"] = "friends";
    AvailabilityEnum["onlyMe"] = "only-me";
})(AvailabilityEnum || (exports.AvailabilityEnum = AvailabilityEnum = {}));
const postSchema = new mongoose_1.Schema({
    content: {
        type: String, minLength: 2, maxLength: 500000, required: function () {
            return !this.attachments?.length;
        }
    },
    attachments: [String],
    accessFolderId: { type: String, required: true },
    allowComment: { type: String, enum: AllowCommentsEnum, default: AllowCommentsEnum.allow },
    availability: { type: String, enum: AvailabilityEnum, default: AvailabilityEnum.public },
    tags: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    freezedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    freezedAt: Date,
    restoredBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    restoredAt: Date,
}, {
    timestamps: true,
    strictQuery: true
});
postSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
    const query = this.getQuery();
    if (query.paranoid === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
    next();
});
exports.PostModel = mongoose_1.models.Post || (0, mongoose_1.model)("Post", postSchema);
