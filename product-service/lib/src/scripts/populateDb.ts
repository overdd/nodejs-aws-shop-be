import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from "dotenv";

dotenv.config();

const AWS_REGION = process.env.AWS_REGION || "us-east-1"
const DYNAMO_DB_TABLES_NAMES = {
  products: process.env.DYNAMO_TABLE_PRODUCTS || "products",
  stocks: process.env.DYNAMO_TABLE_STOCKS || "stocks",
};

const dynamoDbC = new AWS.DynamoDB({
  region: AWS_REGION,
});
const documentClient = new AWS.DynamoDB.DocumentClient({
  region: AWS_REGION,
});

function getRandomPrice(min: number, max: number) {
    const random = Math.random() * (max - min) + min;
    return parseFloat(random.toFixed(2));
  }
  
  function getRandomStock(min: number, max: number) {
    const random = Math.random() * (max - min) + min;
    return Math.round(random);
  }

const productData = [
  {
    id: uuidv4(),
    title: "Candy 1",
    description: "This is product 1",
    price: getRandomPrice(0.01, 99.99),
  },
  {
    id: uuidv4(),
    title: "Candy 2",
    description: "This is product 2",
    price: getRandomPrice(0.01, 99.99),
  },
  {
    id: uuidv4(),
    title: "Candy 3",
    description: "This is product 3",
    price: getRandomPrice(0.01, 99.99),
  },
];

const stockData = [
  {
    product_id: productData[0].id,
    count: getRandomStock(1, 99),
  },
  {
    product_id: productData[1].id,
    count: getRandomStock(1, 99),
  },
  {
    product_id: productData[2].id,
    count: getRandomStock(1, 99),
  },
];

async function populateProducts() {
  const tableExists = await checkTableExists(DYNAMO_DB_TABLES_NAMES.products);
  if (tableExists) {
    const productCount = await getTableItemCount(
        DYNAMO_DB_TABLES_NAMES.products
    );
    if (productCount === 0) {
      for (const product of productData) {
        await documentClient
          .put({
            TableName: DYNAMO_DB_TABLES_NAMES.products,
            Item: product,
          })
          .promise();
      }
      console.log(`${process.env.DYNAMO_TABLE_PRODUCTS} populated successfully!`);
    } else {
      console.log(
        `${process.env.DYNAMO_TABLE_PRODUCTS} table is not empty, skipping population.`
      );
    }
  } else {
    console.log(
      `${process.env.DYNAMO_TABLE_PRODUCTS} table does not exist, skipping population.`
    );
  }
}

async function populateStocks() {
  const tableExists = await checkTableExists(DYNAMO_DB_TABLES_NAMES.stocks);
  if (tableExists) {
    const stockCount = await getTableItemCount(DYNAMO_DB_TABLES_NAMES.stocks);
    if (stockCount === 0) {
      for (const stock of stockData) {
        await documentClient
          .put({
            TableName: DYNAMO_DB_TABLES_NAMES.stocks,
            Item: stock,
          })
          .promise();
      }
      console.log(`${DYNAMO_DB_TABLES_NAMES.stocks} populated successfully!`);
    } else {
      console.log(
        `${DYNAMO_DB_TABLES_NAMES.stocks} table is not empty, skipping population.`
      );
    }
  } else {
    console.log(
      `${DYNAMO_DB_TABLES_NAMES.stocks} table does not exist, skipping population.`
    );
  }
}

async function checkTableExists(tableName: string) {
  try {
    await dynamoDbC.describeTable({ TableName: tableName }).promise();
    return true;
  } catch (error: any) {
    if (error.code === "ResourceNotFoundException") {
      return false;
    } else {
      throw error;
    }
  }
}

async function getTableItemCount(tableName: string) {
  const result = await documentClient
    .scan({
      TableName: tableName,
      Select: "COUNT",
    })
    .promise();
  return result.Count;
}

async function main() {
    try {
      await populateProducts();
      await populateStocks();
    } catch (error) {
      console.error('Error in main function:', error);
    }
  }
  
  main();

