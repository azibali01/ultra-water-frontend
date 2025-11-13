export type PurchaseLineItem = {
  id: string;
  productId: string;
  productName: string;
  code?: string;
  percent?: number;
  quantity: number;
  rate: number;
  grossAmount: number;
  discountAmount?: number;
  netAmount: number;
  length?: string | number;
  amount?: number;
};

export type PurchaseLineItems = PurchaseLineItem[];
