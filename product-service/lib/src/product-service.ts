export class ProductService {
    private products: any[] = [
      { id: 1, title: 'Candy 1', description: 'This is product 1', price: 9.99 },
      { id: 2, title: 'Candy 2', description: 'This is product 2', price: 14.99 },
      { id: 3, title: 'Candy 3', description: 'This is product 3', price: 19.99 },
    ];
  
    public getProducts() {
      return this.products;
    }

    public getProductById(id: string) {
      return this.products.find(p => p.id === parseInt(id));
    }
  }
  