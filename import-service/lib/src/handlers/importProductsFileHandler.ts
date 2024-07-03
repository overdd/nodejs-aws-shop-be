import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { corsHeaders } from "../support/constants";

const s3Client = new S3Client({});


exports.handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const fileName = event.queryStringParameters?.name;
  if (!fileName) {
    return {
      statusCode: 400,
      body: 'Missing "name" query parameter',
    };
  }

  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME!,
    Key: `uploaded/${fileName}`,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL valid for 1 hour

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ presignedUrl }),
  };
};

export default exports.handler;
