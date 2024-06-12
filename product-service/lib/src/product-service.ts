export class ProductService {
    private products: any[] = [
      { id: 1, name: 'Product 1', description: 'This is product 1', price: 9.99 },
      { id: 2, name: 'Product 2', description: 'This is product 2', price: 14.99 },
      { id: 3, name: 'Product 3', description: 'This is product 3', price: 19.99 },
    ];
  
    public getProducts() {
      return this.products;
    }

    public getProductById(id: string) {
      return this.products.find(p => p.id === parseInt(id));
    }
  }
  