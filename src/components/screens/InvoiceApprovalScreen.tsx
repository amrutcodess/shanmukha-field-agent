import React, { useState } from 'react';
import { useShanpoorna } from '../../context/ShanpoornaContext';
import { StatusChip } from '../common/StatusChip';
import { Invoice } from '../../mockData';
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  CreditCard,
  User,
  Phone,
  FileCheck2,
} from 'lucide-react';

export const InvoiceApprovalScreen: React.FC = () => {
  const {
    invoices,
    approveInvoice,
    rejectInvoice,
    setCurrentScreen,
    showToast,
    selectedInvoiceDetail,
    setSelectedInvoiceDetail,
  } = useShanpoorna();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesFilter =
      activeFilter === 'ALL'
        ? true
        : activeFilter === 'PENDING'
        ? inv.status === 'PENDING'
        : inv.status === 'APPROVED';

    const matchesSearch =
      inv.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.utrId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F4F6F4] pb-24 text-stone-800">
      {/* Top Header */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-stone-200 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('HOME')}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100 text-[#0B7A3B] transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-stone-900 leading-tight">Invoice Approval</h1>
            <p className="text-[11px] text-stone-500">
              Verify payments and activate memberships
            </p>
          </div>
        </div>

        <button
          onClick={() => showToast('Invoices synced with Head Office ERP', 'info')}
          className="text-xs font-semibold text-[#0B7A3B] px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition"
        >
          Sync HO
        </button>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by farmer, UTR ID or Invoice #"
            className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B7A3B]"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'APPROVED'] as const).map((filter) => {
            const count =
              filter === 'ALL'
                ? invoices.length
                : invoices.filter((i) => i.status === filter).length;
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#0B7A3B] text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>{filter === 'ALL' ? 'All Invoices' : filter === 'PENDING' ? 'Pending' : 'Approved'}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Invoices List */}
        <div className="space-y-3">
          {filteredInvoices.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-stone-200">
              <Clock className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-600">No invoices found</p>
              <p className="text-xs text-stone-400 mt-1">
                Try selecting another filter or clearing your search.
              </p>
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoiceDetail(inv)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 hover:border-emerald-300 transition cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-stone-400 font-mono">
                      {inv.invoiceNo}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium">
                      {inv.type}
                    </span>
                  </div>
                  <StatusChip status={inv.status} />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-bold text-stone-900 group-hover:text-[#0B7A3B] transition-colors truncate">
                      {inv.farmerName}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium">{inv.farmerMobile}</p>
                    <p className="text-[11px] text-stone-400 font-mono">UTR: {inv.utrId}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-[#0B7A3B]">
                      ₹{inv.amount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-stone-400">{inv.date}</div>
                  </div>
                </div>

                {/* Quick actions row */}
                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#0B7A3B] flex items-center gap-1 group-hover:underline">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Receipt Proof</span>
                  </span>

                  {inv.status === 'PENDING' ? (
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => rejectInvoice(inv.id)}
                        className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold transition"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => approveInvoice(inv.id)}
                        className="px-3 py-1 rounded-lg bg-[#0B7A3B] text-white hover:bg-[#096330] text-[11px] font-semibold shadow-xs transition"
                      >
                        Approve
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal with Proof Image */}
      {selectedInvoiceDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-[390px] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {selectedInvoiceDetail.invoiceNo}
                </h3>
                <p className="text-xs text-stone-500">{selectedInvoiceDetail.type}</p>
              </div>
              <button
                onClick={() => setSelectedInvoiceDetail(null)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="bg-[#F7F9F6] rounded-2xl p-4 border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 font-medium">Farmer</span>
                  <span className="text-xs font-bold text-stone-900">
                    {selectedInvoiceDetail.farmerName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 font-medium">Mobile</span>
                  <span className="text-xs font-medium text-stone-800">
                    {selectedInvoiceDetail.farmerMobile}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 font-medium">Amount Received</span>
                  <span className="text-base font-extrabold text-[#0B7A3B]">
                    ₹{selectedInvoiceDetail.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 font-medium">UTR / Transaction ID</span>
                  <span className="text-xs font-mono font-bold text-stone-800">
                    {selectedInvoiceDetail.utrId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 font-medium">Status</span>
                  <StatusChip status={selectedInvoiceDetail.status} />
                </div>
              </div>

              {/* Uploaded Proof Preview */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">
                  Uploaded Payment Proof / UPI Receipt
                </label>
                <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 relative group">
                  <img
                    src={selectedInvoiceDetail.proofImage}
                    alt="Payment receipt proof"
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-[10px] flex items-center justify-between">
                    <span>Receipt Verified by Field Agent</span>
                    <span className="font-mono">{selectedInvoiceDetail.date}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-stone-100 bg-stone-50 flex items-center gap-2">
              {selectedInvoiceDetail.status === 'PENDING' ? (
                <>
                  <button
                    onClick={() => {
                      rejectInvoice(selectedInvoiceDetail.id);
                      setSelectedInvoiceDetail(null);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-rose-300 text-rose-700 font-semibold text-xs hover:bg-rose-50 transition"
                  >
                    Reject Payment
                  </button>
                  <button
                    onClick={() => {
                      approveInvoice(selectedInvoiceDetail.id);
                      setSelectedInvoiceDetail(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B7A3B] text-white font-semibold text-xs shadow-md hover:bg-[#096330] transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve & Activate</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedInvoiceDetail(null)}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-200 text-stone-700 font-semibold text-xs hover:bg-stone-300 transition"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
