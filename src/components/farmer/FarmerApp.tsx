import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { FarmerHeader } from './FarmerHeader';
import { FarmerBottomNav, FarmerTab } from './FarmerBottomNav';
import { WelcomeLoginScreen } from './screens/WelcomeLoginScreen';
import { FarmerSignUpScreen } from './screens/FarmerSignUpScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ServiceDetailScreen } from './screens/ServiceDetailScreen';
import { ConsentScreen } from './screens/ConsentScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { AlertsScreen } from './screens/AlertsScreen';
import { HelpScreen } from './screens/HelpScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SuccessModal } from '../common/SuccessModal';
import { VendorId, Farmer } from '../../types';

export const FarmerApp: React.FC = () => {
  const { isFarmerLoggedIn, activeFarmer } = useAuth();
  const { hasConsent } = useData();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<FarmerTab>('home');
  const [selectedVendorDetail, setSelectedVendorDetail] = useState<VendorId | null>(null);
  const [selectedVendorConsent, setSelectedVendorConsent] = useState<VendorId | null>(null);
  const [activeProgressVendor, setActiveProgressVendor] = useState<VendorId | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Sign-Up Onboarding state (when user clicks create account or enters unregistered mobile)
  const [isSigningUp, setIsSigningUp] = useState<boolean>(false);
  const [signUpInitialPhone, setSignUpInitialPhone] = useState<string>('');

  // Handlers
  const handleSelectVendor = (vendorId: VendorId) => {
    setIsProfileOpen(false);
    setSelectedVendorDetail(vendorId);
  };

  const handleStartService = () => {
    if (!selectedVendorDetail || !activeFarmer) return;
    const vendorId = selectedVendorDetail;
    if (hasConsent(activeFarmer.id, vendorId)) {
      setSelectedVendorDetail(null);
      setActiveProgressVendor(vendorId);
    } else {
      setSelectedVendorDetail(null);
      setSelectedVendorConsent(vendorId);
    }
  };

  const handleConsentAgreed = () => {
    if (!selectedVendorConsent) return;
    const vendorId = selectedVendorConsent;
    setSelectedVendorConsent(null);
    setActiveProgressVendor(vendorId);
  };

  const handleConsentDeclined = () => {
    setSelectedVendorConsent(null);
  };

  const handleViewReportFromProgress = (reportId: string) => {
    setActiveProgressVendor(null);
    setCurrentTab('reports');
    setSelectedReportId(reportId);
  };

  const handleTabChange = (tab: FarmerTab) => {
    setIsProfileOpen(false);
    setSelectedVendorDetail(null);
    setSelectedVendorConsent(null);
    setActiveProgressVendor(null);
    setSelectedReportId(null);
    setCurrentTab(tab);
  };

  const handleStartSignUp = (phone?: string) => {
    setSignUpInitialPhone(phone || '');
    setIsSigningUp(true);
  };

  const handleSignUpComplete = (_newFarmer: Farmer) => {
    setIsSigningUp(false);
    setCurrentTab('home');
  };

  // Farmer Content Switcher
  const renderFarmerContent = () => {
    if (isSigningUp) {
      return (
        <FarmerSignUpScreen
          initialPhone={signUpInitialPhone}
          onCancel={() => setIsSigningUp(false)}
          onComplete={handleSignUpComplete}
        />
      );
    }

    if (!isFarmerLoggedIn) {
      return <WelcomeLoginScreen onStartSignUp={handleStartSignUp} />;
    }

    if (isProfileOpen) {
      return <ProfileScreen onClose={() => setIsProfileOpen(false)} />;
    }

    if (activeProgressVendor) {
      return (
        <ProgressScreen
          vendorId={activeProgressVendor}
          onViewReport={handleViewReportFromProgress}
        />
      );
    }

    if (selectedVendorConsent) {
      return (
        <ConsentScreen
          vendorId={selectedVendorConsent}
          onConsentAgreed={handleConsentAgreed}
          onConsentDeclined={handleConsentDeclined}
        />
      );
    }

    if (selectedVendorDetail) {
      return (
        <ServiceDetailScreen
          vendorId={selectedVendorDetail}
          onBack={() => setSelectedVendorDetail(null)}
          onStartService={handleStartService}
          onViewReport={(repId) => {
            setSelectedVendorDetail(null);
            setCurrentTab('reports');
            setSelectedReportId(repId);
          }}
        />
      );
    }

    switch (currentTab) {
      case 'home':
        return <HomeScreen onSelectVendor={handleSelectVendor} />;
      case 'reports':
        return (
          <ReportsScreen
            selectedReportId={selectedReportId}
            onSelectReport={(id) => setSelectedReportId(id)}
          />
        );
      case 'alerts':
        return <AlertsScreen />;
      case 'help':
        return <HelpScreen />;
      default:
        return <HomeScreen onSelectVendor={handleSelectVendor} />;
    }
  };

  return (
    <div className="min-h-dvh w-full bg-gradient-to-b from-[#F6FAF5] to-[#E8F5E9] relative flex flex-col justify-start">
      {/* Background ambient radial blobs (fixed, subtle, 10-15% opacity) */}
      <div className="bg-ambient-blobs" aria-hidden="true" />

      {/* Main Responsive Column: On mobile edge-to-edge; on desktop max-width 480px centered without fake chrome */}
      <div className="w-full max-w-[480px] mx-auto min-h-dvh flex flex-col relative z-10 bg-transparent">
        {/* Header */}
        {isFarmerLoggedIn && !activeProgressVendor && !selectedVendorConsent && !isSigningUp && (
          <FarmerHeader
            onOpenProfile={() => setIsProfileOpen(true)}
            showProfileButton={!isProfileOpen}
          />
        )}

        {/* Single Page Scroll (no nested scroll areas) */}
        <main className="flex-1 w-full relative">
          {renderFarmerContent()}
        </main>

        {/* Bottom Floating Nav */}
        {isFarmerLoggedIn && !activeProgressVendor && !selectedVendorConsent && !selectedVendorDetail && !isProfileOpen && !isSigningUp && (
          <FarmerBottomNav
            currentTab={currentTab}
            onTabChange={handleTabChange}
          />
        )}
      </div>

      {/* Global Success Feedback Modal */}
      <SuccessModal />
    </div>
  );
};
