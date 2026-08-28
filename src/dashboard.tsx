import { Link } from "react-router-dom";
import { AlertCircle, ChevronRight } from "lucide-react";
import { PageTitle } from "./components";
import { money, payment, summary, type Store } from "./lib";
import { Card, FreightTable } from "./pages";

const today = "2026-08-28";

export function Dashboard({ store }: { store: Store }) {
  const orders = store.freights.filter((f) => f.date === today);
  const totals = summary(orders);
  const done = orders.filter((f) => payment(f) === "완료").length;
  const unpaid = orders.filter((f) => payment(f) === "미입금").length;
  const unmatched = store.transactions.filter(
    (t) => t.status === "미매칭",
  ).length;
  return (
    <div className="content">
      <PageTitle title="운영 대시보드" />
      <div className="grid four">
        <Card
          label="금일 배차"
          value={`${orders.length}건`}
          detail="당일 등록 배차"
          href="/freight"
        />
        <Card
          label="입금완료"
          value={`${done}건`}
          detail={`완료율 ${orders.length ? Math.round((done / orders.length) * 100) : 0}%`}
          href="/deposits"
        />
        <Card
          label="미입금"
          value={`${unpaid}건`}
          detail="확인 필요한 화물"
          href="/freight"
        />
        <Card
          label="금일 예상수익"
          value={money(totals.sales - totals.purchase)}
          detail={`매출 ${money(totals.sales)}`}
          href="/closing"
        />
      </div>
      <div className="dashboard-columns">
        <section className="panel dashboard-focus">
          <div className="section-head">
            <div>
              <h2>오늘 확인할 업무</h2>
              <p>마감 전 처리해야 할 항목입니다.</p>
            </div>
            <Link to="/history">업무이력 보기</Link>
          </div>
          <div className="tasks">
            <Link to="/freight">
              <AlertCircle />
              미입금 <b>{unpaid}건</b>
              <ChevronRight />
            </Link>
            <Link to="/deposits">
              <AlertCircle />
              입금 미매칭 <b>{unmatched}건</b>
              <ChevronRight />
            </Link>
            <Link to="/freight">
              <AlertCircle />
              기사 미배정 <b>{orders.filter((f) => !f.driver).length}건</b>
              <ChevronRight />
            </Link>
          </div>
        </section>
        <section className="panel daily-brief">
          <h2>금일 운영 현황</h2>
          <p>
            <span>기사 배정률</span>
            <b>
              {orders.length
                ? Math.round(
                    (orders.filter((f) => f.driver).length / orders.length) *
                      100,
                  )
                : 0}
              %
            </b>
          </p>
          <p>
            <span>입금 확인률</span>
            <b>
              {orders.length ? Math.round((done / orders.length) * 100) : 0}%
            </b>
          </p>
          <p>
            <span>오늘 마감</span>
            <b>
              {store.closings.find((closing) => closing.date === today)?.closed
                ? "마감완료"
                : "마감 전"}
            </b>
          </p>
          <Link className="text-button" to="/closing">
            일 마감 확인하기 <ChevronRight size={15} />
          </Link>
        </section>
      </div>
      <section className="panel dashboard-history">
        <div className="section-head">
          <div>
            <h2>최근 실적 및 마감 이력</h2>
            <p>기간별 매출·매입·수익 추이는 이력조회에서 확인할 수 있습니다.</p>
          </div>
          <Link to="/history">이력조회</Link>
        </div>
        <div className="history-preview">
          <div>
            <span>최근 누적 매출</span>
            <b>{money(summary(store.freights).sales)}</b>
          </div>
          <div>
            <span>최근 누적 매입</span>
            <b>{money(summary(store.freights).purchase)}</b>
          </div>
          <div>
            <span>최근 누적 수익</span>
            <b>
              {money(
                summary(store.freights).sales -
                  summary(store.freights).purchase,
              )}
            </b>
          </div>
          <Link to="/history" className="preview-link">
            기간별 실적 조회 <ChevronRight size={16} />
          </Link>
        </div>
      </section>
      <section className="panel">
        <div className="section-head">
          <h2>오늘 배차</h2>
          <Link to="/freight">전체보기</Link>
        </div>
        <FreightTable rows={orders.slice(0, 6)} />
      </section>
    </div>
  );
}
