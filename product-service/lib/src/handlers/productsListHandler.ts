import { DynamoDbService } from "../dynamodb-service";
import { corsHeaders } from "../support/constants";

const dynamoDbService = new DynamoDbService(
  process.env.DYNAMO_TABLE_PRODUCTS || "products",
  process.env.DYNAMO_TABLE_STOCKS || "stocks"
);

exports.handler = async (event: object) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  try {
    const products = await dynamoDbService.getProducts();
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(products),
    };
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
