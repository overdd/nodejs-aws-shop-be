import { ProductService } from './../lib/src/product-service';

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
  });

  describe('Product service unit tests', () => {
    it('should return the list of products', () => {
      const products = productService.getProducts();
      expect(products).toHaveLength(3);
      expect(products).toEqual([
        { id: 1, name: 'Product 1', description: 'This is product 1', price: 9.99 },
        { id: 2, name: 'Product 2', description: 'This is product 2', price: 14.99 },
        { id: 3, name: 'Product 3', description: 'This is product 3', price: 19.99 },
      ]);
    });
  });

  describe('getProductById function', () => {
    it('should return the product with the given id', () => {
      const product = productService.getProductById('2');
      expect(product).toEqual({ id: 2, name: 'Product 2', description: 'This is product 2', price: 14.99 });
    });

    it('should return undefined if the product is not found', () => {
      const product = productService.getProductById('4');
      expect(product).toBeUndefined();
    });
  });
});
