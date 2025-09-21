"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFolderByPrefix = exports.listDirectoryFiles = exports.deleteFiles = exports.deleteFile = exports.getFile = exports.createGetPreSignedUploadLink = exports.createPreSignedUploadLink = exports.uploadFiles = exports.uploadFile = exports.s3Config = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const uuid_1 = require("uuid");
const multer_cloud_1 = require("./multer.cloud");
const node_fs_1 = require("node:fs");
const error_response_1 = require("../response/error.response");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3Config = () => {
    return new client_s3_1.S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });
};
exports.s3Config = s3Config;
const uploadFile = async ({ storageApproach = multer_cloud_1.StorageEnum.memory, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", path = "general", file, useLarge = false }) => {
    if (useLarge) {
        const upload = new lib_storage_1.Upload({
            client: (0, exports.s3Config)(),
            params: {
                Bucket,
                ACL,
                Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}_${file.originalname}`,
                Body: storageApproach === multer_cloud_1.StorageEnum.memory ? file.buffer : (0, node_fs_1.createReadStream)(file.path),
                ContentType: file.mimetype
            },
        });
        upload.on("httpUploadProgress", (progress) => {
            console.log(`Upload file progress is ::: ${progress}`);
        });
        const { Key } = await upload.done();
        if (!Key) {
            throw new error_response_1.BadRequestException(`failed to generate key`);
        }
        return Key;
    }
    else {
        const command = new client_s3_1.PutObjectCommand({
            Bucket,
            ACL,
            Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}_${file.originalname}`,
            Body: storageApproach === multer_cloud_1.StorageEnum.memory ? file.buffer : (0, node_fs_1.createReadStream)(file.path),
            ContentType: file.mimetype
        });
        await (0, exports.s3Config)().send(command);
        if (!command.input.Key) {
            throw new error_response_1.BadRequestException(`Fail to generate Upload Key`);
        }
        return command.input.Key;
    }
};
exports.uploadFile = uploadFile;
const uploadFiles = async ({ storageApproach = multer_cloud_1.StorageEnum.memory, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", path = "general", files, useLarge = false }) => {
    let urls = [];
    if (useLarge) {
        urls = await Promise.all(files.map(file => {
            return (0, exports.uploadFile)({
                file,
                path,
                ACL,
                Bucket,
                storageApproach,
                useLarge: true
            });
        }));
        return urls;
    }
    else {
        urls = await Promise.all(files.map(file => {
            return (0, exports.uploadFile)({
                file,
                path,
                ACL,
                Bucket,
                storageApproach
            });
        }));
        return urls;
    }
};
exports.uploadFiles = uploadFiles;
const createPreSignedUploadLink = async ({ Bucket = process.env.AWS_BUCKET_NAME, path = "general", ContentType, OriginalName, expiresIn = Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS) }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}_${OriginalName}`,
        ContentType
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3Config)(), command, { expiresIn });
    if (!url || !command.input.Key) {
        throw new error_response_1.BadRequestException('failed to create preSigned Url');
    }
    return { url, key: command.input.Key };
};
exports.createPreSignedUploadLink = createPreSignedUploadLink;
const createGetPreSignedUploadLink = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key, expiresIn = Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS), downloadName = "dummy", download = "false" }) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket,
        Key,
        ResponseContentDisposition: download === "true" ? `attachment; filename="${downloadName || Key.split("/").pop()}"` : undefined
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3Config)(), command, { expiresIn });
    if (!url) {
        throw new error_response_1.BadRequestException('failed to create preSigned Url');
    }
    return url;
};
exports.createGetPreSignedUploadLink = createGetPreSignedUploadLink;
const getFile = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key }) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket,
        Key: Key
    });
    return await (0, exports.s3Config)().send(command);
};
exports.getFile = getFile;
const deleteFile = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key, }) => {
    const command = new client_s3_1.DeleteObjectCommand({
        Bucket,
        Key
    });
    return await (0, exports.s3Config)().send(command);
};
exports.deleteFile = deleteFile;
const deleteFiles = async ({ Bucket = process.env.AWS_BUCKET_NAME, urls, Quiet = false }) => {
    const Objects = urls.map(url => {
        return { Key: url };
    });
    const command = new client_s3_1.DeleteObjectsCommand({
        Bucket,
        Delete: {
            Objects,
            Quiet
        }
    });
    return (0, exports.s3Config)().send(command);
};
exports.deleteFiles = deleteFiles;
const listDirectoryFiles = async ({ Bucket = process.env.AWS_BUCKET_NAME, path }) => {
    const command = new client_s3_1.ListObjectsV2Command({
        Bucket,
        Prefix: `${process.env.APPLICATION_NAME}/${path}`
    });
    return (0, exports.s3Config)().send(command);
};
exports.listDirectoryFiles = listDirectoryFiles;
const deleteFolderByPrefix = async ({ Bucket = process.env.AWS_BUCKET_NAME, path, Quiet = false }) => {
    const fileList = await (0, exports.listDirectoryFiles)({ Bucket, path });
    if (fileList?.Contents?.length) {
        throw new error_response_1.BadRequestException(`empty directory`);
    }
    const urls = fileList.Contents?.map(file => {
        return file.Key;
    });
    return await (0, exports.deleteFiles)({ urls, Bucket, Quiet });
};
exports.deleteFolderByPrefix = deleteFolderByPrefix;
