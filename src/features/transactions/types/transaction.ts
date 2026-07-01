export type TransactionType = "BUY" | "SELL";

export interface Transaction {
  id: string;
  symbol: string;
  type: TransactionType;
  quantity: number;
  pricePerUnit: number;
  amount: number;
  date: string;
  broker: string;
  brokerage: number;
  stt: number;
  stampDuty: number;
  sebiCharges: number;
  gst: number;
  otherCharges: number;
  notes?: string;
}
