import type { Closing, Freight, PaymentStatus, Transaction } from "./types";

const KEY = "freight-erp-prototype-v1";
export interface Store {
  freights: Freight[];
  transactions: Transaction[];
  closings: Closing[];
}
const today = "2026-08-28";
const names = [
  "제일물류",
  "성진상사",
  "한빛유통",
  "동아건설",
  "대성식품",
  "미래로지스",
  "그린마트",
  "태양산업",
];
const people = [
  "정재일",
  "김하늘",
  "이민수",
  "박서연",
  "최영호",
  "홍길동",
  "오유진",
  "장동혁",
];
const routes = [
  ["의왕", "평택"],
  ["안산", "인천"],
  ["화성", "서울"],
  ["시흥", "용인"],
  ["군포", "천안"],
];
export const money = (value: number) => `${value.toLocaleString("ko-KR")}원`;
export const getStore = (): Store => {
  const saved = localStorage.getItem(KEY);
  if (saved) return JSON.parse(saved) as Store;
  const seed = seedStore();
  saveStore(seed);
  return seed;
};
export const saveStore = (store: Store) =>
  localStorage.setItem(KEY, JSON.stringify(store));
export const resetStore = () => {
  const seed = seedStore();
  saveStore(seed);
  return seed;
};
export const payment = (freight: Freight): PaymentStatus => {
  if (freight.paidAmount >= freight.sales) return "완료";
  if (freight.paidAmount > 0) return "예약금";
  return freight.paymentStatus;
};
export const summary = (freights: Freight[]) =>
  freights.reduce(
    (total, item) => ({
      sales: total.sales + item.sales,
      purchase: total.purchase + item.purchase,
      paid: total.paid + item.paidAmount,
    }),
    { sales: 0, purchase: 0, paid: 0 },
  );
export function automaticMatch(store: Store): Store {
  const freights = store.freights.map((freight) => ({ ...freight }));
  const transactions: Transaction[] = store.transactions.map((transaction) => {
    if (transaction.status !== "미매칭") return transaction;
    const exact = freights.find(
      (f) =>
        !f.driverPaid &&
        f.depositor === transaction.depositor &&
        f.sales - f.paidAmount === transaction.amount,
    );
    const sameName = freights.find(
      (f) =>
        f.depositor === transaction.depositor &&
        f.sales - f.paidAmount !== transaction.amount,
    );
    if (exact) {
      exact.paidAmount += transaction.amount;
      return {
        ...transaction,
        freightId: exact.id,
        status: "자동매칭" as const,
      };
    }
    if (sameName) return { ...transaction, status: "확인필요" as const };
    return transaction;
  });
  return { ...store, freights, transactions };
}
export function importTransactions(store: Store): Store {
  if (store.transactions.some((transaction) => transaction.date === today))
    return automaticMatch(store);
  const transactions: Transaction[] = [
    {
      id: "t1",
      date: today,
      time: "09:12",
      depositor: "정재일",
      amount: 110000,
      status: "미매칭",
    },
    {
      id: "t2",
      date: today,
      time: "09:45",
      depositor: "김하늘",
      amount: 80000,
      status: "미매칭",
    },
    {
      id: "t3",
      date: today,
      time: "10:32",
      depositor: "홍길동",
      amount: 150000,
      status: "미매칭",
    },
    {
      id: "t4",
      date: today,
      time: "11:05",
      depositor: "박서연",
      amount: 100000,
      status: "미매칭",
    },
    {
      id: "t5",
      date: today,
      time: "13:18",
      depositor: "최영호",
      amount: 120000,
      status: "미매칭",
    },
    {
      id: "t6",
      date: today,
      time: "14:22",
      depositor: "미확인입금",
      amount: 70000,
      status: "미매칭",
    },
  ];
  return automaticMatch({ ...store, transactions });
}
function seedStore(): Store {
  const freights = Array.from({ length: 18 }, (_, index): Freight => {
    const sales = 120000 + (index % 5) * 30000;
    const deposit = index % 3 === 1 ? 30000 : 0;
    const paid = index < 5 ? sales : deposit;
    const route = routes[index % routes.length];
    return {
      id: `f${index + 1}`,
      date: index < 12 ? today : "2026-08-27",
      customer: names[index % names.length],
      depositor: people[index % people.length],
      cargo: ["생활용품", "철강 자재", "식자재", "가구", "포장재"][index % 5],
      pickup: route[0],
      delivery: route[1],
      vehicle: index % 4 === 0 ? "5톤 윙바디" : "1톤 카고",
      driver:
        index % 7 === 0 ? "" : `기사 ${people[(index + 2) % people.length]}`,
      driverPhone: "010-1234-5678",
      driverAccount: "기업 123-456-7890",
      sales,
      purchase: sales - 30000 - (index % 3) * 5000,
      deposit,
      note: "안전 운송 요청",
      paymentStatus: index === 6 ? "확인필요" : "미입금",
      paidAmount: paid,
      driverPaid: index < 3,
    };
  });
  return { freights, transactions: [], closings: [] };
}
