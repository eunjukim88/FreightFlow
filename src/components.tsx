import { Link, NavLink } from "react-router-dom";
import {
  BarChart3,
  Banknote,
  ClipboardCheck,
  LayoutDashboard,
  Settings,
  Truck,
} from "lucide-react";
import type { MatchStatus, PaymentStatus } from "./types";
import { money } from "./lib";

export const Badge = ({
  status,
}: {
  status: PaymentStatus | MatchStatus | "마감완료" | "진행중";
}) => <span className={`badge badge-${status}`}>{status}</span>;
export const Amount = ({ value }: { value: number }) => (
  <span className="amount">{money(value)}</span>
);
export const PageTitle = ({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) => (
  <div className="page-title">
    <div>
      <h1>{title}</h1>
      <p>2026년 8월 28일 금요일</p>
    </div>
    {action}
  </div>
);
export const Empty = ({ text, href }: { text: string; href?: string }) => (
  <div className="empty">
    <Truck size={30} />
    <p>{text}</p>
    {href && (
      <Link className="button" to={href}>
        화물 등록
      </Link>
    )}
  </div>
);
export const Modal = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div className="overlay">
    <section className="modal">
      <h2>{title}</h2>
      {children}
      <div className="modal-actions">
        <button className="button secondary" onClick={onClose}>
          취소
        </button>
      </div>
    </section>
  </div>
);
export function Shell({ children }: { children: React.ReactNode }) {
  const menus = [
    ["/", "홈", LayoutDashboard],
    ["/freight", "배차관리", Truck],
    ["/deposits", "입금확인", Banknote],
    ["/closing", "마감관리", ClipboardCheck],
    ["/history", "이력조회", BarChart3],
    ["/settings", "설정", Settings],
  ] as const;
  return (
    <div className="shell">
      <aside>
        <div className="logo">
          <span>F</span> FreightFlow
        </div>
        <p className="menu-label">업무 메뉴</p>
        {menus.map(([to, label, Icon]) => (
          <NavLink end={to === "/"} key={to} to={to} className="nav">
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <div className="sidebar-note">
          <BarChart3 size={16} /> 오늘 업무를 빠르게
          <br />
          확인하세요.
        </div>
      </aside>
      <main>
        <header>
          <span>개인화물 배차 · 입금대사</span>
          <div>
            <span className="avatar">김</span> 김관리자
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
