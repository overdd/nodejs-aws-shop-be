import { S3Event, S3EventRecord, S3Handler } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { CSV_HEADER } from "../support/constants";

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});
const queueUrl = process.env.CATALOG_ITEMS_QUEUE_URL;

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
  const fileData = await response.Body?.transformToString();

  if (!fileData) {
    console.error("Error getting file data");
    return;
  }

  const csvLines = fileData.split("\n");

  for (const line of csvLines) {
    if (line.trim() !== "" && line.trim() !== CSV_HEADER) {
      const parts = line.split(",");
      const parsedObject = {
        title: parts[0],
        description: parts[1],
        price: parseFloat(parts[2]),
        count: parseInt(parts[3], 10),
      };
      const sendMessageCommand = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(parsedObject),
      });
      console.log(
        `Sending messages to SQS: ${JSON.stringify(sendMessageCommand)}`
      );
      const result = await sqsClient.send(sendMessageCommand);
      console.log(`Result: ${JSON.stringify(result)}`);
    }
  }

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
}

export default exports.handler;
