import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { PrintExportButtons } from '../../components/admin/PrintExportButtons';
import { Coins, CheckCircle, Clock, Check, Filter } from 'lucide-react';

export const LoyaltyPoints: React.FC = () => {
  const { loyalty, approveLoyaltyPayout } = useAdmin();

  const [entityFilter, setEntityFilter] = useState<'ALL' | 'FA' | 'FARMER'>('ALL');
  const [payoutFilter, setPayoutFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PAID'>('ALL');

  const filteredEntries = loyalty.filter((e) => {
    if (entityFilter !== 'ALL' && e.entityType !== entityFilter) return false;
    if (payoutFilter !== 'ALL' && e.payoutStatus !== payoutFilter) return false;
    return true;
  });

  const totalPointsEarned = loyalty.reduce((acc, e) => acc + e.pointsEarned, 0);
  const totalPointsRedeemed = loyalty.reduce((acc, e) => acc + e.pointsRedeemed, 0);
  const pendingPayouts = loyalty.filter((e) => e.payoutStatus === 'PENDING');
  const totalPendingAmount = pendingPayouts.reduce((acc, e) => acc + e.amountRupees, 0);

  const exportData = filteredEntries.map((e) => ({
    Entry_ID: e.id,
    Date: e.date,
    Entity_Type: e.entityType,
    Entity_Name: e.entityName,
    District: e.district,
    Activity: e.activity,
    Points_Earned: e.pointsEarned,
    Points_Redeemed: e.pointsRedeemed,
    Balance_Points: e.balancePoints,
    Payout_Status: e.payoutStatus,
    Amount_INR: e.amountRupees,
  }));

  const handleApprove = (id: string) => {
    approveLoyaltyPayout(id);
    alert('Loyalty incentive payout approved for direct bank / UPI transfer!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>Loyalty Points & Incentive Ledger</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#0B7A3B]">
              {totalPointsEarned.toLocaleString()} Points Issued
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Audit gamified milestones, FA visit incentive rewards & farmer repeat engagement points
          </p>
        </div>

        <PrintExportButtons data={exportData} filename="loyalty-points-ledger" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">TOTAL POINTS EARNED</span>
          <div className="text-2xl font-black text-[#0B7A3B] mt-1">{totalPointsEarned.toLocaleString()}</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Visits, compliance & soil samples</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">TOTAL POINTS REDEEMED</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{totalPointsRedeemed.toLocaleString()}</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Cash vouchers & input discounts</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">PENDING INCENTIVE PAYOUTS</span>
          <div className="text-2xl font-black text-[#E8731A] mt-1">{pendingPayouts.length} Claims</div>
          <p className="text-[11px] text-amber-800 font-semibold mt-0.5">₹{totalPendingAmount.toLocaleString()} awaiting approval</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">POINT CONVERSION RATE</span>
          <div className="text-2xl font-black text-stone-800 mt-1">1 Pt = ₹1.00</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Direct UPI remittance protocol</p>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200">
            <span className="text-stone-400 font-semibold">Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value as any)}
              className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Entities</option>
              <option value="FA">Field Assistants Only</option>
              <option value="FARMER">Farmers Only</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200">
            <span className="text-stone-400 font-semibold">Payout:</span>
            <select
              value={payoutFilter}
              onChange={(e) => setPayoutFilter(e.target.value as any)}
              className="bg-transparent font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Payout Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Disbursed (Paid)</option>
            </select>
          </div>
        </div>

        <span className="text-stone-400 font-medium">{filteredEntries.length} entries</span>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-semibold">
              <tr>
                <th className="p-3">Transaction ID & Date</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Recipient Name</th>
                <th className="p-3">District</th>
                <th className="p-3">Activity Description</th>
                <th className="p-3 text-right">Points Earned</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredEntries.map((e) => (
                <tr key={e.id} className="hover:bg-stone-50">
                  <td className="p-3">
                    <div className="font-bold font-mono text-stone-900">{e.id}</div>
                    <div className="text-[10px] text-stone-400">{e.date}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.entityType === 'FA' ? 'bg-emerald-100 text-[#0B7A3B]' : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {e.entityType}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-stone-900">{e.entityName}</td>
                  <td className="p-3 text-stone-600">{e.district}</td>
                  <td className="p-3 text-stone-700">{e.activity}</td>
                  <td className="p-3 text-right font-black text-emerald-700">+{e.pointsEarned}</td>
                  <td className="p-3 text-right font-bold text-stone-900">₹{e.amountRupees}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        e.payoutStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : e.payoutStatus === 'APPROVED'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {e.payoutStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {e.payoutStatus === 'PENDING' ? (
                      <button
                        onClick={() => handleApprove(e.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#0B7A3B] text-white text-[11px] font-bold shadow-xs hover:bg-[#096330] transition"
                      >
                        Approve Payout
                      </button>
                    ) : (
                      <span className="text-stone-400 text-[11px]">Disbursed</span>
                    )}
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
