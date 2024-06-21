import { DynamoDbService } from "../dynamodb-service";
import { corsHeaders } from "../support/constants";

const dynamoDbService = new DynamoDbService(
  process.env.DYNAMO_TABLE_PRODUCTS || "products",
  process.env.DYNAMO_TABLE_STOCKS || "stocks"
);

exports.handler = async (event: { pathParameters: { productId: string } }) => {
  const { productId } = event.pathParameters;
  const product = await dynamoDbService.getProductById(productId);

  if (product) {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(product),
    };
  } else {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Product not found" }),
    };
  }
};

export default exports.handler;
