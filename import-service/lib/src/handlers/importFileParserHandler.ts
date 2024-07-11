import { S3Event, S3EventRecord, S3Handler } from "aws-lambda";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import csv from "csv-parser";
import { Readable } from "stream";

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});
const queueUrl = process.env.CATALOG_ITEMS_QUEUE_URL;

export const handler: S3Handler = async (event: S3Event) => {
  console.log("Received S3 event:", JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      await processRecord(record);
    }
  } catch (error) {
    console.error("Error processing records:", error);
  }
};

async function processRecord(record: S3EventRecord) {
  const { bucket, object } = record.s3;
  const { name: bucketName, arn: bucketArn } = bucket;
  const encodedKey = object.key;
  const key = decodeURIComponent(encodedKey);
  const parsingResults = [];

  console.log(`Processing object: ${key} from bucket: ${bucketName}`);

  const getObjectCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client.send(getObjectCommand);
  const readableStream = response.Body as Readable;
  const parser = readableStream.pipe(csv());

  for await (const item of parser) {
    parsingResults.push(item);
  }

  const messages = parsingResults.map((product, index) => {
    if (!product || typeof product.price === "undefined") {
      throw new Error(`Invalid product data at index ${index}`);
    }

    return {
      Id: `Message${index}`,
      MessageBody: JSON.stringify(product),
      MessageAttributes: {
        price: {
          DataType: "Number",
          StringValue: String(product.price),
        },
      },
    };
  });

  const result = await sqsClient.send(
    new SendMessageBatchCommand({
      QueueUrl: queueUrl,
      Entries: messages,
    })
  );
  console.log(`SQS sending result: ${JSON.stringify(result)}`);

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
