import type { APIGatewayAuthorizerResult, StatementEffect } from "aws-lambda";
import { corsHeaders } from "./constants";

const scheme = "Basic ";
const delimiter = ":";

export const generatePolicy = (
  username: string,
  methodArn: string,
  effect: StatementEffect
): APIGatewayAuthorizerResult => {
  return {
    principalId: username,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: methodArn,
        },
      ],
    },
  };
};

export const decodeToken = (
  token: string
): { username: string; password: string } => {
  if (token.startsWith(scheme)) {
    token = token.replace(scheme, "");
  }
  const [username, password] = Buffer.from(token, "base64")
    .toString()
    .split(delimiter);
  return { username, password };
};
