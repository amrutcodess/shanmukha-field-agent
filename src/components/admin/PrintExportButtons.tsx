import React from 'react';
import { Printer, Download } from 'lucide-react';
import { adminService } from '../../services/adminService';

interface PrintExportButtonsProps {
  title?: string;
  data?: Record<string, any>[];
  filename?: string;
  onPrint?: () => void;
  className?: string;
}

export const PrintExportButtons: React.FC<PrintExportButtonsProps> = ({
  data,
  filename = 'report',
  onPrint,
  className = '',
}) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleExportCSV = () => {
    if (data && data.length > 0) {
      adminService.exportToCSV(data, `${filename}-${new Date().toISOString().split('T')[0]}`);
    } else {
      alert('No data available to export.');
    }
  };

  return (
    <div className={`flex items-center gap-2 no-print ${className}`}>
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg shadow-xs transition"
        title="Print or Save as PDF"
      >
        <Printer className="w-3.5 h-3.5 text-stone-500" />
        <span>Print / PDF</span>
      </button>

      {data && (
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-xs transition"
          title="Export current table data to CSV"
        >
          <Download className="w-3.5 h-3.5 text-[#0B7A3B]" />
          <span>Export CSV</span>
        </button>
      )}
    </div>
  );
};
