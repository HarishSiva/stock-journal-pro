export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-500">
          Welcome to Stock Journal Pro.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-sm text-slate-500">Portfolio Value</h2>
          <p className="mt-2 text-2xl font-bold">₹0.00</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-sm text-slate-500">Invested</h2>
          <p className="mt-2 text-2xl font-bold">₹0.00</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-sm text-slate-500">Realized P&L</h2>
          <p className="mt-2 text-2xl font-bold text-green-600">₹0.00</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-sm text-slate-500">Open Positions</h2>
          <p className="mt-2 text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
}