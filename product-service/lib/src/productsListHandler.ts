import { ProductService } from "./product-service";

const productService = new ProductService();

exports.handler = async () => {
  const products = productService.getProducts();
  return {
    statusCode: 200,
    body: JSON.stringify(products)
  };
};