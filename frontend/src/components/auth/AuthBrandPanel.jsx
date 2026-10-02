import {
  BadgeCheck,
  Banknote,
  ScanLine,
  Store,
  TrendingUp,
  WifiOff,
} from 'lucide-react';

import { formatCurrency } from '../../utils/formatters.js';

const HIGHLIGHTS = [
  { icon: ScanLine, label: 'Barcode-first checkout' },
  { icon: WifiOff, label: 'Reliable daily operations' },
  { icon: TrendingUp, label: 'Live sales insights' },
];

const RECEIPT_ITEMS = [
  { name: 'Basmati Rice 5kg', price: 3250 },
  { name: 'Milk Powder 400g', price: 1180 },
  { name: 'Red Dhal 1kg', price: 640 },
];

const AuthBrandPanel = () => {
  const receiptTotal = RECEIPT_ITEMS.reduce(
    (total, item) => total + item.price,
    0,
  );

  return (
    <section
      className="relative hidden h-screen overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col xl:p-12"
      aria-label="Point of sale platform introduction"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-950 to-slate-950" />
      <div className="pointer-events-none absolute -left-36 -top-40 h-[30rem] w-[30rem] rounded-full bg-primary-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-28 h-[26rem] w-[26rem] rounded-full bg-info-600/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative z-10 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-950">
          <Store size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="text-lg font-semibold leading-tight">Project D POS</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary-300">
            Intelligent retail
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-10 max-w-xl xl:mt-14">
        <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight xl:text-5xl">
          Every sale,
          <span className="block bg-gradient-to-r from-primary-300 to-info-300 bg-clip-text text-transparent">
            beautifully fast.
          </span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400 xl:text-base xl:leading-7">
          Checkout, inventory, customers, and reporting—connected in one
          dependable workspace.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
            >
              <Icon size={14} className="text-primary-300" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-auto flex items-end gap-5 pb-2">
        <div className="w-72 -rotate-1 rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Receipt #00417
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-500/15 px-2 py-0.5 text-[11px] font-medium text-success-400">
              <BadgeCheck size={12} /> Paid
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {RECEIPT_ITEMS.map((item) => (
              <div key={item.name} className="flex justify-between gap-3 text-xs">
                <span className="text-slate-300">{item.name}</span>
                <span className="font-medium text-slate-100">
                  {formatCurrency(item.price)}
                </span>
              </div>
            ))}
          </div>
          <div className="my-4 border-t border-dashed border-white/15" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total</span>
            <span className="text-lg font-semibold">{formatCurrency(receiptTotal)}</span>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Banknote size={13} /> Cash · Lane 02 · 09:41 AM
          </p>
        </div>

        <div className="hidden w-52 rotate-1 rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl shadow-black/40 xl:block">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Today&apos;s sales
          </p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(128540)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success-400">
            <TrendingUp size={13} /> +12% vs yesterday
          </p>
          <div className="mt-4 flex h-12 items-end gap-1.5">
            {[35, 55, 40, 70, 52, 85, 64, 95].map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-sm bg-gradient-to-t from-primary-700 to-primary-400"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="relative z-10 mt-6 text-xs text-slate-600">
        © {new Date().getFullYear()} Project D POS
      </p>
    </section>
  );
};

export default AuthBrandPanel;
