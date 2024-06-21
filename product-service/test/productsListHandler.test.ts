
import { DynamoDbService} from "../lib/src/dynamodb-service";
import { corsHeaders } from "../lib/src/support/constants";
import handler from "../lib/src/handlers/productsListHandler"; // Assuming the file is named handler.js


jest.mock('../lib/src/product-service');

describe('productsListHandler unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a 200 response with the list of products', async () => {
    const mockProducts = [
      { id: '1', name: 'Test Product 1' },
      { id: '2', name: 'Test Product 2' },
    ];
    (DynamoDbService as jest.MockedClass<typeof DynamoDbService>).prototype.getProducts.mockReturnValue(mockProducts);

    const response = await handler();

    expect(response.statusCode).toBe(200);
    expect(response.headers).toEqual(corsHeaders);
    expect(JSON.parse(response.body)).toEqual(mockProducts);
    expect(DynamoDbService.prototype.getProducts).toHaveBeenCalled();
  });
});
