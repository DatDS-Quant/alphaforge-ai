import React from 'react';

interface Column {
  header: string;
  accessor: string;
  render?: (row: any) => React.ReactNode;
}

interface DataGridProps {
  columns: Column[];
  data: any[];
}

export const DataGrid: React.FC<DataGridProps> = ({ columns, data }) => {
  return (
    <div className="terminal-table-container">
      <table className="terminal-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                No records found.
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((col, colIdx) => (
                  <td key={colIdx}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
