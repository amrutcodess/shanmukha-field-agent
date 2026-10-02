import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';

// Agent Pages
import { NewVisit } from './pages/agent/NewVisit';
import { MyVisits } from './pages/agent/MyVisits';
import { VisitDetail as AgentVisitDetail } from './pages/agent/VisitDetail';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { Agents } from './pages/admin/Agents';
import { AgentDetail } from './pages/admin/AgentDetail';
import { Visits } from './pages/admin/Visits';
import { AdminVisitDetail } from './pages/admin/VisitDetail';
import { Locations } from './pages/admin/Locations';
import { RegionView } from './pages/admin/RegionView';
import { CropsProducts } from './pages/admin/CropsProducts';
import { ExportPrint } from './pages/admin/ExportPrint';
import { More } from './pages/admin/More';
import { PrintReport } from './pages/admin/PrintReport';

const AgentLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#E8F5E9]/40 flex flex-col font-sans">
      <Header />
      <main className="flex-1 p-2 sm:p-4 overflow-y-auto">
        <Routes>
          <Route path="new-visit" element={<NewVisit />} />
          <Route path="my-visits" element={<MyVisits />} />
          <Route path="visit/:id" element={<AgentVisitDetail />} />
          <Route path="*" element={<Navigate to="my-visits" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected Agent Routes */}
          <Route element={<ProtectedRoute requiredRole="agent" />}>
            <Route path="/agent/*" element={<AgentLayout />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="agents" element={<Agents />} />
              <Route path="agents/:id" element={<AgentDetail />} />
              <Route path="visits" element={<Visits />} />
              <Route path="visits/:id" element={<AdminVisitDetail />} />
              <Route path="locations" element={<Locations />} />
              <Route path="locations/:type/:id" element={<RegionView />} />
              <Route path="crops-products" element={<CropsProducts />} />
              <Route path="export" element={<ExportPrint />} />
              <Route path="more" element={<More />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>

            <Route path="/admin/print-report" element={<PrintReport />} />
          </Route>

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
