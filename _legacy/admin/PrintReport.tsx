import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { VisitFull } from '../../types';
import { getSignedPhotoUrl } from '../../lib/image';
import { formatDateEn, formatTimeEn, formatStatusEn } from '../../lib/export';

export const PrintReport: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [visits, setVisits] = useState<VisitFull[]>([]);
  const [signedPhotoUrls, setSignedPhotoUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const mode = searchParams.get('mode') || 'summary';
  const agentId = searchParams.get('agent_id');
  const regionId = searchParams.get('region_id');
  const districtId = searchParams.get('district_id');
  const villageId = searchParams.get('village_id');
  const status = searchParams.get('status');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('visits_full')
          .select('*')
          .is('deleted_at', null)
          .order('visited_at', { ascending: false });

        if (agentId) query = query.eq('agent_id', agentId);
        if (regionId) query = query.eq('region_id', regionId);
        if (districtId) query = query.eq('district_id', districtId);
        if (villageId) query = query.eq('village_id', villageId);

        if (status === 'pending') query = query.eq('status', 'pending');
        if (status === 'purchased') query = query.eq('status', 'final');
        if (status === 'closed') query = query.eq('status', 'closed');

        if (startDate) query = query.gte('visited_at', `${startDate}T00:00:00.000Z`);
        if (endDate) query = query.lte('visited_at', `${endDate}T23:59:59.999Z`);

        const { data, error } = await query;
        if (error) throw error;
        const list = (data as VisitFull[]) || [];
        setVisits(list);

        // Fetch photo signed URLs if detailed mode
        if (mode === 'detailed') {
          const photoMap: Record<string, string> = {};
          await Promise.all(
            list.map(async (v) => {
              if (v.purchase_image_path) {
                const url = await getSignedPhotoUrl(v.purchase_image_path);
                if (url) photoMap[v.id] = url;
              }
            })
          );
          setSignedPhotoUrls(photoMap);
        }
      } catch (err) {
        console.error('Error fetching print report data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReportData();
  }, [agentId, regionId, districtId, villageId, status, startDate, endDate, mode]);

  useEffect(() => {
    if (!isLoading && visits.length > 0) {
      // Trigger print dialog automatically after render
      setTimeout(() => {
        window.print();
      }, 800);
    }
  }, [isLoading, visits]);

  if (isLoading) {
    return (
      <div className="p-8 text-center font-sans">
        <p className="text-gray-600 font-bold">Generating report preview...</p>
      </div>
    );
  }

  const generationTime = `${formatDateEn(new Date().toISOString())} ${formatTimeEn(new Date().toISOString())}`;

  return (
    <div className="p-6 font-sans text-gray-900 bg-white min-h-screen print:p-0">
      {/* PRINT STYLESHEET */}
      <style>{`
        @media print {
          @page {
            size: ${mode === 'summary' ? 'A4 landscape' : 'A4 portrait'};
            margin: 12mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
          }
        }
      `}</style>

      {/* NO-PRINT BAR */}
      <div className="no-print mb-6 p-4 bg-gray-100 rounded-xl flex items-center justify-between">
        <div>
          <span className="font-bold text-sm">Print Preview ({visits.length} records)</span>
          <p className="text-xs text-gray-500">Language forced to English for official archiving.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-[#2E7D32] text-white font-bold rounded-xl text-sm shadow-xs"
        >
          Print Now / Save as PDF
        </button>
      </div>

      {/* REPORT HEADER */}
      <header className="border-b-2 border-[#1B5E20] pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-[#1B5E20] uppercase tracking-wide">
              Shanmukha Agritech: Field Agent Visit Report
            </h1>
            <p className="text-xs text-gray-600 font-semibold mt-0.5">
              Generated on: {generationTime} (India Time IST)
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
              Total Records: {visits.length}
            </span>
          </div>
        </div>
      </header>

      {/* SUMMARY TABLE MODE */}
      {mode === 'summary' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-gray-800 uppercase font-bold border-b border-gray-300">
                <th className="p-2 border border-gray-300">Visit ID</th>
                <th className="p-2 border border-gray-300">Date & Time</th>
                <th className="p-2 border border-gray-300">Agent Name</th>
                <th className="p-2 border border-gray-300">Location (Village, District, Region)</th>
                <th className="p-2 border border-gray-300">Farmer Details</th>
                <th className="p-2 border border-gray-300">Crop</th>
                <th className="p-2 border border-gray-300">Diagnosis</th>
                <th className="p-2 border border-gray-300">Prescription</th>
                <th className="p-2 border border-gray-300">Product</th>
                <th className="p-2 border border-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v) => (
                <tr key={v.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-2 border border-gray-300 font-bold">
                    #{v.id.substring(0, 8)}
                  </td>
                  <td className="p-2 border border-gray-300">
                    {formatDateEn(v.visited_at)} {formatTimeEn(v.visited_at)}
                  </td>
                  <td className="p-2 border border-gray-300 font-semibold">
                    {v.agent_name || v.agent_username}
                  </td>
                  <td className="p-2 border border-gray-300">
                    {v.village_name}, {v.district_name}, {v.region_name}
                  </td>
                  <td className="p-2 border border-gray-300">
                    <span className="font-bold block">{v.farmer_name}</span>
                    {v.farmer_phone && <span className="text-[11px] text-gray-600">{v.farmer_phone}</span>}
                  </td>
                  <td className="p-2 border border-gray-300">
                    {v.crop_name_en || v.crop_other || 'None'}
                  </td>
                  <td className="p-2 border border-gray-300 max-w-xs truncate">
                    {v.diagnosis_en || v.diagnosis}
                  </td>
                  <td className="p-2 border border-gray-300 max-w-xs truncate">
                    {v.prescription_en || v.prescription}
                  </td>
                  <td className="p-2 border border-gray-300 font-semibold text-[#1B5E20]">
                    {v.product_name_en || v.product_other || 'None'}
                  </td>
                  <td className="p-2 border border-gray-300 font-bold">
                    {formatStatusEn(v.status)}
                    {v.purchase_amount && ` (₹${v.purchase_amount})`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* DETAILED MODE (1 Visit Per Block with Photo) */
        <div className="space-y-6">
          {visits.map((v) => (
            <div
              key={v.id}
              className="p-4 border border-gray-300 rounded-xl space-y-3 bg-white page-break"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-extrabold text-sm text-[#1B5E20]">
                  Visit ID: #{v.id.substring(0, 8)}
                </span>
                <span className="text-xs font-bold uppercase border px-2 py-0.5 rounded-md">
                  Status: {formatStatusEn(v.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-gray-500 block">Agent Name:</span>
                  <span className="font-semibold text-gray-900">{v.agent_name || v.agent_username}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block">Date & Time:</span>
                  <span className="font-semibold text-gray-900">
                    {formatDateEn(v.visited_at)} ({formatTimeEn(v.visited_at)})
                  </span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block">Location:</span>
                  <span className="font-semibold text-gray-900">
                    {v.village_name}, {v.district_name}, {v.region_name}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block">Farmer Details:</span>
                  <span className="font-semibold text-gray-900">
                    {v.farmer_name} {v.farmer_phone ? `(${v.farmer_phone})` : ''}
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-2 pt-2 border-t">
                <div>
                  <span className="font-bold text-gray-500 block">Crop:</span>
                  <span>{v.crop_name_en || v.crop_other || 'None'}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block">Diagnosis:</span>
                  <p className="p-2 bg-gray-50 rounded-lg">{v.diagnosis_en || v.diagnosis}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block">Prescription & Recommended Product:</span>
                  <p className="p-2 bg-green-50/50 rounded-lg">
                    {v.prescription_en || v.prescription}
                    <span className="block font-bold text-[#1B5E20] mt-1">
                      Product: {v.product_name_en || v.product_other || 'None'}
                    </span>
                  </p>
                </div>
              </div>

              {signedPhotoUrls[v.id] && (
                <div className="pt-2 border-t text-xs">
                  <span className="font-bold text-gray-500 block mb-1">Attached Purchase Photo:</span>
                  <img
                    src={signedPhotoUrls[v.id]}
                    alt="Purchase Photo"
                    className="h-40 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
