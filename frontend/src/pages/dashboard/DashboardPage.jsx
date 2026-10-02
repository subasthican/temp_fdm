/**
 * Back-office dashboard (Admin/Manager) — sales analytics from the
 * reports aggregation: headline stats, tender split, best-sellers, and a
 * daily sales trend, filterable by store and date range.
 */
import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Banknote, CreditCard, Wallet } from 'lucide-react';

import * as reportService from '../../services/reportService.js';
import * as storeService from '../../services/storeService.js';
import { useApiQuery } from '../../hooks/api';
import { queryKeys } from '../../constants';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import {
  Card,
  DataTable,
  EmptyState,
  LoadingState,
  PageHeader,
  Select,
} from '../../components/ui';

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

const TENDERS = {
  cash: { label: 'Cash', icon: Banknote },
  card: { label: 'Card', icon: CreditCard },
  wallet: { label: 'Wallet', icon: Wallet },
};

const rangeToDates = (range) => {
  if (range === 'all') return {};

  const now = new Date();
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  if (range === '7d') from.setDate(now.getDate() - 6);
  if (range === '30d') from.setDate(now.getDate() - 29);

  return { from: from.toISOString(), to: now.toISOString() };
};

const Stat = ({ label, value, sub }) => (
  <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
    <p className="text-xs font-medium uppercase tracking-wide text-muted">
      {label}
    </p>
    <p className="mt-1 text-2xl font-bold text-content nums">{value}</p>
    {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
  </div>
);

Stat.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node.isRequired,
  sub: PropTypes.node,
};

const DashboardPage = () => {
  const [range, setRange] = useState('7d');
  const [storeId, setStoreId] = useState('');

  const { data: storesData } = useApiQuery(
    queryKeys.stores.list({ isActive: true }),
    () => storeService.getStores({ isActive: true }),
  );

  const stores = storesData?.data || [];

  const filters = useMemo(
    () => ({ ...rangeToDates(range), ...(storeId && { storeId }) }),
    [range, storeId],
  );

  const { data, isLoading, errorMessage } = useApiQuery(
    queryKeys.reports.dashboard(filters),
    () => reportService.getDashboard(filters),
  );

  const summary = data?.summary;
  const stock = data?.stock;
  const tenders = data?.tenders || [];
  const topProducts = data?.topProducts || [];
  const daily = data?.daily || [];
  const maxDaily = Math.max(1, ...daily.map((d) => d.revenue));

  const topColumns = [
    { key: 'name', header: 'Product' },
    { key: 'qty', header: 'Qty', align: 'right' },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      render: (row) => formatCurrency(row.revenue),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Sales performance across your stores"
        actions={
          <div className="flex gap-2">
            <div className="w-40">
              <Select
                value={storeId}
                onChange={(event) => setStoreId(event.target.value)}
                options={[
                  { value: '', label: 'All stores' },
                  ...stores.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            </div>
            <div className="w-36">
              <Select
                value={range}
                onChange={(event) => setRange(event.target.value)}
                options={RANGES}
              />
            </div>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading dashboard..." />
      ) : errorMessage ? (
        <EmptyState title="Could not load dashboard" message={errorMessage} />
      ) : (
        <div className="space-y-6">
          {/* Headline sales stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Revenue" value={formatCurrency(summary.revenue)} />
            <Stat label="Sales" value={summary.salesCount} />
            <Stat label="Items sold" value={summary.itemsSold} />
            <Stat
              label="Avg basket"
              value={formatCurrency(summary.averageBasket)}
            />
          </div>

          {/* Current inventory snapshot (not affected by the date range) */}
          {stock && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Current inventory{storeId ? '' : ' · all stores'}
              </p>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat label="In stock (units)" value={stock.totalUnits} />
                <Stat
                  label="Stock value"
                  value={formatCurrency(stock.stockValue)}
                />
                <Stat
                  label="Low stock"
                  value={stock.lowStock}
                  sub="at or below reorder level"
                />
                <Stat label="Products" value={stock.skus} />
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Tender split */}
            <Card title="Payment methods">
              {tenders.length === 0 ? (
                <p className="text-sm text-muted">No sales in this period.</p>
              ) : (
                <ul className="space-y-3">
                  {tenders.map((tender) => {
                    const meta = TENDERS[tender.method] || {
                      label: tender.method,
                      icon: Banknote,
                    };
                    const Icon = meta.icon;
                    return (
                      <li
                        key={tender.method}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2 text-sm text-content">
                          <Icon size={16} className="text-muted" aria-hidden="true" />
                          {meta.label}
                          <span className="text-xs text-muted">
                            ({tender.count})
                          </span>
                        </span>
                        <span className="text-sm font-semibold text-content nums">
                          {formatCurrency(tender.amount)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Top products */}
            <Card title="Best sellers" className="lg:col-span-2" padding={false}>
              {topProducts.length === 0 ? (
                <div className="p-5">
                  <p className="text-sm text-muted">No sales in this period.</p>
                </div>
              ) : (
                <DataTable
                  columns={topColumns}
                  rows={topProducts}
                  rowKey="productId"
                />
              )}
            </Card>
          </div>

          {/* Daily trend */}
          <Card title="Daily sales">
            {daily.length === 0 ? (
              <p className="text-sm text-muted">No sales in this period.</p>
            ) : (
              <ul className="space-y-2">
                {daily.map((day) => (
                  <li key={day.date} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-muted nums">
                      {formatDate(day.date)}
                    </span>
                    <div className="h-5 flex-1 overflow-hidden rounded bg-surface-muted">
                      <div
                        className="h-full rounded bg-primary-500"
                        style={{ width: `${(day.revenue / maxDaily) * 100}%` }}
                      />
                    </div>
                    <span className="w-28 shrink-0 text-right text-sm font-medium text-content nums">
                      {formatCurrency(day.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
