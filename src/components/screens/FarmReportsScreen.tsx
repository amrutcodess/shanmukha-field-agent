import React, { useState } from 'react';
import { useShanpoorna } from '../../context/ShanpoornaContext';
import { INITIAL_FARM_REPORTS, FarmReportDoc } from '../../mockData';
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  CheckCircle,
  Clock,
  X,
  FileCheck,
} from 'lucide-react';

export const FarmReportsScreen: React.FC = () => {
  const { activeFarmer, setCurrentScreen, showToast, t } = useShanpoorna();
  const [selectedDoc, setSelectedDoc] = useState<FarmReportDoc | null>(null);

  const serviceInvoices = INITIAL_FARM_REPORTS.filter(
    (r) => r.category === 'Service invoices'
  );
  const uploadedInvoices = INITIAL_FARM_REPORTS.filter(
    (r) => r.category === 'Invoices uploaded'
  );

  return (
    <div className="min-h-screen bg-[#F4F6F4] pb-24 text-stone-800">
      {/* Top Header */}
      <header className="bg-white px-4 pt-4 pb-3 border-b border-stone-200 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('FARMER_PROFILE')}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-stone-100 text-[#0B7A3B] transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-stone-900 leading-tight">
              {t.farmReports}
            </h1>
            <p className="text-[11px] text-stone-500">
              {activeFarmer.qa.farmerName} · Invoices & Diagnostic Documents
            </p>
          </div>
        </div>

        <button
          onClick={() => showToast('All documents synced with Shanmukha cloud', 'info')}
          className="text-xs font-semibold text-[#0B7A3B] px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200"
        >
          Cloud Sync
        </button>
      </header>

      <div className="p-4 space-y-5">
        {/* Section 1: Service Invoices */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Service Invoices & Certificates
            </h2>
            <span className="text-[10px] text-stone-400 font-medium">
              {serviceInvoices.length} Available
            </span>
          </div>

          <div className="space-y-2.5">
            {serviceInvoices.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 hover:border-emerald-300 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0B7A3B] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-stone-900 group-hover:text-[#0B7A3B] transition-colors truncate">
                      {doc.title}
                    </h3>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {doc.date} · {doc.amount} · Ref: {doc.docCode}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {doc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Invoices Uploaded */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Invoices Uploaded (Inputs & Seed)
            </h2>
            <span className="text-[10px] text-stone-400 font-medium">
              {uploadedInvoices.length} Bills
            </span>
          </div>

          <div className="space-y-2.5">
            {uploadedInvoices.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200/80 hover:border-amber-300 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E8731A] shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-stone-900 group-hover:text-[#E8731A] transition-colors truncate">
                      {doc.title}
                    </h3>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {doc.date} · {doc.amount} · Bill #{doc.docCode}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="text-[10px] font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                    {doc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-[380px] rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B7A3B] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">{selectedDoc.title}</h3>
                  <p className="text-[11px] text-stone-500">{selectedDoc.docCode}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 rounded-full text-stone-400 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Farmer:</span>
                <span className="font-bold text-stone-900">{activeFarmer.qa.farmerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Date Issued:</span>
                <span className="font-semibold text-stone-800">{selectedDoc.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Amount:</span>
                <span className="font-bold text-[#0B7A3B]">{selectedDoc.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Verification:</span>
                <span className="font-semibold text-emerald-800">{selectedDoc.status}</span>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 p-4 text-center bg-stone-100/60">
              <p className="text-[11px] text-stone-500 font-medium">
                Official Shanmukha Agritec digitally stamped certificate (2 pages PDF)
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  showToast(`Downloading ${selectedDoc.docCode}.pdf`, 'success');
                  setSelectedDoc(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B7A3B] text-white font-bold text-xs shadow-md hover:bg-[#096330] flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-600 font-semibold text-xs hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
