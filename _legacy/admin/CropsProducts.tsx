import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { Crop, Product } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Sprout, ShoppingBag, Plus, Edit2, Check, X } from 'lucide-react';

export const CropsProducts: React.FC = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'crops' | 'products'>('crops');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Edit / Add modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameEn, setNameEn] = useState<string>('');
  const [nameTe, setNameTe] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        supabase.from('crops').select('*').order('name_en'),
        supabase.from('products').select('*').order('name_en'),
      ]);
      if (cRes.data) setCrops(cRes.data as Crop[]);
      if (pRes.data) setProducts(pRes.data as Product[]);
    } catch (err) {
      console.error('Error loading catalog data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setNameEn('');
    setNameTe('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: Crop | Product) => {
    setEditingId(item.id);
    setNameEn(item.name_en);
    setNameTe(item.name_te);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameTe.trim()) return;
    setIsSubmitting(true);

    const tableName = activeTab === 'crops' ? 'crops' : 'products';

    try {
      if (editingId) {
        const { error } = await supabase
          .from(tableName)
          .update({ name_en: nameEn.trim(), name_te: nameTe.trim() })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert({ name_en: nameEn.trim(), name_te: nameTe.trim(), is_active: true });
        if (error) throw error;
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: Crop | Product) => {
    const tableName = activeTab === 'crops' ? 'crops' : 'products';
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ is_active: !item.is_active })
        .eq('id', item.id);
      if (error) throw error;
      await loadData();
    } catch (err: any) {
      alert('Toggle failed: ' + err.message);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading catalog data..." />;
  }

  const items = activeTab === 'crops' ? crops : products;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B5E20]">
            {t('nav.crops_products')}
          </h1>
          <p className="text-xs text-gray-600">Bilingual catalog management for field dropdowns</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-4 py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold rounded-xl shadow-xs text-sm min-h-[48px]"
        >
          <Plus className="w-5 h-5" />
          <span>{t('admin.add_new')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('crops')}
          className={`py-3 px-6 font-bold text-sm border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'crops'
              ? 'border-[#2E7D32] text-[#2E7D32]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>{t('admin.manage_crops')} ({crops.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-6 font-bold text-sm border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'products'
              ? 'border-[#2E7D32] text-[#2E7D32]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{t('admin.manage_products')} ({products.length})</span>
        </button>
      </div>

      {/* ITEMS LIST */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
        {items.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base text-gray-900">{item.name_en}</span>
                <span className="text-sm font-semibold text-[#1B5E20]">({item.name_te})</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {item.is_active ? t('admin.active') : t('admin.inactive')}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleOpenEdit(item)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center space-x-1 min-h-[40px]"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{t('admin.edit')}</span>
              </button>

              <button
                onClick={() => handleToggleActive(item)}
                className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center space-x-1 min-h-[40px] ${
                  item.is_active
                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                <span>{item.is_active ? t('admin.deactivate') : t('admin.activate')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              {editingId ? t('admin.edit') : t('admin.add_new')} {activeTab === 'crops' ? 'Crop' : 'Product'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {activeTab === 'crops' ? t('admin.crop_name_en') : t('admin.product_name_en')} *
                </label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Paddy"
                  className="w-full p-3 border rounded-xl text-sm min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {activeTab === 'crops' ? t('admin.crop_name_te') : t('admin.product_name_te')} *
                </label>
                <input
                  type="text"
                  required
                  value={nameTe}
                  onChange={(e) => setNameTe(e.target.value)}
                  placeholder="e.g. వరి"
                  className="w-full p-3 border rounded-xl text-sm min-h-[48px]"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
    </div>
  );
};
