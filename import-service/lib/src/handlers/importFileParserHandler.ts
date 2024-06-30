import { S3Event, S3EventRecord, S3Handler } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import csv from "csv-parser";
import { Readable } from "stream";

const s3Client = new S3Client({});

export const handler: S3Handler = async (event: S3Event) => {
  console.log("Received S3 event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    await processRecord(record);
  }
};

async function processRecord(record: S3EventRecord) {
  const { bucket, object } = record.s3;
  const { name: bucketName, arn: bucketArn } = bucket;
  const { key } = object;

  console.log(`Processing object: ${key} from bucket: ${bucketName}`);

  const getObjectCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client.send(getObjectCommand);
  const readableStream = response.Body as Readable;

  return new Promise<void>((resolve, reject) => {
    readableStream
      .pipe(csv())
      .on("data", (data: any) => {
        console.log("Parsed record:", data);
      })
      .on("error", (err: any) => {
        console.error("Error parsing CSV:", err);
        reject(err);
      })
      .on("end", async () => {
        console.log("Finished processing object:", key);

        const timestamp = new Date().toISOString();
        const newKey = `parsed/${timestamp}-${key.split("/").pop()}`;

        const copyObjectCommand = new CopyObjectCommand({
          Bucket: bucketName,
          CopySource: `${bucketName}/${key}`,
          Key: newKey,
        });
        await s3Client.send(copyObjectCommand);

        const deleteObjectCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        await s3Client.send(deleteObjectCommand);

        console.log(`Moved object from ${key} to ${newKey}`);

        resolve();
      });
  });
}

export default exports.handler;
