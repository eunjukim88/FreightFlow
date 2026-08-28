import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Link2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Amount, Badge, Empty, Modal, PageTitle } from "./components";
import {
  automaticMatch,
  importTransactions,
  money,
  payment,
  resetStore,
  summary,
  type Store,
} from "./lib";
import type { Freight, PaymentStatus, Transaction } from "./types";

const today = "2026-08-28";
export const Card = ({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
}) => (
  <Link className="card" to={href ?? "#"}>
    <span>{label}</span>
    <strong>{value}</strong>
    {detail && <small>{detail}</small>}
  </Link>
);
const profit = (freight: Freight) => freight.sales - freight.purchase;
export function FreightTable({ rows }: { rows: Freight[] }) {
  if (!rows.length)
    return <Empty text="오늘 등록된 화물이 없습니다." href="/freight/new" />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>입금상태</th>
            <th>고객 / 입금자</th>
            <th>화물내용</th>
            <th>운송구간</th>
            <th>기사</th>
            <th className="right">매출</th>
            <th className="right">수익</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id} onClick={() => (location.href = `/freight/${f.id}`)}>
              <td>
                <Badge status={payment(f)} />
              </td>
              <td>
                <b>{f.customer}</b>
                <small>{f.depositor}</small>
              </td>
              <td>{f.cargo}</td>
              <td>
                {f.pickup} → {f.delivery}
              </td>
              <td>{f.driver || <span className="muted">미배정</span>}</td>
              <td className="right">
                <Amount value={f.sales} />
              </td>
              <td className="right">
                <Amount value={profit(f)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function FreightPage({ store }: { store: Store }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체");
  const [selectedDate, setSelectedDate] = useState(today);
  const rows = useMemo(
    () =>
      store.freights.filter(
        (f) =>
          f.date === selectedDate &&
          `${f.customer}${f.depositor}${f.cargo}`.includes(query) &&
          (filter === "전체" || payment(f) === filter),
      ),
    [store, query, filter, selectedDate],
  );
  const previousDate = "2026-08-27";
  return (
    <div className="content">
      <PageTitle
        title="배차관리"
        action={
          <Link className="button" to="/freight/new">
            <Plus size={16} /> 화물 등록
          </Link>
        }
      />
      <div className="toolbar">
        <div className="date-controls">
          <button
            className={
              selectedDate === previousDate
                ? "date-shortcut active"
                : "date-shortcut"
            }
            onClick={() => setSelectedDate(previousDate)}
          >
            전일
          </button>
          <button
            className={
              selectedDate === today ? "date-shortcut active" : "date-shortcut"
            }
            onClick={() => setSelectedDate(today)}
          >
            당일
          </button>
          <label className="date-picker">
            <CalendarDays size={16} />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              aria-label="배차일 선택"
            />
          </label>
        </div>
        <div className="search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="고객명, 입금자명 검색"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>전체</option>
          <option>완료</option>
          <option>예약금</option>
          <option>미입금</option>
          <option>확인필요</option>
        </select>
      </div>
      <section className="panel">
        <div className="section-head">
          <h2>
            배차 목록 <small>{rows.length}건</small>
          </h2>
        </div>
        <FreightTable rows={rows} />
      </section>
    </div>
  );
}
export function FreightForm({
  store,
  update,
}: {
  store: Store;
  update: (store: Store) => void;
}) {
  const nav = useNavigate();
  const { id } = useParams();
  const existing = store.freights.find((f) => f.id === id);
  const [form, setForm] = useState<Freight>(
    existing ?? {
      id: "",
      date: today,
      customer: "",
      depositor: "",
      cargo: "",
      pickup: "",
      delivery: "",
      vehicle: "1톤 카고",
      driver: "",
      driverPhone: "",
      driverAccount: "",
      sales: 0,
      purchase: 0,
      deposit: 0,
      note: "",
      paymentStatus: "미입금",
      paidAmount: 0,
      driverPaid: false,
    },
  );
  const set = (key: keyof Freight, value: string | number) =>
    setForm({ ...form, [key]: value });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = { ...form, id: form.id || `f${Date.now()}` };
    update({
      ...store,
      freights: existing
        ? store.freights.map((f) => (f.id === item.id ? item : f))
        : [item, ...store.freights],
    });
    nav(`/freight/${item.id}`);
  };
  const fields: [keyof Freight, string, string][] = [
    ["customer", "고객 / 닉네임", "text"],
    ["depositor", "입금자명", "text"],
    ["cargo", "화물내용", "text"],
    ["pickup", "상차지", "text"],
    ["delivery", "하차지", "text"],
    ["vehicle", "톤수 / 차종", "text"],
    ["driver", "기사명", "text"],
    ["driverPhone", "기사 전화번호", "text"],
    ["driverAccount", "기사 계좌번호", "text"],
    ["sales", "매출금액", "number"],
    ["purchase", "매입금액", "number"],
    ["deposit", "예약금 예정금액", "number"],
  ];
  return (
    <div className="content narrow">
      <PageTitle title={existing ? "화물 수정" : "화물 등록"} />
      <form className="panel form" onSubmit={submit}>
        <h2>배차 및 고객 정보</h2>
        <p className="form-note">
          입금자명은 실제 통장에 표시되는 이름을 입력해주세요.
        </p>
        <div className="form-grid">
          {fields.map(([key, label, type]) => (
            <label key={key}>
              {label}
              <input
                required={["customer", "depositor", "cargo"].includes(key)}
                type={type}
                value={form[key] as string | number}
                onChange={(e) =>
                  set(
                    key,
                    type === "number" ? Number(e.target.value) : e.target.value,
                  )
                }
              />
            </label>
          ))}
        </div>
        <label>
          요청사항
          <textarea
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
          />
        </label>
        <div className="calculation">
          예상 수익 <b>{money(form.sales - form.purchase)}</b> · 잔금 예정{" "}
          <b>{money(form.sales - form.deposit)}</b>
        </div>
        <div className="actions">
          <button
            type="button"
            className="button secondary"
            onClick={() => nav(-1)}
          >
            취소
          </button>
          <button className="button">저장</button>
        </div>
      </form>
    </div>
  );
}
export function FreightDetail({
  store,
  update,
}: {
  store: Store;
  update: (store: Store) => void;
}) {
  const nav = useNavigate();
  const { id } = useParams();
  const freight = store.freights.find((f) => f.id === id);
  const [confirm, setConfirm] = useState(false);
  if (!freight) return <Navigate to="/freight" />;
  const tx = store.transactions.filter((t) => t.freightId === id);
  const remove = () => {
    update({ ...store, freights: store.freights.filter((f) => f.id !== id) });
    nav("/freight");
  };
  return (
    <div className="content narrow">
      <PageTitle
        title={`${freight.customer} / ${freight.pickup} → ${freight.delivery}`}
        action={
          <div className="actions">
            <Link className="button secondary" to={`/freight/${id}/edit`}>
              수정
            </Link>
            <button className="button danger" onClick={() => setConfirm(true)}>
              삭제
            </button>
          </div>
        }
      />
      <div className="detail-grid">
        <Info
          title="운송정보"
          rows={[
            ["화물내용", freight.cargo],
            ["운송일", freight.date],
            ["운송구간", `${freight.pickup} → ${freight.delivery}`],
            ["차종", freight.vehicle],
            ["요청사항", freight.note],
          ]}
        />
        <Info
          title="고객정보"
          rows={[
            ["고객", freight.customer],
            ["입금자명", freight.depositor],
          ]}
        />
        <Info
          title="기사정보"
          rows={[
            ["기사", freight.driver || "미배정"],
            ["연락처", freight.driverPhone],
            ["계좌", freight.driverAccount],
          ]}
        />
        <Info
          title="금액 및 입금"
          rows={[
            ["매출", money(freight.sales)],
            ["매입", money(freight.purchase)],
            ["수익", money(profit(freight))],
            ["현재 입금", money(freight.paidAmount)],
          ]}
        />
      </div>
      {tx.length > 0 && (
        <section className="panel">
          <h2>연결된 실제 입금</h2>
          {tx.map((t) => (
            <p key={t.id}>
              {t.time} · {t.depositor} · <Amount value={t.amount} />{" "}
              <Badge status={t.status} />
            </p>
          ))}
        </section>
      )}
      {confirm && (
        <Modal title="화물정보를 삭제할까요?" onClose={() => setConfirm(false)}>
          <p>삭제한 화물정보는 복구할 수 없습니다.</p>
          <button className="button danger" onClick={remove}>
            삭제하기
          </button>
        </Modal>
      )}
    </div>
  );
}
function Info({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="panel info">
      <h2>{title}</h2>
      {rows.map(([a, b]) => (
        <p key={a}>
          <span>{a}</span>
          <b>{b}</b>
        </p>
      ))}
    </section>
  );
}
