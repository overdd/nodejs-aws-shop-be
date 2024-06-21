import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { Product, Stock } from "./support/interfaces";

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
      console.log(productId)
      console.log(typeof productId)
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

      const stock = stockResult.Item
        ? (stockResult.Item as Stock)
        : null;

      return {
        ...product,
        count: stock?.count || 0,
      };
    } catch (error) {
      console.error("Error fetching product:", error);
      throw new Error("Error fetching product");
    }
  }
}
