import type { VisitFull } from '../types';

export interface ExportFilterParams {
  agentName?: string;
  regionName?: string;
  districtName?: string;
  villageName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const formatDateEn = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
};

export const formatTimeEn = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const strHours = String(hours).padStart(2, '0');
    return `${strHours}:${minutes} ${ampm}`;
  } catch {
    return '';
  }
};

export const formatStatusEn = (status: string): string => {
  switch (status) {
    case 'final':
      return 'Purchased';
    case 'closed':
      return 'Closed';
    case 'pending':
    default:
      return 'Pending';
  }
};

export interface ExportRow {
  'Visit ID': string;
  'Date': string;
  'Time': string;
  'Agent Name': string;
  'Region': string;
  'District': string;
  'Village': string;
  'Farmer Name': string;
  'Farmer Phone': string;
  'Crop': string;
  'Time Spent (min)': number;
  'Diagnosis': string;
  'Prescription': string;
  'Recommended Product': string;
  'Purchased': 'Yes' | 'No';
  'Purchase Amount (INR)': string;
  'Photo Attached': 'Yes' | 'No';
  'Status': string;
  'Finalized On': string;
}

export const mapVisitToExportRow = (v: VisitFull): ExportRow => {
  const cropName = v.crop_name_en || v.crop_other || 'None';
  const productName = v.product_name_en || v.product_other || 'None';
  const diagnosisText = v.diagnosis_en || v.diagnosis || '';
  const prescriptionText = v.prescription_en || v.prescription || '';

  return {
    'Visit ID': (v.id || '').substring(0, 8).toUpperCase(),
    'Date': formatDateEn(v.visited_at),
    'Time': formatTimeEn(v.visited_at),
    'Agent Name': v.agent_name || v.agent_username || '',
    'Region': v.region_name || '',
    'District': v.district_name || '',
    'Village': v.village_name || '',
    'Farmer Name': v.farmer_name || '',
    'Farmer Phone': v.farmer_phone || '',
    'Crop': cropName,
    'Time Spent (min)': v.duration_minutes || 0,
    'Diagnosis': diagnosisText,
    'Prescription': prescriptionText,
    'Recommended Product': productName,
    'Purchased': v.purchased ? 'Yes' : 'No',
    'Purchase Amount (INR)': v.purchase_amount ? `₹${v.purchase_amount}` : '',
    'Photo Attached': v.purchase_image_path ? 'Yes' : 'No',
    'Status': formatStatusEn(v.status),
    'Finalized On': formatDateEn(v.finalized_at),
  };
};

export const exportToExcel = async (visits: VisitFull[], fileName = 'Shanmukha_Field_Visits_Report') => {
  const XLSX = await import('xlsx');
  const rows = visits.map(mapVisitToExportRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Visits');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToCSV = async (visits: VisitFull[], fileName = 'Shanmukha_Field_Visits_Report') => {
  const XLSX = await import('xlsx');
  const rows = visits.map(mapVisitToExportRow);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
