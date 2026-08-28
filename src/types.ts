export type PaymentStatus = "완료" | "예약금" | "미입금" | "확인필요";
export type MatchStatus = "자동매칭" | "수동매칭" | "확인필요" | "미매칭";
export interface Freight {
  id: string;
  date: string;
  customer: string;
  depositor: string;
  cargo: string;
  pickup: string;
  delivery: string;
  vehicle: string;
  driver: string;
  driverPhone: string;
  driverAccount: string;
  sales: number;
  purchase: number;
  deposit: number;
  note: string;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  driverPaid: boolean;
}
export interface Transaction {
  id: string;
  date: string;
  time: string;
  depositor: string;
  amount: number;
  freightId?: string;
  status: MatchStatus;
}
export interface Closing {
  date: string;
  closed: boolean;
  balance?: number;
}
