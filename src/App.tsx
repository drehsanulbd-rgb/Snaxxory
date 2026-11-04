/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { LoginScreen } from './components/LoginScreen';
import { POSScreen } from './components/POS/POSScreen';
import { OrdersScreen } from './components/Orders/OrdersScreen';
import { ReportsScreen } from './components/Reports/ReportsScreen';
import { StockScreen } from './components/Stock/StockScreen';
import { CostingScreen } from './components/Costing/CostingScreen';
import { SettingsScreen } from './components/Settings/SettingsScreen';
import { ReceiptModal } from './components/ReceiptModal';
import { KitchenTicketModal } from './components/Modals/KitchenTicketModal';
import { PaymentModal } from './components/Modals/PaymentModal';
import { WhatsAppModal } from './components/Modals/WhatsAppModal';
import { OrderSuccessModal } from './components/Modals/OrderSuccessModal';
import { ToastContainer } from './components/Modals/ToastContainer';
import { AcceptanceTestModal } from './components/Modals/AcceptanceTestModal';

const MainAppContent: React.FC = () => {
  const { currentRole, activeTab } = useApp();
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // If not logged in, show the LoginScreen
  if (!currentRole) {
    return (
      <>
        <LoginScreen />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-stone-950 text-stone-100">
      {/* Top Header */}
      <Header onOpenTestModal={() => setIsTestModalOpen(true)} />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation (Sidebar on desktop, hidden on mobile) */}
        <Navigation />

        {/* Content Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden w-full relative">
          {activeTab === 'pos' && <POSScreen />}
          {activeTab === 'orders' && <OrdersScreen />}
          {activeTab === 'reports' && <ReportsScreen />}
          {activeTab === 'stock' && <StockScreen />}
          {activeTab === 'costing' && <CostingScreen />}
          {activeTab === 'settings' && <SettingsScreen />}
        </main>
      </div>

      {/* Global Modals */}
      <ReceiptModal />
      <KitchenTicketModal />
      <PaymentModal />
      <WhatsAppModal />
      <OrderSuccessModal />
      <ToastContainer />
      <AcceptanceTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
