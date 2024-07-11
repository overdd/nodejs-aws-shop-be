import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { Product } from "./support/interfaces";
import { randomUUID } from "crypto";

export class DynamoDbService {
  private productsTable: string;
  private stocksTable: string;
  private dynamodbClient: DynamoDBClient;

  constructor(productsTableName: string, stocksTableName: string) {
    this.productsTable = productsTableName;
    this.stocksTable = stocksTableName;
    this.dynamodbClient = new DynamoDBClient({
      region: process.env.DYNAMODB_AWS_REGION,
    });
  }

  public async createProduct(
    postProductsBody: any
  ): Promise<Product | null> {
    try {
      const newProduct = {
        id: randomUUID(),
        title: postProductsBody.title,
        description: postProductsBody.description,
        price: postProductsBody.price,
      };

      const newStock = {
        product_id: newProduct.id,
        count: postProductsBody.count,
      };

      const transactWriteItems = {
        TransactItems: [
          {
            Put: {
              TableName: this.productsTable,
              Item: newProduct,
            },
          },
          {
            Put: {
              TableName: this.stocksTable,
              Item: newStock,
            },
          },
        ],
      };

      await this.dynamodbClient.send(
        new TransactWriteCommand(transactWriteItems)
      );

      return {
        ...newProduct,
        count: newStock.count,
      };
    } catch (error) {
      console.error("Error creating a product:", error);
      throw new Error("Error creating a product");
    }
  }
}
