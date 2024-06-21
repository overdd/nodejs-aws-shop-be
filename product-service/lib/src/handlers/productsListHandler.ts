import { DynamoDbService } from "../dynamodb-service";
import { corsHeaders } from "../support/constants";

const dynamoDbService = new DynamoDbService(
  process.env.DYNAMO_TABLE_PRODUCTS || "products",
  process.env.DYNAMO_TABLE_STOCKS || "stocks"
);

exports.handler = async (event: object) => {
  const products = await dynamoDbService.getProducts();
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(products),
  };
};

export default exports.handler;
