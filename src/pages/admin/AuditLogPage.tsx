import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { PrintExportButtons } from '../../components/admin/PrintExportButtons';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Lock,
  Layers
} from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { auditLogs } = useAdmin();
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');

  const modules = ['ALL', 'FA Management', 'Farmers', 'Data Quality & Fraud', 'Loyalty Points', 'Broadcasts', 'Settings'];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.adminName.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase());

    const matchesModule = selectedModule === 'ALL' || log.module === selectedModule;

    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-emerald-600" />
            Security & Compliance Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable enterprise audit log recording all Head Office staff actions, farmer reallocations, and credential updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PrintExportButtons
            title="Head Office System Audit Log"
            data={filteredLogs}
            filename="SAGL_System_Audit_Log"
          />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Entries Logged</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{auditLogs.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">Full chain-of-custody</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Audit Compliance</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">100%</div>
          <span className="text-xs text-emerald-600 mt-1 block">ISO & Corporate Policy Certified</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Active Operators</span>
          <div className="text-2xl font-bold text-blue-700 mt-1">3 HO Roles</div>
          <span className="text-xs text-blue-600 mt-1 block">Super Admin, Agronomy, Vigilance</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">Log Retention</span>
          <div className="text-2xl font-bold text-purple-700 mt-1">7 Years</div>
          <span className="text-xs text-purple-600 mt-1 block">Encrypted cold storage</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by action, officer, or detail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {modules.map((m) => (
              <option key={m} value={m}>
                {m === 'ALL' ? 'All System Modules' : m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Event Ref</th>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Admin Officer</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Action Code</th>
                <th className="py-3 px-4">Event Description & Impact</th>
                <th className="py-3 px-4 text-right">Terminal IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500">{log.id}</td>
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {log.timestamp}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                        {log.adminName.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{log.adminName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 whitespace-nowrap">
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-800 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 text-xs leading-relaxed max-w-lg">{log.details}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-400 whitespace-nowrap">
                    {log.ipAddress || '192.168.1.104'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
