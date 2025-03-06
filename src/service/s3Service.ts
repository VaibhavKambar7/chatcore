import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as dotenv from "dotenv";
dotenv.config();

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const createSignedURL = async (objectKey: string) => {
  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME!,
    Key: objectKey,
  });
  const url = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 60 });
  return url;
};

export const getFileFromS3 = async (objectKey: string) => {
  try {
    console.log("Attempting to fetch from S3, objectKey:", objectKey);
    const params = {
      Bucket: process.env.BUCKET_NAME!,
      Key: objectKey,
    };
    const getObjectCommand = new GetObjectCommand(params);
    const fileObject = await s3Client.send(getObjectCommand);
    return fileObject?.Body?.transformToByteArray();
  } catch (error) {
    console.error("Error fetching file from S3:", error);
    throw error;
  }
};
