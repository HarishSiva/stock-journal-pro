export type OrderSide = "BUY" | "SELL";

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  broker: string;
  trade_date: string;
  investmentThesis?: string;
  notes?: string;
}