import { DynamoDbService } from "./../lib/src/dynamodb-service";
import { corsHeaders } from "./../lib/src/support/constants";
import Ajv from "ajv";
import productSchema from "./../lib/src/support/schemas/productSchema.json";
import { SNSClient } from "@aws-sdk/client-sns";
import handler from "./../lib/src/handlers/catalogBatchProcessHandler";

jest.mock("@aws-sdk/client-sns", () => {
  const SNSClientMock = {
    send: jest.fn(),
  };
  return {
    SNSClient: jest.fn(() => SNSClientMock),
    PublishCommand: jest.fn(),
  };
});

jest.mock("./../lib/src/dynamodb-service", () => {
  return {
    DynamoDbService: jest.fn().mockImplementation(() => {
      return {
        createProduct: jest.fn(),
      };
    }),
  };
});

jest.mock("ajv", () => {
  const AjvMock = jest.fn().mockImplementation(() => {
    return {
      compile: jest.fn().mockImplementation(() => jest.fn()),
      errorsText: jest.fn().mockReturnValue("Mocked error text"),
    };
  });
  return AjvMock;
});

jest.mock("@aws-sdk/credential-provider-node", () => {
  return {
    fromIni: jest.fn().mockReturnValue({
      accessKeyId: "mockAccessKeyId",
      secretAccessKey: "mockSecretAccessKey",
    }),
  };
});

describe("Lambda Handler", () => {
  let dynamoDbServiceMock: any;
  let snsClientMock: any;
  let validateMock: any;

  beforeEach(() => {
    dynamoDbServiceMock = new DynamoDbService("table 1", "table 2");
    snsClientMock = new SNSClient();
    validateMock = new Ajv().compile(productSchema);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create product successfully", async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            id: "1",
            title: "Candy",
            price: "2.5",
            count: "10",
          }),
        },
      ],
    };

    validateMock.mockReturnValue(true);
    dynamoDbServiceMock.createProduct.mockResolvedValue({
      id: "1",
      title: "Candy",
      price: 2.5,
      count: 10,
    });

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        id: "1",
        title: "Candy",
        price: 2.5,
        count: 10,
      }),
    });
    expect(snsClientMock.send).toHaveBeenCalled();
  });

  it("should return 200 for invalid product data", async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            id: "1",
            title: "Candy",
            price: "invalid",
            count: "10",
          }),
        },
      ],
    };

    validateMock.mockReturnValue(false);

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 200,
      body: "Products created successfully",
    });
    expect(snsClientMock.send).not.toHaveBeenCalled();
  });

  it("should return 500 for error during product creation", async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            id: "1",
            title: "Candy",
            price: "2.5",
            count: "10",
          }),
        },
      ],
    };

    validateMock.mockReturnValue(true);
    dynamoDbServiceMock.createProduct.mockRejectedValue(
      new Error("DynamoDB error")
    );

    const result = await handler(event);

    expect(result).toEqual({
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Error creating a product" }),
    });
    expect(snsClientMock.send).not.toHaveBeenCalled();
  });
});
