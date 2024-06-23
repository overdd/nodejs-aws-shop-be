import { DynamoDbService } from "../dynamodb-service";
import { corsHeaders } from "../support/constants";

const dynamoDbService = new DynamoDbService(
  process.env.DYNAMO_TABLE_PRODUCTS || "products",
  process.env.DYNAMO_TABLE_STOCKS || "stocks"
);

exports.handler = async (event: { pathParameters: { productId: string } }) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  try {
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
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Error fetching product" }),
    };
  }
};

export default exports.handler;
