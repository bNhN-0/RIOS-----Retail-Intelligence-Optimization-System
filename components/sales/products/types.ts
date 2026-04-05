export type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  revenue: number;
  cost: number;
  units: number;
  transactions: number;
  stock: number;
  reorderLevel: number;
  demandScore: number;
  inventoryScore: number;
  averagePrice: number;
  trend: number[];
  rank: number;
  contribution: string;
};
