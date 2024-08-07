import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { CANDY_STORE_BUCKET, responseHeaders } from "./src/support/constants";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
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

    const catalogItemsQueue = new sqs.Queue(this, "CatalogItemsQueue", {
      queueName: "catalogItemsQueue",
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    const importFileParser = new lambda.Function(this, "ImportFileParser", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/importFileParserHandler.handler",
      code: lambda.Code.fromAsset("dist", {
        exclude: ["*.d.ts"],
      }),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        CATALOG_ITEMS_QUEUE_URL: catalogItemsQueue.queueUrl,
      },
    });

    const authorizerARN = cdk.Fn.importValue('BasicAuthorizerArn')
    const authorizerFunction = lambda.Function.fromFunctionArn(this, 'ImportAuthorizer', authorizerARN)

    const authorizer = new apigateway.TokenAuthorizer(this, 'APIGatewayBasicAuthorizer', {
      handler: authorizerFunction,
      identitySource: apigateway.IdentitySource.header('Authorization')
    });

    const createProductTopic = new sns.Topic(this, "createProductTopic", {
      topicName: "createProductTopic",
      displayName: "Product creation notification topic",
    });
    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription(
        process.env.CLIENT_EMAIL || "test@gmail.com"
      )
    );

    createProductTopic.addSubscription(
      new subscriptions.EmailSubscription(
        process.env.CLIENT_EMAIL_FILTERED || "test2@gmail.com",
        {
          filterPolicy: {
            price: sns.SubscriptionFilter.numericFilter({
              greaterThan: 5,
            }),
          },
        }
      )
    );

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
          CREATE_PRODUCT_TOPIC_ARN: createProductTopic.topicArn,
        },
      }
    );

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
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS, 
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowCredentials: true
      }
    });

    api.addGatewayResponse("GatewayResponseUnauthorized", {
      type: cdk.aws_apigateway.ResponseType.UNAUTHORIZED,
      responseHeaders,
      statusCode:"401"
    });

    api.addGatewayResponse("GatewayResponseAccessDenied", {
      type: cdk.aws_apigateway.ResponseType.ACCESS_DENIED,
      responseHeaders,
      statusCode:"403"
    });

    const importResource = api.root.addResource("import");
    const importMethod = importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFile),
      {
        authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
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

    const sqsSendMessagePolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["sqs:SendMessage"],
      resources: [`${catalogItemsQueue.queueArn}`],
    });

    const importFileParserSQSPolicy = new iam.Policy(
      this,
      "ImportFileParserSQSPolicy",
      {
        statements: [sqsSendMessagePolicyStatement],
      }
    );

    productsTable.grantReadWriteData(catalogBatchProcess);
    stocksTable.grantReadWriteData(catalogBatchProcess);

    importFileParser.role?.attachInlinePolicy(importFileParserSQSPolicy);

    const snsPublishPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["sns:Publish"],
      resources: ["*"],
    });

    const catalogBatchProcessSNSPolicy = new iam.Policy(
      this,
      "CatalogBatchProcessSNSPolicy",
      {
        statements: [snsPublishPolicyStatement],
      }
    );
    catalogBatchProcess.role?.attachInlinePolicy(catalogBatchProcessSNSPolicy);
  }
}
