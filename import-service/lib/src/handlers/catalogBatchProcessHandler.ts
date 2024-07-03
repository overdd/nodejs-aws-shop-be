import { SQSEvent } from "aws-lambda";
import { DynamoDbService } from "../dynamodb-service";
import { corsHeaders } from "../support/constants";
import Ajv from "ajv";
import productSchema from "./../support/schemas/productSchema.json";

const ajv = new Ajv();
const validate = ajv.compile(productSchema);

const dynamoDbService = new DynamoDbService(
  process.env.DYNAMO_TABLE_PRODUCTS || "products",
  process.env.DYNAMO_TABLE_STOCKS || "stocks"
);

exports.handler = async (event: SQSEvent) => {
  console.log("Received SQS event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const parsedBody = JSON.parse(record.body);
    parsedBody.price = Number(parsedBody.price);
    parsedBody.count = Number(parsedBody.count);

    try {
      const isValid = validate(parsedBody);
      if (!isValid) {
        console.error(
          `Invalid product data: ${ajv.errorsText(validate.errors)}`
        );
        continue;
      }
      const product = await dynamoDbService.createProduct(parsedBody);
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(product),
      };
    } catch (error) {
      console.error("Error creating a product:", error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Error creating a product" }),
      };
    }
  }

  return { statusCode: 200, body: "Products created successfully" };
};
