import React from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

function DataTable<T extends { id: string }>({ data, columns, isLoading, emptyMessage = 'No data available', onRowClick }: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="card table-wrapper" style={{ padding: 'var(--spacing-6)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card table-wrapper" style={{ padding: 'var(--spacing-8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card table-wrapper">
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--border-default)' }}>
          <tr>
            {columns.map((col, index) => (
              <th key={String(col.key) + index} style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr 
              key={row.id} 
              onClick={() => onRowClick && onRowClick(row)}
              style={{ 
                borderBottom: '1px solid var(--border-subtle)', 
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if(onRowClick) e.currentTarget.style.backgroundColor = 'var(--surface-muted)' }}
              onMouseLeave={(e) => { if(onRowClick) e.currentTarget.style.backgroundColor = 'var(--surface-default)' }}
            >
              {columns.map((col, index) => (
                <td key={String(col.key) + index} style={{ padding: 'var(--spacing-3) var(--spacing-4)', fontSize: '0.875rem' }}>
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
