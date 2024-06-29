export interface Product {
  id: string;
  title: string;
  description: string;
  price?: number;
  count?: number;
}

export interface Stock {
  product_id: string;
  count: number;
}

export interface PostProductsBody {
  title: string;
  description: string;
  price: number;
  count: number;
}