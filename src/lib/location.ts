import { supabase } from './supabase';
import { Region, District, Village } from '../types';

export const normalizeLocationName = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim().replace(/\s+/g, ' ');
  return trimmed
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export interface LocationIds {
  village_id: string;
  district_id: string;
  region_id: string;
}

export const getOrCreateLocationRPC = async (
  region: string,
  district: string,
  village: string
): Promise<LocationIds> => {
  const normReg = normalizeLocationName(region);
  const normDist = normalizeLocationName(district);
  const normVil = normalizeLocationName(village);

  const { data, error } = await supabase.rpc('get_or_create_location', {
    p_region: normReg,
    p_district: normDist,
    p_village: normVil,
  });

  if (error) {
    throw new Error(`Location creation error: ${error.message}`);
  }

  // data is returned as array of rows e.g. [{ village_id, district_id, region_id }]
  const result = Array.isArray(data) ? data[0] : data;
  if (!result || !result.village_id) {
    throw new Error('Failed to obtain village ID from location service');
  }

  return {
    village_id: result.village_id,
    district_id: result.district_id,
    region_id: result.region_id,
  };
};

export const fetchAllRegions = async (): Promise<Region[]> => {
  const { data, error } = await supabase.from('regions').select('*').order('name');
  if (error) throw error;
  return data || [];
};

export const fetchDistrictsByRegion = async (regionId?: string): Promise<District[]> => {
  let query = supabase.from('districts').select('*');
  if (regionId) {
    query = query.eq('region_id', regionId);
  }
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data || [];
};

export const fetchVillagesByDistrict = async (districtId?: string): Promise<Village[]> => {
  let query = supabase.from('villages').select('*');
  if (districtId) {
    query = query.eq('district_id', districtId);
  }
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data || [];
};
