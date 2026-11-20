import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { District, Broadcast } from '../../types/admin';
import { PrintExportButtons } from '../../components/admin/PrintExportButtons';
import {
  Radio,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Users,
  Smartphone,
  Plus,
  Calendar,
  Filter,
  CheckCheck
} from 'lucide-react';

export const BroadcastsPage: React.FC = () => {
  const { broadcasts, createBroadcast, fas, selectedDistrict, setSelectedDistrict } = useAdmin();

  const [showComposeModal, setShowComposeModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    targetDistrict: 'ALL' as District | 'ALL',
    targetGroup: 'ALL_FAS' as 'ALL_FAS' | 'ACTIVE_ONLY' | 'NEW_ONBOARDED',
    priority: 'NORMAL' as 'NORMAL' | 'URGENT' | 'CRITICAL',
    scheduleType: 'IMMEDIATE' as 'IMMEDIATE' | 'SCHEDULED',
    scheduledTime: '',
  });

  const districts: District[] = ['Medak', 'Sangareddy', 'Siddipet', 'Vikarabad', 'Nizamabad', 'Kamareddy'];

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) return;

    createBroadcast({
      title: form.title,
      message: form.message,
      targetDistrict: form.targetDistrict,
      targetGroup: form.targetGroup,
      priority: form.priority,
      status: form.scheduleType === 'IMMEDIATE' ? 'SENT' : 'SCHEDULED',
      scheduledTime: form.scheduleType === 'IMMEDIATE' ? 'Immediate' : form.scheduledTime || 'Tomorrow 08:00 AM',
    });

    setShowComposeModal(false);
    setForm({
      title: '',
      message: '',
      targetDistrict: 'ALL',
      targetGroup: 'ALL_FAS',
      priority: 'NORMAL',
      scheduleType: 'IMMEDIATE',
      scheduledTime: '',
    });
  };

  const totalDelivered = broadcasts.reduce((acc, b) => acc + (b.deliveredCount || 0), 0);
  const totalRead = broadcasts.reduce((acc, b) => acc + (b.readCount || 0), 0);
  const avgReadRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 89;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="w-7 h-7 text-emerald-600" />
            Field Broadcasts & Advisory Alerts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch urgent agronomic alerts, weather warnings, and corporate advisories directly to Field Assistants&apos; mobile devices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PrintExportButtons
            title="Broadcast Communications Log"
            data={broadcasts}
            filename="Advisory_Broadcasts_Report"
          />
          <button
            onClick={() => setShowComposeModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Compose Broadcast
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Bulletins</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{broadcasts.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">Lifetime dispatches</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Total Audience Reach</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{totalDelivered}</div>
          <span className="text-xs text-emerald-600 mt-1 block">Push notifications delivered</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">FA Open & Read Rate</span>
          <div className="text-2xl font-bold text-blue-700 mt-1">{avgReadRate}%</div>
          <span className="text-xs text-blue-600 mt-1 block">High engagement rate</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Scheduled / Queued</span>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {broadcasts.filter((b) => b.status === 'SCHEDULED').length}
          </div>
          <span className="text-xs text-amber-600 mt-1 block">Awaiting delivery time</span>
        </div>
      </div>

      {/* Broadcast Feed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Broadcast Dispatch History ({broadcasts.length})
          </h2>
          <span className="text-xs text-slate-500">Synced to field app in real time</span>
        </div>

        <div className="divide-y divide-slate-100">
          {broadcasts.map((b) => {
            const isCritical = b.priority === 'CRITICAL';
            const isUrgent = b.priority === 'URGENT';
            const readPct = b.deliveredCount > 0 ? Math.round((b.readCount / b.deliveredCount) * 100) : 0;

            return (
              <div key={b.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">{b.id}</span>

                      {isCritical ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> CRITICAL ALERT
                        </span>
                      ) : isUrgent ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> URGENT
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          GENERAL ADVISORY
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                        Target: {b.targetDistrict === 'ALL' ? 'All Districts' : b.targetDistrict}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 font-medium">
                        {b.targetGroup === 'ALL_FAS' ? 'All Field Staff' : b.targetGroup}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{b.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">{b.message}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {b.sentAt ? `Dispatched: ${b.sentAt}` : `Scheduled: ${b.scheduledTime}`}
                      </span>
                      <span>•</span>
                      <span>Status: <strong className="text-slate-700">{b.status}</strong></span>
                    </div>
                  </div>

                  {/* Delivery & Read Stats */}
                  <div className="w-full md:w-56 shrink-0 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Delivery Count</span>
                      <span className="font-bold text-slate-800">{b.deliveredCount} / {b.totalRecipients} FAs</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Read Receipts</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" />
                        {b.readCount} ({readPct}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${readPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compose Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">New Agronomic Broadcast</h3>
                  <p className="text-xs text-slate-500">Pushes immediate banner alert to Field Assistant devices</p>
                </div>
              </div>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleComposeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Advisory Title / Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sucking Pest Alert - Sangareddy Cotton Belt"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Advisory Body & Instructions <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail symptoms, recommended spray dose (e.g. Shan-BioPest @ 2ml/L), and farmer advisory guidelines..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target District</label>
                  <select
                    value={form.targetDistrict}
                    onChange={(e) => setForm({ ...form, targetDistrict: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="ALL">All Districts ({fas.length} FAs)</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Priority Level</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="NORMAL">Normal Advisory</option>
                    <option value="URGENT">Urgent (Yellow Badge)</option>
                    <option value="CRITICAL">Critical (Red Siren Alarm)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Dispatch Timing</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, scheduleType: 'IMMEDIATE' })}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors ${
                      form.scheduleType === 'IMMEDIATE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Send Now (Immediate)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, scheduleType: 'SCHEDULED' })}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors ${
                      form.scheduleType === 'SCHEDULED'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Schedule Dispatch
                  </button>
                </div>
              </div>

              {form.scheduleType === 'SCHEDULED' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    placeholder="e.g. Tomorrow 07:30 AM"
                    value={form.scheduledTime}
                    onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  {form.scheduleType === 'IMMEDIATE' ? 'Broadcast Immediately' : 'Queue Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
