import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { FlagThresholds, AdminUser } from '../../types/admin';
import {
  Settings,
  Shield,
  Sliders,
  Package,
  Sprout,
  User,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Building
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { thresholds, updateThresholds, adminUser, updateCurrentUser, resetDemoData } = useAdmin();

  // Thresholds state
  const [formThresholds, setFormThresholds] = useState<FlagThresholds>(thresholds);
  const [thresholdSaved, setThresholdSaved] = useState(false);

  // Profile state
  const [profileForm, setProfileForm] = useState<AdminUser>(adminUser);
  const [profileSaved, setProfileSaved] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'THRESHOLDS' | 'PRODUCTS' | 'CROPS' | 'PROFILE'>('THRESHOLDS');

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholds(formThresholds);
    setThresholdSaved(true);
    setTimeout(() => setThresholdSaved(false), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser(profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const productCatalog = [
    { id: 'PRD-01', name: 'Shan-BioPest Liquid', type: 'Bio-Insecticide', packSize: '250 ml / 500 ml', mrp: '₹450 / ₹820', margin: '14%' },
    { id: 'PRD-02', name: 'Shan-NeemPlus 10000 PPM', type: 'Botanical Repellent', packSize: '1 Litre', mrp: '₹650', margin: '12%' },
    { id: 'PRD-03', name: 'Shan-Trichoderma Viride', type: 'Bio-Fungicide', packSize: '1 kg pouch', mrp: '₹320', margin: '15%' },
    { id: 'PRD-04', name: 'Shan-AgriHumic Gold', type: 'Plant Growth Stimulant', packSize: '500 ml', mrp: '₹580', margin: '18%' },
    { id: 'PRD-05', name: 'Shan-Micronutrient Spray', type: 'Chelated Minerals', packSize: '500 g', mrp: '₹290', margin: '10%' },
    { id: 'PRD-06', name: 'Shan-Yellow Sticky Traps', type: 'Pest Surveillance', packSize: 'Pack of 10 sheets', mrp: '₹180', margin: '20%' },
  ];

  const cropStages = [
    { crop: 'Cotton', stages: ['Sowing & Emergence', 'Vegetative (Squaring)', 'Flowering & Boll formation', 'Boll Opening & Harvest'] },
    { crop: 'Paddy / Rice', stages: ['Nursery & Transplanting', 'Tillering & Panicle initiation', 'Heading & Flowering', 'Milking & Grain maturity'] },
    { crop: 'Chilli', stages: ['Transplanting', 'Vegetative branching', 'Flowering & Fruit set', 'Fruit picking / Harvest'] },
    { crop: 'Maize', stages: ['Germination', 'Knee-high vegetative', 'Tasseling & Silking', 'Cob filling & Maturity'] },
    { crop: 'Red Gram (Tur)', stages: ['Early Vegetative', 'Branching', 'Flowering & Pod development', 'Pod maturity & Harvest'] },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-emerald-600" />
            Platform & Governance Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure automated fraud anomaly thresholds, agronomy catalogue items, and Head Office credentials.
          </p>
        </div>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Demo Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('THRESHOLDS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'THRESHOLDS'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/70 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Anomaly & Fraud Thresholds
        </button>
        <button
          onClick={() => setActiveTab('PRODUCTS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'PRODUCTS'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/70 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          Product Catalogue
        </button>
        <button
          onClick={() => setActiveTab('CROPS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'CROPS'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/70 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sprout className="w-4 h-4" />
          Crop Stage Definitions
        </button>
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
            activeTab === 'PROFILE'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/70 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          Admin Profile & Role
        </button>
      </div>

      {/* Tab 1: Anomaly Thresholds */}
      {activeTab === 'THRESHOLDS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900">Field Anomaly Detection Sensitivity</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated rules running across GPS traces and visit intervals to flag potential fraudulent or low-integrity logs.
            </p>
          </div>

          <form onSubmit={handleSaveThresholds} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Minimum Visit Duration (Minutes)
                </label>
                <p className="text-xs text-slate-500">
                  Visits shorter than this threshold will be flagged as &apos;SHORT_VISIT&apos;.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={formThresholds.minVisitDurationMinutes}
                    onChange={(e) =>
                      setFormThresholds({ ...formThresholds, minVisitDurationMinutes: Number(e.target.value) })
                    }
                    className="w-24 px-3 py-1.5 text-sm font-bold border border-slate-300 rounded-lg bg-white"
                  />
                  <span className="text-xs font-semibold text-slate-600">Minutes</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Maximum Plausible Speed (km/h)
                </label>
                <p className="text-xs text-slate-500">
                  Route segments moving faster than this rate trigger a &apos;GPS_JUMP&apos; warning.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="number"
                    min={20}
                    max={150}
                    value={formThresholds.maxSpeedKmH}
                    onChange={(e) =>
                      setFormThresholds({ ...formThresholds, maxSpeedKmH: Number(e.target.value) })
                    }
                    className="w-24 px-3 py-1.5 text-sm font-bold border border-slate-300 rounded-lg bg-white"
                  />
                  <span className="text-xs font-semibold text-slate-600">km/h</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Farmer Follow-up Overdue (Days)
                </label>
                <p className="text-xs text-slate-500">
                  Farmers unvisited past this threshold are tagged with red &apos;OVERDUE&apos; badges.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="number"
                    min={7}
                    max={60}
                    value={formThresholds.overdueDays}
                    onChange={(e) =>
                      setFormThresholds({ ...formThresholds, overdueDays: Number(e.target.value) })
                    }
                    className="w-24 px-3 py-1.5 text-sm font-bold border border-slate-300 rounded-lg bg-white"
                  />
                  <span className="text-xs font-semibold text-slate-600">Days</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Max Allowed Location-Off Gap
                </label>
                <p className="text-xs text-slate-500">
                  Continuous GPS disconnection exceeding this duration triggers an alert.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="number"
                    min={15}
                    max={240}
                    value={formThresholds.maxLocationOffMinutes}
                    onChange={(e) =>
                      setFormThresholds({ ...formThresholds, maxLocationOffMinutes: Number(e.target.value) })
                    }
                    className="w-24 px-3 py-1.5 text-sm font-bold border border-slate-300 rounded-lg bg-white"
                  />
                  <span className="text-xs font-semibold text-slate-600">Minutes</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              {thresholdSaved ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Thresholds updated and applied immediately to live monitoring!
                </span>
              ) : (
                <span className="text-xs text-slate-400">Values are stored in local browser state.</span>
              )}

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Threshold Parameters
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Products */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Shanmukha Proprietary Agri-Input Master
              </h2>
              <p className="text-xs text-slate-500">Synchronized directly into Field Assistant mobile prescriptions</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              6 Certified Formulations
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Pack Size</th>
                  <th className="py-3 px-4 text-right">Farmer MRP</th>
                  <th className="py-3 px-4 text-center">Dealer Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productCatalog.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-500">{p.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{p.packSize}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">{p.mrp}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">{p.margin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Crop Stage Definitions */}
      {activeTab === 'CROPS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Official Agronomic Phenological Stages</h2>
            <p className="text-xs text-slate-500">
              Stages populated in Question Set B (Visit Questionnaire) on the Field Assistant mobile client.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cropStages.map((cs) => (
              <div key={cs.crop} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">{cs.crop}</h3>
                </div>
                <div className="space-y-1.5 pt-1">
                  {cs.stages.map((stg, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{stg}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Profile */}
      {activeTab === 'PROFILE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-xl">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900">Head Office Administrator Identity</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active session details used for audit logging and sign-offs.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Corporate Email</label>
              <input
                type="email"
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned Role</label>
              <select
                value={profileForm.role}
                onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="SUPER_ADMIN">Super Administrator (Head Office)</option>
                <option value="REGIONAL_MANAGER">Regional Operations Manager</option>
                <option value="AGRONOMY_HEAD">Head of Agronomy & Research</option>
                <option value="VIGILANCE_OFFICER">Data Quality & Vigilance Officer</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              {profileSaved ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Profile updated!
                </span>
              ) : (
                <span className="text-xs text-slate-400">Session role</span>
              )}

              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                Update Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal: Reset Demo Data */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reset Demo Seed Data?</h3>
                <p className="text-xs text-slate-500">Restores all 25 FAs, 500 farmers, and 90 days of visits</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              This will re-initialize the local database with freshly seeded test records (including K. Srinivas in Medak,
              Ramesh Goud, and realistic anomaly flags). Any newly created FAs or custom notes will be replaced with seed defaults.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetDemoData();
                  setShowResetConfirm(false);
                  window.location.reload();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
              >
                Yes, Reset All Seed Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
