import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import handler from "../lib/src/handlers/importProductsFileHandler";
import { APIGatewayProxyEventHeaders, PRESIGNED_URL } from "./test-helpers/testConstants";

jest.mock("@aws-sdk/s3-request-presigner");

describe("importProductsFileHandler", () => {
  const s3Mock = mockClient(S3Client);

  beforeEach(() => {
    s3Mock.reset();
  });

  test("should generate a presigned URL for file upload", async () => {
    const mockGetSignedUrl = jest.mocked(getSignedUrl);
    mockGetSignedUrl.mockResolvedValue(PRESIGNED_URL);

    const event: APIGatewayProxyEvent = {
      queryStringParameters: {
        name: "test-file.csv",
      },
      ...APIGatewayProxyEventHeaders,
    };
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      presignedUrl: PRESIGNED_URL,
    });
    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.any(PutObjectCommand),
      { expiresIn: 3600 }
    );
  });

  test('should return 400 if "name" query parameter is missing', async () => {
    const event: APIGatewayProxyEvent = {
      queryStringParameters: {},
      ...APIGatewayProxyEventHeaders,
    };
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    expect(result.body).toBe('Missing "name" query parameter');
  });
});
