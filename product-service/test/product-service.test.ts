import { DynamoDbService} from './../lib/src/dynamodb-service';

describe('ProductService', () => {
  let dynamoDbService: DynamoDbService;

  beforeEach(() => {
    dynamoDbService = new DynamoDbService('products', 'stocks');
  });

  describe('Product service unit tests', () => {
    it('should return the list of products', () => {
      const products = dynamoDbService.getProducts();
      expect(products).toHaveLength(3);
      expect(products).toEqual([
        { id: 1, title: 'Candy 1', description: 'This is product 1', price: 9.99 },
        { id: 2, title: 'Candy 2', description: 'This is product 2', price: 14.99 },
        { id: 3, title: 'Candy 3', description: 'This is product 3', price: 19.99 },
      ]);
    });
  });

  describe('getProductById function', () => {
    it('should return the product with the given id', () => {
      const product = dynamoDbService.getProductById('2');
      expect(product).toEqual({ id: 2, title: 'Candy 2', description: 'This is product 2', price: 14.99 });
    });

    it('should return undefined if the product is not found', () => {
      const product = dynamoDbService.getProductById('4');
      expect(product).toBeUndefined();
    });
  });
});
