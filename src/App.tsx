import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ShanpoornaProvider, useShanpoorna } from './context/ShanpoornaContext';
import { PhoneFrame } from './components/common/PhoneFrame';
import { BottomTabBar } from './components/navigation/BottomTabBar';
import { LoginScreen } from './components/screens/LoginScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { MyFarmersScreen } from './components/screens/MyFarmersScreen';
import { AddFarmerWizard } from './components/screens/AddFarmerWizard';
import { InvoiceApprovalScreen } from './components/screens/InvoiceApprovalScreen';
import { FarmerProfileScreen } from './components/screens/FarmerProfileScreen';
import { LogFieldVisitScreen } from './components/screens/LogFieldVisitScreen';
import { PreviousVisitsScreen } from './components/screens/PreviousVisitsScreen';
import { FarmReportsScreen } from './components/screens/FarmReportsScreen';
import { ResourcesTab } from './components/screens/ResourcesTab';
import { ProfileTab } from './components/screens/ProfileTab';
import { FarmerHomeScreen } from './components/screens/FarmerHomeScreen';
import { ToastContainer } from './components/common/ToastContainer';

// Admin Context & Layout
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';

// The 10 Core Head Office Admin Pages
import { FAManagement } from './pages/admin/FAManagement';
import { CommandCenter } from './pages/admin/CommandCenter';
import { FAPerformance } from './pages/admin/FAPerformance';
import { VisitExplorer } from './pages/admin/VisitExplorer';
import { AgronomyInsights } from './pages/admin/AgronomyInsights';
import { SalesPage } from './pages/admin/SalesPage';
import { LoyaltyPoints } from './pages/admin/LoyaltyPoints';
import { DataQualityFraud } from './pages/admin/DataQualityFraud';
import { BroadcastsPage } from './pages/admin/BroadcastsPage';
import { ReportsPage } from './pages/admin/ReportsPage';

// Mobile App Screen Renderer
const MobileAppContent: React.FC = () => {
  const { currentScreen, userRole } = useShanpoorna();

  const showBottomNav =
    userRole === 'FIELD_ASSISTANT' &&
    ['HOME', 'MY_FARMERS', 'RESOURCES', 'PROFILE'].includes(currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'LOGIN':
        return <LoginScreen />;
      case 'HOME':
        return <HomeScreen />;
      case 'MY_FARMERS':
        return <MyFarmersScreen />;
      case 'ADD_FARMER':
        return <AddFarmerWizard />;
      case 'INVOICE_APPROVAL':
        return <InvoiceApprovalScreen />;
      case 'FARMER_PROFILE':
        return <FarmerProfileScreen />;
      case 'LOG_FIELD_VISIT':
        return <LogFieldVisitScreen />;
      case 'PREVIOUS_VISITS':
        return <PreviousVisitsScreen />;
      case 'FARM_REPORTS':
        return <FarmReportsScreen />;
      case 'RESOURCES':
        return <ResourcesTab />;
      case 'PROFILE':
        return <ProfileTab />;
      case 'FARMER_HOME':
        return <FarmerHomeScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full relative">
      <ToastContainer />
      <div className="flex-1 overflow-y-auto scrollbar-none relative">
        {renderScreen()}
      </div>
      {showBottomNav && <BottomTabBar />}
    </div>
  );
};

// Mobile App Container with top switch banner for presentation
const MobileAppWrapper: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-2 sm:p-4">
      {/* Top Presentation Switcher Pill */}
      <div className="mb-3 z-50">
        <Link
          to="/admin/fas"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-all hover:scale-105"
        >
          <span>🖥️</span>
          <span>Switch to Head Office Admin Portal</span>
          <span className="text-[10px] bg-emerald-700/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Live
          </span>
        </Link>
      </div>

      <ShanpoornaProvider>
        <PhoneFrame>
          <MobileAppContent />
        </PhoneFrame>
      </ShanpoornaProvider>
    </div>
  );
};

// Route Guard for Admin Portal
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAdmin();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AdminProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Mobile App View (Default / Presentation Mobile View) */}
          <Route path="/" element={<MobileAppWrapper />} />
          <Route path="/mobile" element={<MobileAppWrapper />} />

          {/* 2. Admin Authentication */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* 3. Protected Head Office Admin Portal (The 10 Targeted Sections) */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            {/* Section 1: Field Assistant (FA) Management is FIRST */}
            <Route index element={<Navigate to="/admin/fas" replace />} />
            <Route path="fas" element={<FAManagement />} />

            {/* Section 2: Command Center Overview */}
            <Route path="command" element={<CommandCenter />} />

            {/* Section 3: FA Performance & Leaderboard (incorporates Farmers Master & Beat Reassignment) */}
            <Route path="performance" element={<FAPerformance />} />
            <Route path="farmers" element={<Navigate to="/admin/performance" replace />} />

            {/* Section 4: Visit Explorer & Verification */}
            <Route path="visits" element={<VisitExplorer />} />

            {/* Section 5: Agronomy Intelligence & Diagnostics */}
            <Route path="agronomy" element={<AgronomyInsights />} />

            {/* Section 6: Products & Value-Added Services Sales */}
            <Route path="sales" element={<SalesPage />} />

            {/* Section 7: Loyalty Points & Incentive Ledger */}
            <Route path="loyalty" element={<LoyaltyPoints />} />

            {/* Section 8: Data Quality, Anomaly & Vigilance Console */}
            <Route path="fraud" element={<DataQualityFraud />} />

            {/* Section 9: Field Broadcasts & Advisory Alerts */}
            <Route path="broadcasts" element={<BroadcastsPage />} />

            {/* Section 10: Executive Reports & Audits */}
            <Route path="reports" element={<ReportsPage />} />

            {/* Legacy redirect aliases */}
            <Route path="compliance" element={<Navigate to="/admin/performance" replace />} />
            <Route path="yields" element={<Navigate to="/admin/reports" replace />} />
            <Route path="consent" element={<Navigate to="/admin/performance" replace />} />
            <Route path="map" element={<Navigate to="/admin/command" replace />} />
            <Route path="audit" element={<Navigate to="/admin/reports" replace />} />
            <Route path="settings" element={<Navigate to="/admin/fas" replace />} />
          </Route>

          {/* 4. Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminProvider>
  );
}
