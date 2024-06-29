import { DynamoDbService } from "../dynamodb-service";
import { corsHeaders } from "../support/constants";
import { PostProductsBody } from "../support/interfaces";

const dynamoDbService = new DynamoDbService(
  process.env.DYNAMO_TABLE_PRODUCTS || "products",
  process.env.DYNAMO_TABLE_STOCKS || "stocks"
);

exports.handler = async (event: any) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  try {
    const product = await dynamoDbService.createProduct(JSON.parse(event.body));
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify(product),
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
