/**
 * Tabular list with optional client-side sorting. Clean, spacious layout:
 * a quiet header (no fill), roomy rows, hairline dividers, an emphasized
 * primary column, and a crisp full-row hover.
 * columns: [{ key, header, sortable, render?(row), className?, align?, primary? }]
 * The first column is emphasized by default; set `primary: false` to opt out.
 */
import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';

const ALIGN = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

const DataTable = ({ columns, rows, rowKey = '_id', onRowClick }) => {
  const [sort, setSort] = useState(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;

    const { key, direction } = sort;

    return [...rows].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal === bVal) return 0;

      const result = aVal > bVal ? 1 : -1;

      return direction === 'asc' ? result : -result;
    });
  }, [rows, sort]);

  const toggleSort = (key) => {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: 'asc' };
      if (current.direction === 'asc') return { key, direction: 'desc' };

      return null;
    });
  };

  const isPrimary = (column, index) =>
    column.primary ?? (index === 0 && column.key !== 'actions');

  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => {
              const align = ALIGN[column.align] || ALIGN.left;
              const active = sort?.key === column.key;

              return (
                <th
                  key={column.key}
                  className={`whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-faint ${align} ${column.className || ''}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={`inline-flex items-center gap-1.5 transition-colors hover:text-content ${active ? 'text-content' : ''} ${column.align === 'right' ? 'flex-row-reverse' : ''}`}
                    >
                      {column.header}
                      {active ? (
                        sort.direction === 'asc' ? (
                          <ChevronUp size={13} aria-hidden="true" />
                        ) : (
                          <ChevronDown size={13} aria-hidden="true" />
                        )
                      ) : (
                        <ChevronsUpDown size={13} className="opacity-50" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {sortedRows.map((row) => (
            <tr
              key={row[rowKey]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`group transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-surface-muted/70' : ''
              }`}
            >
              {columns.map((column, index) => (
                <td
                  key={column.key}
                  className={`px-4 py-4 align-middle ${ALIGN[column.align] || ALIGN.left} ${column.align === 'right' ? 'nums' : ''} ${
                    isPrimary(column, index)
                      ? 'font-semibold text-content'
                      : 'text-muted'
                  } ${column.className || ''}`}
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.string.isRequired,
      sortable: PropTypes.bool,
      render: PropTypes.func,
      className: PropTypes.string,
      align: PropTypes.oneOf(['left', 'right', 'center']),
      primary: PropTypes.bool,
    }),
  ).isRequired,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  rowKey: PropTypes.string,
  onRowClick: PropTypes.func,
};

export default DataTable;
