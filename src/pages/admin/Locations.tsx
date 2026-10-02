import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Region, District, Village } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ConfirmModal } from '../../components/ConfirmModal';
import {
  MapPin,
  ChevronDown,
  ChevronRight,
  Edit2,
  GitMerge,
  Eye,
  Plus,
} from 'lucide-react';

interface LocationTreeNode extends Region {
  districts: (District & {
    villages: (Village & { visit_count?: number })[];
    visit_count?: number;
  })[];
  visit_count?: number;
}

export const Locations: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [treeData, setTreeData] = useState<LocationTreeNode[]>([]);
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  const [expandedDistricts, setExpandedDistricts] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Rename Modal State
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [renameType, setRenameType] = useState<'region' | 'district' | 'village'>('village');
  const [renameId, setRenameId] = useState<string>('');
  const [renameValue, setRenameValue] = useState<string>('');

  // Merge Modal State
  const [showMergeModal, setShowMergeModal] = useState<boolean>(false);
  const [mergeType, setMergeType] = useState<'district' | 'village'>('village');
  const [sourceId, setSourceId] = useState<string>('');
  const [sourceName, setSourceName] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [availableTargets, setAvailableTargets] = useState<{ id: string; name: string }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadTreeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rRes, dRes, vRes, visitsRes] = await Promise.all([
        supabase.from('regions').select('*').order('name'),
        supabase.from('districts').select('*').order('name'),
        supabase.from('villages').select('*').order('name'),
        supabase.from('visits').select('village_id').is('deleted_at', null),
      ]);

      const regions = (rRes.data as Region[]) || [];
      const districts = (dRes.data as District[]) || [];
      const villages = (vRes.data as Village[]) || [];
      const visits = (visitsRes.data as { village_id: string }[]) || [];

      // Count visits per village
      const villageCounts = new Map<string, number>();
      visits.forEach((v) => {
        villageCounts.set(v.village_id, (villageCounts.get(v.village_id) || 0) + 1);
      });

      // Build hierarchy
      const tree: LocationTreeNode[] = regions.map((reg) => {
        let regionVisitSum = 0;

        const regDistricts = districts
          .filter((d) => d.region_id === reg.id)
          .map((dist) => {
            let distVisitSum = 0;

            const distVillages = villages
              .filter((v) => v.district_id === dist.id)
              .map((vil) => {
                const count = villageCounts.get(vil.id) || 0;
                distVisitSum += count;
                return { ...vil, visit_count: count };
              });

            regionVisitSum += distVisitSum;
            return { ...dist, villages: distVillages, visit_count: distVisitSum };
          });

        return { ...reg, districts: regDistricts, visit_count: regionVisitSum };
      });

      setTreeData(tree);
    } catch (err) {
      console.error('Error loading locations tree:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTreeData();
  }, [loadTreeData]);

  const toggleRegion = (id: string) => {
    setExpandedRegions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDistrict = (id: string) => {
    setExpandedDistricts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameId || !renameValue.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('admin_rename_location', {
        p_type: renameType,
        p_id: renameId,
        p_new_name: renameValue.trim(),
      });

      if (error) throw error;
      setShowRenameModal(false);
      await loadTreeData();
    } catch (err: any) {
      alert('Rename failed: ' + err.message);
    } fontally: {
      setIsSubmitting(false);
    }
  };

  const handleOpenMergeModal = (
    type: 'district' | 'village',
    id: string,
    name: string,
    parentId: string
  ) => {
    setMergeType(type);
    setSourceId(id);
    setSourceName(name);
    setTargetId('');

    // Filter available targets at the same parent level excluding self
    const targets: { id: string; name: string }[] = [];
    treeData.forEach((r) => {
      if (type === 'district' && r.id === parentId) {
        r.districts.forEach((d) => {
          if (d.id !== id) targets.push({ id: d.id, name: d.name });
        });
      } else if (type === 'village') {
        r.districts.forEach((d) => {
          if (d.id === parentId) {
            d.villages.forEach((v) => {
              if (v.id !== id) targets.push({ id: v.id, name: v.name });
            });
          }
        });
      }
    });

    setAvailableTargets(targets);
    setShowMergeModal(true);
  };

  const handleMergeSubmit = async () => {
    if (!sourceId || !targetId) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('admin_merge_location', {
        p_type: mergeType,
        p_source_id: sourceId,
        p_target_id: targetId,
      });

      if (error) throw error;
      setShowMergeModal(false);
      await loadTreeData();
    } catch (err: any) {
      alert('Merge failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Building location hierarchy..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">
            {t('admin.locations_tree')}
          </h1>
          <p className="text-xs text-gray-600">Region → District → Village structure & visit counts</p>
        </div>
      </div>

      {treeData.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
          <p className="text-gray-500 font-medium text-sm">{t('common.no_data')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
          {treeData.map((reg) => {
            const isRegExpanded = expandedRegions[reg.id];

            return (
              <div key={reg.id} className="p-4 space-y-2">
                {/* REGION ROW */}
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => toggleRegion(reg.id)}
                    className="flex items-center space-x-2 cursor-pointer font-extrabold text-base text-gray-900 hover:text-[#2E7D32]"
                  >
                    {isRegExpanded ? (
                      <ChevronDown className="w-5 h-5 text-[#2E7D32]" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <MapPin className="w-5 h-5 text-[#2E7D32]" />
                    <span>{reg.name}</span>
                    <span className="text-xs font-semibold bg-[#E8F5E9] text-[#1B5E20] px-2 py-0.5 rounded-full">
                      {reg.visit_count} visits
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => navigate(`/admin/locations/region/${reg.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold flex items-center min-h-[36px]"
                      title="View Visits"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => {
                        setRenameType('region');
                        setRenameId(reg.id);
                        setRenameValue(reg.name);
                        setShowRenameModal(true);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold flex items-center min-h-[36px]"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Rename
                    </button>
                  </div>
                </div>

                {/* DISTRICTS LIST */}
                {isRegExpanded && (
                  <div className="pl-6 border-l-2 border-green-200 space-y-2 pt-2">
                    {reg.districts.map((dist) => {
                      const isDistExpanded = expandedDistricts[dist.id];

                      return (
                        <div key={dist.id} className="space-y-2">
                          <div className="flex items-center justify-between bg-gray-50/70 p-2.5 rounded-xl">
                            <div
                              onClick={() => toggleDistrict(dist.id)}
                              className="flex items-center space-x-2 cursor-pointer font-bold text-sm text-gray-800 hover:text-[#2E7D32]"
                            >
                              {isDistExpanded ? (
                                <ChevronDown className="w-4 h-4 text-[#2E7D32]" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                              <span>District: {dist.name}</span>
                              <span className="text-[11px] font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                                {dist.visit_count} visits
                              </span>
                            </div>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => navigate(`/admin/locations/district/${dist.id}`)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold flex items-center"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setRenameType('district');
                                  setRenameId(dist.id);
                                  setRenameValue(dist.name);
                                  setShowRenameModal(true);
                                }}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-semibold flex items-center"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" />
                                Rename
                              </button>
                              <button
                                onClick={() =>
                                  handleOpenMergeModal('district', dist.id, dist.name, reg.id)
                                }
                                className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-semibold flex items-center"
                              >
                                <GitMerge className="w-3.5 h-3.5 mr-1" />
                                Merge
                              </button>
                            </div>
                          </div>

                          {/* VILLAGES LIST */}
                          {isDistExpanded && (
                            <div className="pl-6 border-l-2 border-gray-200 space-y-1">
                              {dist.villages.map((vil) => (
                                <div
                                  key={vil.id}
                                  className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded-lg text-xs"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-gray-900">
                                      Village: {vil.name}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-medium">
                                      ({vil.visit_count} visits)
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => navigate(`/admin/locations/village/${vil.id}`)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded-md font-semibold"
                                    >
                                      View
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRenameType('village');
                                        setRenameId(vil.id);
                                        setRenameValue(vil.name);
                                        setShowRenameModal(true);
                                      }}
                                      className="p-1 text-gray-600 hover:bg-gray-100 rounded-md font-semibold"
                                    >
                                      Rename
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleOpenMergeModal('village', vil.id, vil.name, dist.id)
                                      }
                                      className="p-1 text-amber-700 hover:bg-amber-50 rounded-md font-semibold"
                                    >
                                      Merge
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RENAME MODAL */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 capitalize">
              {t('admin.rename')} {renameType}
            </h3>

            <form onSubmit={handleRenameSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">New Name *</label>
                <input
                  type="text"
                  required
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full p-3 border rounded-xl text-sm min-h-[48px]"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl min-h-[48px]"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#2E7D32] text-white font-bold rounded-xl min-h-[48px]"
                >
                  {isSubmitting ? t('common.loading') : t('admin.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MERGE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={showMergeModal}
        title={t('admin.merge')}
        message={
          targetId
            ? t('admin.confirm_merge', {
                source: sourceName,
                target: availableTargets.find((t) => t.id === targetId)?.name || '',
              })
            : `Select target ${mergeType} to merge '${sourceName}' into:`
        }
        onConfirm={handleMergeSubmit}
        onCancel={() => setShowMergeModal(false)}
        isLoading={isSubmitting}
      />
    </div>
  );
};
