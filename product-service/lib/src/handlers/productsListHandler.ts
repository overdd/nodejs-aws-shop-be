import { ProductService } from "../product-service";
import { corsHeaders } from "../support/constants";

const productService = new ProductService();

exports.handler = async () => {
  const products = productService.getProducts();
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(products)
  };
};

export default exports.handler;