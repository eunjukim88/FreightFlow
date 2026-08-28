import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Amount, Badge, Empty, PageTitle } from "./components";
import { money, summary, type Store } from "./lib";

const defaultStart = "2026-08-22";
const defaultEnd = "2026-08-28";

export function HistoryPage({ store }: { store: Store }) {
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const dates = useMemo(
    () => buildDates(startDate, endDate),
    [startDate, endDate],
  );
  const rows = dates.map((date) => {
    const freights = store.freights.filter((freight) => freight.date === date);
    const totals = summary(freights);
    return {
      date,
      count: freights.length,
      ...totals,
      profit: totals.sales - totals.purchase,
    };
  });
  const totals = summary(
    store.freights.filter(
      (freight) => freight.date >= startDate && freight.date <= endDate,
    ),
  );
  const highestSales = Math.max(...rows.map((row) => row.sales), 1);

  return (
    <div className="content">
      <PageTitle title="업무이력 조회" />
      <section className="panel history-filter">
        <div>
          <h2>조회 기간</h2>
          <p>기간별 매출, 매입, 수익과 일 마감 상태를 확인합니다.</p>
        </div>
        <div className="history-dates">
          <label>
            <CalendarDays size={16} />
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <span>~</span>
          <label>
            <CalendarDays size={16} />
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
        </div>
      </section>
      <div className="grid three">
        <SummaryCard label="기간 매출" value={totals.sales} />
        <SummaryCard label="기간 매입" value={totals.purchase} />
        <SummaryCard label="기간 수익" value={totals.sales - totals.purchase} />
      </div>
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>일별 매출 추이</h2>
            <p>막대 높이는 일별 매출을 기준으로 표시됩니다.</p>
          </div>
        </div>
        {rows.length === 0 ? (
          <Empty text="조회할 기간을 선택해주세요." />
        ) : (
          <div className="sales-chart">
            {rows.map((row) => (
              <div className="chart-item" key={row.date}>
                <span>{money(row.sales)}</span>
                <div className="chart-track">
                  <div
                    className="chart-bar"
                    style={{
                      height: `${Math.max((row.sales / highestSales) * 100, row.sales ? 7 : 0)}%`,
                    }}
                  />
                </div>
                <small>{row.date.slice(5).replace("-", ".")}</small>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="panel">
        <h2>일별 업무·마감 이력</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>배차</th>
                <th className="right">매출</th>
                <th className="right">매입</th>
                <th className="right">수익</th>
                <th>마감 상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const closing = store.closings.find(
                  (item) => item.date === row.date,
                );
                return (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td>{row.count}건</td>
                    <td className="right">
                      <Amount value={row.sales} />
                    </td>
                    <td className="right">
                      <Amount value={row.purchase} />
                    </td>
                    <td className="right">
                      <Amount value={row.profit} />
                    </td>
                    <td>
                      <Badge status={closing?.closed ? "마감완료" : "진행중"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card static-card">
      <span>{label}</span>
      <strong>{money(value)}</strong>
      <small>선택 기간 합계</small>
    </div>
  );
}

function buildDates(startDate: string, endDate: string) {
  if (startDate > endDate) return [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const dates: string[] = [];
  for (
    const current = start;
    current <= end;
    current.setDate(current.getDate() + 1)
  ) {
    dates.push(current.toISOString().slice(0, 10));
  }
  return dates;
}
