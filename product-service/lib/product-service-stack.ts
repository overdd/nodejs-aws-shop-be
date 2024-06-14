import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsList = new lambda.Function(this, "getProductsList", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/productsListHandler.handler",
      code: lambda.Code.fromAsset("dist", {
        exclude: ["*.d.ts"],
      }),
    });

    const getProductsById = new lambda.Function(this, "getProductsById", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/productByIdHandler.handler",
      code: lambda.Code.fromAsset("dist", {
        exclude: ["*.d.ts"],
      }),
    });

    // Create the API Gateway integration
    const api = new apigateway.RestApi(this, "ProductsApi", {
      restApiName: "Products Service",
      description: "This is the Products Service API.",
    });

    const productsResource = api.root.addResource("products");
    const productResource = productsResource.addResource("{productId}");
    productsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsList)
    );
    productResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getProductsById)
    );    
  }
}
