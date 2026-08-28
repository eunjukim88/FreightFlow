import { useState } from "react";
import { Search, Link2 } from "lucide-react";
import { Amount, Badge, Empty, Modal, PageTitle } from "./components";
import {
  automaticMatch,
  importTransactions,
  money,
  resetStore,
  summary,
  type Store,
} from "./lib";
import { Card } from "./pages";
import type { Freight, Transaction } from "./types";

const today = "2026-08-28";

export function DepositsPage({
  store,
  update,
}: {
  store: Store;
  update: (store: Store) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Transaction>();
  const transactions = store.transactions;
  const count = (status: string) =>
    transactions.filter((t) => t.status === status).length;
  const load = () => {
    setLoading(true);
    setTimeout(() => {
      update(importTransactions(store));
      setLoading(false);
    }, 700);
  };
  const connect = (freight: Freight) => {
    if (!selected) return;
    const left = freight.sales - freight.paidAmount;
    const amount = selected.amount;
    const freights = store.freights.map((f) =>
      f.id === freight.id
        ? {
            ...f,
            paidAmount: f.paidAmount + amount,
            paymentStatus: amount >= left ? "완료" : f.paymentStatus,
          }
        : f,
    );
    update({
      ...store,
      freights,
      transactions: store.transactions.map((t) =>
        t.id === selected.id
          ? { ...t, freightId: freight.id, status: "수동매칭" as const }
          : t,
      ),
    });
    setSelected(undefined);
  };
  return (
    <div className="content">
      <PageTitle
        title="입금확인"
        action={
          <button className="button" disabled={loading} onClick={load}>
            {loading
              ? "은행 입금내역을 확인하고 있습니다..."
              : "오늘 입금내역 가져오기"}
          </button>
        }
      />
      <div className="grid four">
        <Card label="전체 입금" value={`${transactions.length}건`} />
        <Card label="자동매칭" value={`${count("자동매칭")}건`} />
        <Card label="확인필요" value={`${count("확인필요")}건`} />
        <Card label="미매칭" value={`${count("미매칭")}건`} />
      </div>
      <section className="panel">
        <div className="section-head">
          <h2>오늘 입금내역</h2>
          {transactions.length > 0 && (
            <button
              className="text-button"
              onClick={() => update(automaticMatch(store))}
            >
              자동매칭 다시 실행
            </button>
          )}
        </div>
        {!transactions.length ? (
          <Empty text="가져온 입금내역이 없습니다." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>시간</th>
                  <th>실제 입금자</th>
                  <th className="right">입금금액</th>
                  <th>연결된 화물</th>
                  <th>매칭상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const f = store.freights.find(
                    (item) => item.id === t.freightId,
                  );
                  return (
                    <tr key={t.id}>
                      <td>{t.time}</td>
                      <td>
                        <b>{t.depositor}</b>
                      </td>
                      <td className="right">
                        <Amount value={t.amount} />
                      </td>
                      <td>{f ? `${f.customer} · ${f.cargo}` : "-"}</td>
                      <td>
                        <Badge status={t.status} />
                      </td>
                      <td>
                        {(t.status === "미매칭" || t.status === "확인필요") && (
                          <button
                            className="text-button"
                            onClick={() => setSelected(t)}
                          >
                            <Link2 size={15} /> 화물 연결
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {selected && (
        <MatchModal
          transaction={selected}
          freights={store.freights}
          onConnect={connect}
          onClose={() => setSelected(undefined)}
        />
      )}
    </div>
  );
}
function MatchModal({
  transaction,
  freights,
  onConnect,
  onClose,
}: {
  transaction: Transaction;
  freights: Freight[];
  onConnect: (freight: Freight) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState("");
  const rows = freights.filter((f) =>
    (f.customer + f.depositor).includes(query),
  );
  return (
    <Modal title="미매칭 입금 연결" onClose={onClose}>
      <div className="deposit-callout">
        <b>{transaction.depositor}</b>
        <strong>{money(transaction.amount)}</strong>
        <span>{transaction.time}</span>
      </div>
      <div className="search">
        <Search size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="고객명 / 입금자명 검색"
        />
      </div>
      <div className="choice-list">
        {rows.slice(0, 6).map((f) => (
          <label key={f.id}>
            <input
              type="radio"
              checked={picked === f.id}
              onChange={() => setPicked(f.id)}
            />
            <span>
              <b>
                {f.customer} · {f.depositor}
              </b>
              <small>
                {f.cargo} / 잔금 {money(f.sales - f.paidAmount)}
              </small>
            </span>
          </label>
        ))}
      </div>
      <button
        className="button full"
        disabled={!picked}
        onClick={() => {
          const found = freights.find((f) => f.id === picked);
          if (found) onConnect(found);
        }}
      >
        선택한 화물에 연결
      </button>
    </Modal>
  );
}
export function ClosingPage({
  store,
  update,
}: {
  store: Store;
  update: (store: Store) => void;
}) {
  const freights = store.freights.filter((f) => f.date === today);
  const totals = summary(freights);
  const closing = store.closings.find((c) => c.date === today);
  const [balance, setBalance] = useState(closing?.balance ?? 0);
  const pending = freights.filter((f) => !f.driverPaid && f.driver);
  const expected =
    totals.paid - pending.reduce((sum, f) => sum + f.purchase, 0);
  const close = () =>
    update({
      ...store,
      closings: [
        ...store.closings.filter((c) => c.date !== today),
        { date: today, closed: !closing?.closed, balance },
      ],
    });
  const pay = (id: string) =>
    update({
      ...store,
      freights: store.freights.map((f) =>
        f.id === id ? { ...f, driverPaid: true } : f,
      ),
    });
  return (
    <div className="content">
      <PageTitle title="일 마감" />
      <div className="grid three">
        <Card label="오늘 매출" value={money(totals.sales)} />
        <Card label="오늘 매입" value={money(totals.purchase)} />
        <Card label="예상수익" value={money(totals.sales - totals.purchase)} />
        <Card label="입금완료금액" value={money(totals.paid)} />
        <Card label="미입금금액" value={money(totals.sales - totals.paid)} />
        <Card
          label="기사 지급예정"
          value={money(pending.reduce((s, f) => s + f.purchase, 0))}
        />
      </div>
      <section className="panel">
        <h2>기사 지급현황</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>기사명</th>
                <th>계좌</th>
                <th className="right">지급예정</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {freights
                .filter((f) => f.driver)
                .map((f) => (
                  <tr key={f.id}>
                    <td>{f.driver}</td>
                    <td>{f.driverAccount}</td>
                    <td className="right">
                      <Amount value={f.purchase} />
                    </td>
                    <td>
                      {f.driverPaid ? (
                        <Badge status="완료" />
                      ) : (
                        <button
                          className="text-button"
                          onClick={() => pay(f.id)}
                        >
                          지급완료 처리
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel balance">
        <h2>통장 잔액 대사</h2>
        <div className="balance-row">
          <span>
            ERP 예상잔액 <b>{money(expected)}</b>
          </span>
          <label>
            현재 통장잔액
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
            />
          </label>
          <span>
            차이{" "}
            <b className={balance === expected ? "good" : "warn"}>
              {money(balance - expected)}
            </b>
          </span>
        </div>
        <p className={balance === expected ? "good" : "warn"}>
          {balance === expected
            ? "✓ 마감금액이 일치합니다."
            : "⚠ 입금 미매칭 또는 지급내역을 확인해주세요."}
        </p>
        <button
          className={`button ${closing?.closed ? "secondary" : ""}`}
          onClick={close}
        >
          {closing?.closed ? "마감 해제" : "오늘 마감하기"}
        </button>
      </section>
    </div>
  );
}
export function SettingsPage({
  store,
  update,
}: {
  store: Store;
  update: (store: Store) => void;
}) {
  const [testing, setTesting] = useState(false);
  const [reset, setReset] = useState(false);
  return (
    <div className="content narrow">
      <PageTitle title="설정" />
      <section className="panel info">
        <h2>입금계좌</h2>
        <p>
          <span>은행</span>
          <b>기업은행</b>
        </p>
        <p>
          <span>계좌명</span>
          <b>개인화물 입금계좌</b>
        </p>
        <p>
          <span>계좌번호</span>
          <b>123-****-****</b>
        </p>
        <p>
          <span>연동상태</span>
          <Badge status="자동매칭" />
        </p>
        <button
          className="button"
          disabled={testing}
          onClick={() => {
            setTesting(true);
            setTimeout(() => setTesting(false), 900);
          }}
        >
          {testing ? "계좌를 확인하고 있습니다..." : "계좌 연결 테스트"}
        </button>
      </section>
      <section className="panel danger-zone">
        <h2>데모 데이터</h2>
        <p>등록·수정한 모든 데모 데이터를 최초 상태로 되돌립니다.</p>
        <button className="button danger" onClick={() => setReset(true)}>
          데모 데이터 초기화
        </button>
      </section>
      {reset && (
        <Modal
          title="데모 데이터를 초기화할까요?"
          onClose={() => setReset(false)}
        >
          <p>현재 저장된 모든 데모 데이터가 삭제됩니다.</p>
          <button
            className="button danger"
            onClick={() => {
              update(resetStore());
              setReset(false);
            }}
          >
            초기화하기
          </button>
        </Modal>
      )}
    </div>
  );
}
