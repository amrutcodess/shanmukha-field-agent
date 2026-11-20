import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { District, FieldAssistant } from '../../types/admin';
import { PrintExportButtons } from '../../components/admin/PrintExportButtons';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  ArrowRightLeft,
  Calendar,
  MapPin,
  Clock,
  Battery,
  AlertTriangle
} from 'lucide-react';

export const FAManagement: React.FC = () => {
  const {
    fas,
    filteredFAs,
    createFA,
    updateFA,
    deactivateFA,
    replaceFA,
    selectedDistrict,
    setSelectedDistrict,
    searchQuery,
    setSearchQuery,
  } = useAdmin();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedFA, setSelectedFA] = useState<FieldAssistant | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsFA, setCredentialsFA] = useState<FieldAssistant | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    phone: '',
    email: '',
    district: 'Medak' as District,
    mandal: 'Vatpally',
    deviceModel: 'Samsung Galaxy M14 5G',
    monitoringMonths: 6,
  });

  // Replace Form State
  const [replaceForm, setReplaceForm] = useState({
    newFaName: '',
    newFaPhone: '',
  });

  const districts: District[] = ['Medak', 'Sangareddy', 'Siddipet', 'Vikarabad', 'Nizamabad', 'Kamareddy'];

  const displayedFAs = filteredFAs.filter((fa) => {
    if (statusFilter === 'ACTIVE') return fa.isActive;
    if (statusFilter === 'INACTIVE') return !fa.isActive;
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.phone) return;

    const newFa = createFA({
      name: createForm.name,
      phone: createForm.phone,
      email: createForm.email || `${createForm.name.toLowerCase().replace(/\s+/g, '.')}@shanmukha.com`,
      district: createForm.district,
      mandal: createForm.mandal,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      appVersion: 'v2.4.1',
      batteryLevel: 100,
      lastSyncTime: 'Just now',
      currentLat: 17.75 + Math.random() * 0.4,
      currentLng: 78.15 + Math.random() * 0.4,
      deviceModel: createForm.deviceModel,
      isActive: true,
      monitoringMonths: Number(createForm.monitoringMonths),
    });

    setShowCreateModal(false);
    setCreateForm({
      name: '',
      phone: '',
      email: '',
      district: 'Medak',
      mandal: 'Vatpally',
      deviceModel: 'Samsung Galaxy M14 5G',
      monitoringMonths: 6,
    });

    setCredentialsFA(newFa);
    setShowCredentialsModal(true);
  };

  const handleReplaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFA || !replaceForm.newFaName || !replaceForm.newFaPhone) return;

    const replacement = replaceFA(selectedFA.id, replaceForm.newFaName, replaceForm.newFaPhone);
    setShowReplaceModal(false);
    setSelectedFA(null);
    setReplaceForm({ newFaName: '', newFaPhone: '' });

    setCredentialsFA(replacement);
    setShowCredentialsModal(true);
  };

  const activeCount = fas.filter((f) => f.isActive).length;
  const inactiveCount = fas.filter((f) => !f.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            Field Assistant (FA) Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Provision staff accounts, track field credentials, configure monitoring periods, and manage territorial handovers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PrintExportButtons
            title="Field Assistants Directory"
            data={displayedFAs}
            filename="Field_Assistants_Master"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add New FA
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total FAs</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{fas.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">Across 6 operational districts</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Active Field Roster</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</div>
          <span className="text-xs text-emerald-600 mt-1 block">Authorized for app sync</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Inactive / Suspended</span>
          <div className="text-2xl font-bold text-rose-700 mt-1">{inactiveCount}</div>
          <span className="text-xs text-rose-600 mt-1 block">Credentials revoked</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Standard Monitoring</span>
          <div className="text-2xl font-bold text-blue-700 mt-1">6 - 12 Mos</div>
          <span className="text-xs text-blue-600 mt-1 block">Service evaluation window</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({fas.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === 'INACTIVE' ? 'bg-rose-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive ({inactiveCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value as any)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FA Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Field Assistant</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">District / Mandal</th>
                <th className="py-3 px-4 text-center">Assigned Farmers</th>
                <th className="py-3 px-4 text-center">Monitoring Period</th>
                <th className="py-3 px-4 text-center">Quality Score</th>
                <th className="py-3 px-4 text-center">App / Device</th>
                <th className="py-3 px-4 text-center">Credential Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedFAs.map((fa) => (
                <tr key={fa.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                        {fa.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{fa.name}</div>
                        <div className="text-xs text-slate-500">{fa.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">{fa.id}</td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="font-medium">{fa.district}</div>
                    <div className="text-xs text-slate-500">{fa.mandal}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                      {fa.assignedFarmersCount} Farmers
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{fa.monitoringMonths || 6} Months</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Since {fa.joinDate}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-bold text-slate-800">{fa.qualityScore}</span>
                    <span className="text-xs text-slate-400">/100</span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs text-slate-600">
                    <div className="font-mono">{fa.appVersion}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[130px] mx-auto">{fa.deviceModel}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {fa.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Authorized
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Deactivated
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setCredentialsFA(fa);
                          setShowCredentialsModal(true);
                        }}
                        title="View App Credentials"
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedFA(fa);
                          setShowReplaceModal(true);
                        }}
                        title="Replace FA & Handover Territory"
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>

                      {fa.isActive ? (
                        <button
                          onClick={() => deactivateFA(fa.id)}
                          title="Deactivate Account"
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <XCircle className="w-4 h-4 text-rose-500" />
                        </button>
                      ) : (
                        <button
                          onClick={() => updateFA(fa.id, { isActive: true, status: 'ACTIVE' })}
                          title="Reactivate Account"
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Create New FA */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Provision New Field Assistant</h3>
                  <p className="text-xs text-slate-500">Auto-generates SAGL-FA credentials for mobile app</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M. Rajesh Kumar"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Phone (Mobile) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98480 12345"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Corporate Email</label>
                  <input
                    type="email"
                    placeholder="rajesh.m@shanmukha.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned District</label>
                  <select
                    value={createForm.district}
                    onChange={(e) => setCreateForm({ ...createForm, district: e.target.value as District })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mandal / Taluk</label>
                  <input
                    type="text"
                    value={createForm.mandal}
                    onChange={(e) => setCreateForm({ ...createForm, mandal: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned Handset</label>
                  <input
                    type="text"
                    value={createForm.deviceModel}
                    onChange={(e) => setCreateForm({ ...createForm, deviceModel: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Monitoring Duration</label>
                  <select
                    value={createForm.monitoringMonths}
                    onChange={(e) => setCreateForm({ ...createForm, monitoringMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value={3}>3 Months (Probationary)</option>
                    <option value={6}>6 Months (Single Season)</option>
                    <option value={12}>12 Months (Full Annual Cycle)</option>
                    <option value={24}>24 Months (Senior Associate)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  Authorize & Issue Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Replace FA & Territory Handover */}
      {showReplaceModal && selectedFA && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Territory Handover & FA Replacement</h3>
                  <p className="text-xs text-slate-500">Deactivates current FA and safely reassigns all farmer accounts</p>
                </div>
              </div>
              <button
                onClick={() => setShowReplaceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed">
                You are initiating a turnover handover for <strong>{selectedFA.name}</strong> ({selectedFA.id}). All{' '}
                <strong>{selectedFA.assignedFarmersCount} farmers</strong> in <strong>{selectedFA.district}</strong> will be
                immediately transferred to the successor with no loss of historical visits or consent logs.
              </div>
            </div>

            <form onSubmit={handleReplaceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Incoming Successor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B. Narendar"
                  value={replaceForm.newFaName}
                  onChange={(e) => setReplaceForm({ ...replaceForm, newFaName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Successor Registered Mobile <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 99000 44556"
                  value={replaceForm.newFaPhone}
                  onChange={(e) => setReplaceForm({ ...replaceForm, newFaPhone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <div><strong>Assigned Territory:</strong> {selectedFA.district} ({selectedFA.mandal})</div>
                <div><strong>Handover Farmers:</strong> {selectedFA.assignedFarmersCount} active farmers</div>
                <div><strong>Old FA Status:</strong> Will be revoked and marked OFFLINE</div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReplaceModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  Execute Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: View FA App Credentials */}
      {showCredentialsModal && credentialsFA && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">FA Mobile App Credentials</h3>
              </div>
              <button
                onClick={() => setShowCredentialsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-xs text-emerald-800 font-semibold mb-1">FIELD ASSISTANT IDENTITY</div>
                <div className="text-base font-bold text-emerald-950">{credentialsFA.name}</div>
                <div className="text-xs text-emerald-700 mt-0.5">{credentialsFA.district} District • {credentialsFA.mandal}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Employee Code:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {credentialsFA.id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Registered Mobile:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {credentialsFA.phone}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Default Mobile OTP:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-300">
                    123456
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed pt-2">
                The Field Assistant can log into the Shanpoorna mobile client by selecting &quot;Field Assistant Login&quot; and entering their registered phone number or ID.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowCredentialsModal(false)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Close & Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
