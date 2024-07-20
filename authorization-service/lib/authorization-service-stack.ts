import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as dotenv from "dotenv";


dotenv.config();

export class AuthorizationServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const basicAuthorizer = new lambda.Function(this, 'BasicAuthorizerLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handlers/basicAuthorizerHandler.handler",
      code: lambda.Code.fromAsset("dist", {
        exclude: ["*.d.ts"],
      }),
      environment: {
        'USERNAME': process.env.USERNAME as string,
        'PASSWORD': process.env.PASSWORD as string,
      },
    });

    const api = new apigateway.RestApi(this, 'AuthorizationApi', {
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.CUSTOM,
        authorizer: new apigateway.TokenAuthorizer(this, 'BasicAuthorizer', {
          handler: basicAuthorizer,
          identitySource: 'method.request.header.Authorization',
        }),
      },
    });

    basicAuthorizer.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));
    
    const resource = api.root.addResource('auth');
    resource.addMethod('GET');

    new CfnOutput(this, 'BasicAuthorizerArn', {
      description: 'Basic Authorizer Lambda',
      value: basicAuthorizer.functionArn,
      exportName: 'BasicAuthorizerArn'
    })
  }
}
