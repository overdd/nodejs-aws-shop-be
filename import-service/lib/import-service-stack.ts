import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { CANDY_STORE_BUCKET } from "./src/support/constants";
import * as dotenv from "dotenv";

dotenv.config();

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketName(
      this,
      CANDY_STORE_BUCKET.BUCKET_NAME,
      CANDY_STORE_BUCKET.BUCKET_NAME
    );

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

    const importProductsFile = new lambda.Function(this, "ImportProductsFile", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/importProductsFileHandler.handler",
      code: lambda.Code.fromAsset("dist", {
        exclude: ["*.d.ts"],
      }),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    const importFileParser = new lambda.Function(this, "ImportFileParser", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/importFileParserHandler.handler",
      code: lambda.Code.fromAsset("dist", {
        exclude: ["*.d.ts"],
      }),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    const catalogBatchProcess = new lambda.Function(
      this,
      "CatalogBatchProcess",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "handlers/catalogBatchProcessHandler.handler",
        code: lambda.Code.fromAsset("dist", {
          exclude: ["*.d.ts"],
        }),
        environment: {
          DYNAMO_TABLE_PRODUCTS:
            process.env.DYNAMO_TABLE_PRODUCTS || "products",
          DYNAMO_TABLE_STOCKS: process.env.DYNAMO_TABLE_STOCKS || "stocks",
        },
      }
    );

    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "catalogItemsQueue",
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    importFileParser.addEventSource(
      new lambdaEventSources.S3EventSource(bucket as s3.Bucket, {
        events: [s3.EventType.OBJECT_CREATED],
        filters: [{ prefix: "uploaded/" }],
      })
    );

    bucket.grantReadWrite(importProductsFile);
    bucket.grantReadWrite(importFileParser);
    bucket.grantDelete(importFileParser);

    const api = new apigateway.RestApi(this, "ImportServiceApi", {
      restApiName: "Import Service API",
      description: "API for the Import Service",
    });

    const importResource = api.root.addResource("import");
    const importMethod = importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFile),
      {
        requestParameters: {
          "method.request.querystring.name": true,
        },
      }
    );

    catalogBatchProcess.addEventSource(
      new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
      })
    );

    productsTable.grantReadWriteData(catalogBatchProcess);
    stocksTable.grantReadWriteData(catalogBatchProcess);
  }
}
