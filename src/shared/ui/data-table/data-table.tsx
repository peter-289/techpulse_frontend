import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  className?: string;
  render?: (row: Row) => ReactNode;
};

export function DataTable<Row extends { id: string | number }>({
  columns,
  rows,
  rowKey,
  className,
}: {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  rowKey?: (row: Row) => string;
  className?: string;
}) {
  return (
    <div className={cn('sec-table-wrap', className)}>
      <table className="sec-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey ? rowKey(row) : row.id}>
              {columns.map((column) => (
                <td key={column.key} className={column.className}>
                  {column.render
                    ? column.render(row)
                    : String((row as Record<string, unknown>)[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
