import { db } from "@/src/lib/db";
import { getOrderStatus } from "@/src/lib/orders";
import { DashboardRefresh } from "@/src/components/PaymentStatus";

export const instant = false;

// Displays all order and payment outcomes so demo edge cases are visible.
export default async function DashboardPage() {
  const [orders, payments] = await Promise.all([
    db.order.findMany({ include: { event: { select: { name: true } }, photographer: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    db.payment.findMany({ include: { photographer: { select: { name: true } } }, orderBy: { receivedAt: "desc" } }),
  ]);
  return <main className="page-shell">
    <DashboardRefresh />
    <header className="site-header"><a className="brand" href="/">frame<span>pay</span></a><a href="/">Guest view</a></header>
    <section className="hero compact"><p className="eyebrow">Showcase monitor</p><h1>Orders &amp; payments</h1><p className="muted">Verification outcomes and any reason are visible here.</p></section>
    <section className="card table-card"><h2>Orders</h2><div className="table-wrap"><table><thead><tr><th>Photographer</th><th>Event</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead><tbody>
      {orders.map((order) => { const status = getOrderStatus(order.status, order.expiresAt); return <tr key={order.id}><td>{order.photographer.name}</td><td>{order.event.name}</td><td>₹{Math.floor(order.amountPaise / 100)}.{String(order.amountPaise % 100).padStart(2, "0")}</td><td><span className={`status status-${status.toLowerCase()}`}>{status}</span></td><td>{order.createdAt.toLocaleString("en-IN")}</td></tr>; })}
    </tbody></table></div></section>
    <section className="card table-card"><h2>Payments</h2><div className="table-wrap"><table><thead><tr><th>Photographer</th><th>UTR</th><th>Status</th><th>Reason</th><th>Received</th></tr></thead><tbody>
      {payments.map((payment) => <tr key={payment.id}><td>{payment.photographer?.name ?? "Unknown"}</td><td>{payment.utr ?? "—"}</td><td><span className={`status status-${payment.status.toLowerCase()}`}>{payment.status}</span></td><td>{payment.reason ?? "—"}</td><td>{payment.receivedAt.toLocaleString("en-IN")}</td></tr>)}
    </tbody></table></div></section>
    {!payments.length && <p className="muted">No payments yet. Run a demo case to see verification outcomes.</p>}
  </main>;
}
