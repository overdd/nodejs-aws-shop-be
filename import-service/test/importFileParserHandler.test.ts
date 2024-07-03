import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import handler from "./../lib/src/handlers/importFileParserHandler";
import MockReadableStream from "./test-helpers/mockableStream";
import { fakeCsv } from "./test-helpers/testConstants";

jest.mock("@aws-sdk/client-s3");

describe("importFileParser", () => {
  const s3Mock = mockClient(S3Client);

  beforeEach(() => {
    s3Mock.reset();
  });

  test("should parse CSV file and move it to parsed folder", async () => {
    s3Mock.on(GetObjectCommand).resolves({
      Body: new MockReadableStream(fakeCsv),
    });
    s3Mock.on(CopyObjectCommand).resolves({});
    s3Mock.on(DeleteObjectCommand).resolves({});

    await handler({
      Records: [
        {
          s3: {
            bucket: {
              name: "my-bucket",
              arn: "arn:aws:s3:::my-bucket",
            },
            object: {
              key: "uploaded/product-data.csv",
            },
          },
        },
      ],
    });

    expect(s3Mock.commandCalls(GetObjectCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(CopyObjectCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
  });
});
