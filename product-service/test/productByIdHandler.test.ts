
import { DynamoDbService } from "../lib/src/dynamodb-service";
import { corsHeaders } from "../lib/src/support/constants";
import handler from "../lib/src/handlers/productByIdHandler"; // Assuming the file is named handler.js


jest.mock('./../lib/src/product-service');

describe('productByIdHandler unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a 200 response with the product when it is found', async () => {
    const mockProduct = { id: '1', name: 'Test Product' };
    (DynamoDbService as jest.MockedClass<typeof DynamoDbService>).prototype.getProductById.mockReturnValue(mockProduct);

    const event = {
      pathParameters: {
        productId: '1',
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual(corsHeaders);
    expect(JSON.parse(response.body)).toEqual(mockProduct);
    expect(DynamoDbService.prototype.getProductById).toHaveBeenCalledWith('1');
  });

  it('should return a 404 response when the product is not found', async () => {
    (DynamoDbService as jest.MockedClass<typeof DynamoDbService>).prototype.getProductById.mockReturnValue(null);

    const event = {
      pathParameters: {
        productId: '1',
      },
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(404);
    expect(response.headers).toEqual(corsHeaders);
    expect(JSON.parse(response.body)).toEqual({ message: 'Product not found' });
    expect(DynamoDbService.prototype.getProductById).toHaveBeenCalledWith('1');
  });
});
