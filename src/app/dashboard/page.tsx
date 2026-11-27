import { getOrderStatus, listDashboardData, listDashboardEvents } from "@/src/modules/orders/order.service";
import { DashboardRefresh } from "@/src/components/PaymentStatus";
import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/src/components/SignOutButton";
import { OrderStatus, PaymentStatus } from "@/src/app/generated/prisma/enums";
import { Suspense } from "react";
import { connection } from "next/server";

export const instant = false;

type DashboardSearchParams = Promise<{ orderStatus?: string; paymentStatus?: string; eventId?: string }>;

function DashboardFallback() {
  return <main className="page-shell" aria-busy="true"><section className="hero compact"><p className="eyebrow">Showcase monitor</p><h1>Orders &amp; payments</h1><p className="muted">Loading your dashboard.</p></section></main>;
}

export default function DashboardPage({ searchParams }: { searchParams: DashboardSearchParams }) {
  return <Suspense fallback={<DashboardFallback />}><DashboardContent searchParams={searchParams} /></Suspense>;
}

// Displays all order and payment outcomes so demo edge cases are visible.
async function DashboardContent({ searchParams }: { searchParams: DashboardSearchParams }) {
  await connection();
  const session = await auth();
  if (!session?.user.photographerId) redirect("/login");
  const photographerId = session.user.photographerId;
  const query = await searchParams;
  const orderStatus = Object.values(OrderStatus).find((value) => value === query.orderStatus);
  const paymentStatus = Object.values(PaymentStatus).find((value) => value === query.paymentStatus);
  const [orders, payments] = await listDashboardData({ photographerId, orderStatus, paymentStatus, eventId: query.eventId });
  const events = await listDashboardEvents(photographerId);
  return <main className="page-shell">
    <DashboardRefresh />
    <header className="site-header"><Link className="brand" href="/">frame<span>pay</span></Link><nav><Link href="/dashboard/events">Events</Link><Link href="/dashboard/settings">Settings</Link><Link href="/">Guest view</Link><SignOutButton /></nav></header>
    <section className="hero compact"><p className="eyebrow">Showcase monitor</p><h1>Orders &amp; payments</h1><p className="muted">Verification outcomes and any reason are visible here.</p></section>
    <form className="controls" action="/dashboard" method="get">
      <label>Event<select name="eventId" defaultValue={query.eventId ?? ""}><option value="">All events</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label>
      <label>Order status<select name="orderStatus" defaultValue={orderStatus ?? ""}><option value="">All orders</option>{Object.values(OrderStatus).map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Payment status<select name="paymentStatus" defaultValue={paymentStatus ?? ""}><option value="">All payments</option>{Object.values(PaymentStatus).map((value) => <option key={value}>{value}</option>)}</select></label>
      <button className="button" type="submit">Apply filters</button>
    </form>
    <section className="card table-card"><h2>Orders</h2><div className="table-wrap"><table><thead><tr><th>Photographer</th><th>Event</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead><tbody>
      {orders.map((order) => { const status = getOrderStatus(order.status, order.expiresAt); return <tr key={order.id}><td>{order.photographer.name}</td><td>{order.event.name}</td><td>₹{Math.floor(order.amountPaise / 100)}.{String(order.amountPaise % 100).padStart(2, "0")}</td><td><span className={`status status-${status.toLowerCase()}`}>{status}</span></td><td>{order.createdAt.toLocaleString("en-IN")}</td></tr>; })}
    </tbody></table></div></section>
    <section className="card table-card"><h2>Payments</h2><div className="table-wrap"><table><thead><tr><th>Photographer</th><th>UTR</th><th>Status</th><th>Reason</th><th>Received</th></tr></thead><tbody>
      {payments.map((payment) => <tr key={payment.id}><td>{payment.photographer?.name ?? "Unknown"}</td><td>{payment.utr ?? "—"}</td><td><span className={`status status-${payment.status.toLowerCase()}`}>{payment.status}</span></td><td>{payment.reason ?? "—"}</td><td>{payment.receivedAt.toLocaleString("en-IN")}</td></tr>)}
    </tbody></table></div></section>
    {!payments.length && <p className="muted">No payments yet. Run a demo case to see verification outcomes.</p>}
  </main>;
}
