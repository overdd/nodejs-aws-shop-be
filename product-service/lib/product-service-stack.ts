import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as dotenv from "dotenv";
import { createProductSchema } from "../lib/src/support/schemas";

dotenv.config();

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = dynamodb.Table.fromTableName(
      this,
      "ProductsTable",
      process.env.DYNAMO_TABLE_PRODUCTS || "products"
    );
    const stocksTable = dynamodb.Table.fromTableName(
      this,
      "StocksTable",
      process.env.DYNAMO_TABLE_STOCKS || "stocks"
    );

    const getProductsList = new lambda.Function(this, "getProductsList", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/productsListHandler.handler",
      code: lambda.Code.fromAsset("dist", {
        exclude: ["*.d.ts"],
      }),
      environment: {
        DYNAMO_TABLE_PRODUCTS: process.env.DYNAMO_TABLE_PRODUCTS || "products",
        DYNAMO_TABLE_STOCKS: process.env.DYNAMO_TABLE_STOCKS || "stocks",
      },
    });

    const getProductsById = new lambda.Function(this, "getProductsById", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/productByIdHandler.handler",
      code: lambda.Code.fromAsset("dist", {
        exclude: ["*.d.ts"],
      }),
      environment: {
        DYNAMO_TABLE_PRODUCTS: process.env.DYNAMO_TABLE_PRODUCTS || "products",
        DYNAMO_TABLE_STOCKS: process.env.DYNAMO_TABLE_STOCKS || "stocks",
      },
    });

    const createProduct = new lambda.Function(this, "createProduct", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/createProductHandler.handler",
      code: lambda.Code.fromAsset("dist", {
        exclude: ["*.d.ts"],
      }),
      environment: {
        DYNAMO_TABLE_PRODUCTS: process.env.DYNAMO_TABLE_PRODUCTS || "products",
        DYNAMO_TABLE_STOCKS: process.env.DYNAMO_TABLE_STOCKS || "stocks",
      },
    });

    const api = new apigateway.RestApi(this, "ProductsApi", {
      restApiName: "Products Service",
      description: "This is the Products Service API.",
    });

    productsTable.grantReadWriteData(getProductsList);
    productsTable.grantReadWriteData(getProductsById);
    productsTable.grantReadWriteData(createProduct);
    stocksTable.grantReadWriteData(getProductsList);
    stocksTable.grantReadWriteData(getProductsById);
    stocksTable.grantReadWriteData(createProduct);

    const productsResource = api.root.addResource("products");
    const productResource = productsResource.addResource("{productId}");
    productsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsList)
    );
    productsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createProduct),
      {
        requestValidator: new apigateway.RequestValidator(
          this,
          "CreateProductRequestValidator",
          {
            restApi: productsResource.api,
            validateRequestBody: true,
            validateRequestParameters: false,
          }
        ),
        requestModels: {
          "application/json": new apigateway.Model(this, "CreateProductModel", {
            restApi: productsResource.api,
            schema: createProductSchema,
          }),
        },
      }
    );
    productResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsById)
    );
  }
}
