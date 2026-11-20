import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { PrintExportButtons } from '../../components/admin/PrintExportButtons';
import {
  ShoppingBag,
  Sparkles,
  TrendingUp,
  FileCheck,
  Eye,
  X,
  CreditCard,
  Download,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const SalesPage: React.FC = () => {
  const { filteredVisits } = useAdmin();

  // Aggregate sales by product
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  filteredVisits.forEach((v) => {
    v.productsSold.forEach((p) => {
      if (!productSalesMap[p.productName]) {
        productSalesMap[p.productName] = { name: p.productName, qty: 0, revenue: 0 };
      }
      productSalesMap[p.productName].qty += p.quantity;
      productSalesMap[p.productName].revenue += p.totalAmount;
    });
  });

  const productSalesList = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = productSalesList.reduce((acc, p) => acc + p.revenue, 0);
  const totalPacks = productSalesList.reduce((acc, p) => acc + p.qty, 0);

  // VAS uptake
  const vasCounts: Record<string, number> = {};
  filteredVisits.forEach((v) => {
    if (v.valueAddedService && v.valueAddedService !== 'None') {
      vasCounts[v.valueAddedService] = (vasCounts[v.valueAddedService] || 0) + 1;
    }
  });

  const vasList = Object.entries(vasCounts).map(([service, count]) => ({ service, count }));

  // Receipts gallery
  const receiptVisits = filteredVisits.filter((v) => v.photos.receiptPhoto);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const exportData = productSalesList.map((p) => ({
    Product: p.name,
    Units_Sold: p.qty,
    Total_Revenue_INR: p.revenue,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>Products & Value-Added Services Sales</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#0B7A3B]">
              ₹{totalRevenue.toLocaleString()} Total Revenue
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Monitor crop protection inputs, bio-stimulant adoption, VAS uptake & receipt verifications
          </p>
        </div>

        <PrintExportButtons data={exportData} filename="products-and-vas-sales" />
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">TOTAL SALES REVENUE</span>
          <div className="text-2xl font-black text-[#0B7A3B] mt-1">₹{totalRevenue.toLocaleString()}</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Across verified visit prescriptions</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">PACKS DISPATCHED</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{totalPacks} units</div>
          <p className="text-[11px] text-stone-500 mt-0.5">Delivered via associated dealer network</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">VAS UPTAKE SERVICES</span>
          <div className="text-2xl font-black text-[#E8731A] mt-1">
            {vasList.reduce((acc, v) => acc + v.count, 0)} services
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">Drone spraying, soil tests & pheromones</p>
        </div>
      </div>

      {/* Product Revenue Bar Chart */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-stone-900">Revenue Contribution by Product Line</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productSalesList}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#374151' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip
                formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                contentStyle={{ backgroundColor: '#1C1917', color: '#fff', borderRadius: '12px' }}
              />
              <Bar dataKey="revenue" fill="#0B7A3B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2-Columns: Products Table & VAS Uptake */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-stone-900">Product Sales Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="p-2.5">Product Name</th>
                  <th className="p-2.5">Units Sold</th>
                  <th className="p-2.5 text-right">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {productSalesList.map((p) => (
                  <tr key={p.name} className="hover:bg-stone-50">
                    <td className="p-2.5 font-bold text-stone-900">{p.name}</td>
                    <td className="p-2.5 text-stone-700">{p.qty} packs</td>
                    <td className="p-2.5 text-right font-black text-emerald-800">
                      ₹{p.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VAS Uptake (1 Col) */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-stone-900">Value-Added Services</h2>
          <div className="space-y-2">
            {vasList.map((vas) => (
              <div
                key={vas.service}
                className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs"
              >
                <span className="font-bold text-stone-800">{vas.service}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0B7A3B] font-bold text-[11px]">
                  {vas.count} completed
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Receipts Gallery */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-stone-900">Uploaded Farmer Input Receipts Gallery</h2>
          <p className="text-xs text-stone-400">Proof of purchase uploaded during farm visits</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {receiptVisits.slice(0, 12).map((v) => (
            <div
              key={v.id}
              onClick={() => setSelectedReceipt(v)}
              className="group cursor-pointer rounded-xl overflow-hidden border border-stone-200 bg-stone-100 relative aspect-square shadow-xs hover:border-[#0B7A3B] transition"
            >
              <img
                src={v.photos.receiptPhoto}
                alt="Receipt"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2 text-[9px] text-white">
                <span className="font-bold">{v.farmerName}</span>
                <span>₹{v.totalSaleAmount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Receipt Zoom Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-stone-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-stone-900">{selectedReceipt.farmerName}'s Receipt</h3>
                <p className="text-xs text-stone-500">Visit {selectedReceipt.id} · Amount: ₹{selectedReceipt.totalSaleAmount}</p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded-full text-stone-400 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-100">
              <img
                src={selectedReceipt.photos.receiptPhoto}
                alt="Receipt full"
                className="w-full h-64 object-cover"
              />
            </div>

            <div className="flex justify-between text-xs text-stone-600">
              <span>FA: {selectedReceipt.faName}</span>
              <span>Village: {selectedReceipt.village}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
