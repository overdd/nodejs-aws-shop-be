import { DynamoDbService } from "../dynamodb-service";
import { corsHeaders } from "../support/constants";

const productService = new DynamoDbService(
  process.env.DYNAMO_TABLE_PRODUCTS || "products",
  process.env.DYNAMO_TABLE_STOCKS || "stocks"
);

exports.handler = async (event: object) => {
  const products = await productService.getProducts();
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(products),
  };
};

export default exports.handler;
