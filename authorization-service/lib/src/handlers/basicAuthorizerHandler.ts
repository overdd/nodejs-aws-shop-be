import type {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
} from "aws-lambda";
import * as dotenv from "dotenv";
import { decodeToken, generatePolicy } from "../support/helper";

dotenv.config();

exports.handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  console.log("Received auth event: ", JSON.stringify(event, null, 2));

  let credentials: Record<string, string> = {
    USERNAME: process.env.USERNAME || "",
    PASSWORD: process.env.PASSWORD || "",
  };
  const authorizationToken = event.authorizationToken;
  

  try {
    if (!authorizationToken) {
      console.log("No auth header or header is not valid");
      return generatePolicy(credentials.USERNAME, event.methodArn, "Deny");
    }
    console.log(`authorizationToken =`, authorizationToken);

    const decodedCredentials = decodeToken(authorizationToken);
    console.log(`decodedCredentials =`, decodedCredentials);
    if (
      decodedCredentials.username !== credentials.USERNAME &&
      decodedCredentials.password !== credentials.USERNAME
    ) {
      console.log("Username or password doesn't match");
      return generatePolicy(credentials.USERNAME, event.methodArn, "Deny");
    }
  } catch (error) {
    console.log(error);
  }
  return generatePolicy(credentials.USERNAME, event.methodArn, "Allow");
};
