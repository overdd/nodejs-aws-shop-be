import * as apigateway from "aws-cdk-lib/aws-apigateway";

export const createProductSchema = {
  type: apigateway.JsonSchemaType.OBJECT,
  properties: {
    title: { type: apigateway.JsonSchemaType.STRING },
    description: { type: apigateway.JsonSchemaType.STRING },
    price: { type: apigateway.JsonSchemaType.NUMBER, minimum: 0 },
    count: {
      type: apigateway.JsonSchemaType.NUMBER,
      minimum: 0,
    },
  },
  required: ["title", "description", "price", "count"],
};
