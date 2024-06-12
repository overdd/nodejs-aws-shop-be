import { ProductService } from "./product-service";

const productService = new ProductService();

exports.handler = async (event: { pathParameters: { productId: any } }) => {
  const { productId } = event.pathParameters;
  const product = productService.getProductById(productId);

  if (product) {
    return {
      statusCode: 200,
      body: JSON.stringify(product),
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: "Product not found" }),
    };
  }
};
