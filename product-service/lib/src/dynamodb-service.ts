import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  GetCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { unmarshall, marshall } from "@aws-sdk/util-dynamodb";
import { Product, Stock, PostProductsBody } from "./support/interfaces";
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

  public async getProducts() {
    try {
      const productsResult = await this.dynamodbClient.send(
        new ScanCommand({
          TableName: this.productsTable,
        })
      );
      const products = productsResult.Items || [];
      const unmarshaledProducts = products.map((item) => unmarshall(item));

      const stocksResult = await this.dynamodbClient.send(
        new ScanCommand({
          TableName: this.stocksTable,
        })
      );
      const stocks = stocksResult.Items || [];
      const unmarshaledStocks = stocks.map((item) => unmarshall(item));

      const productsList = unmarshaledProducts.map((product) => {
        const stock = unmarshaledStocks.find(
          (s) => s.product_id === product.id
        );
        return {
          ...product,
          count: stock?.count || 0,
        };
      });

      return productsList;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error("Error fetching products");
    }
  }

  public async getProductById(productId: string): Promise<Product | null> {
    try {
      const productResult = await this.dynamodbClient.send(
        new GetCommand({
          TableName: this.productsTable,
          Key: {
            id: productId.toString(),
          },
        })
      );

      if (!productResult.Item) {
        return null;
      }

      const product = productResult.Item as Product;

      const stockResult = await this.dynamodbClient.send(
        new GetCommand({
          TableName: this.stocksTable,
          Key: {
            product_id: productId,
          },
        })
      );

      const stock = stockResult.Item ? (stockResult.Item as Stock) : null;

      return {
        ...product,
        count: stock?.count || 0,
      };
    } catch (error) {
      console.error("Error fetching product:", error);
      throw new Error("Error fetching product");
    }
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
