export interface Product {
  id: string;
  name: string;
  description: string;
  price?: number;
  count?: number;
}

export interface Stock {
  product_id: string;
  count: number;
}
