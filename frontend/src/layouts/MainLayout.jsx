/** Back-office shell with responsive navigation and authenticated user header. */
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
 
  Boxes,
  LayoutDashboard,
  MonitorSmartphone,
  Package,
  Settings,
  Tags,
  Truck,
  Users,
  BarChart3,
  Store,
} from 'lucide-react';

import Header from '../components/layout/Header.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import * as authService from '../services/authService.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { ROLES, ROUTES } from '../constants';

const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.POS, label: 'POS Terminal', icon: MonitorSmartphone },
  { to: ROUTES.PRODUCTS, label: 'Products', icon: Package },
  { to: ROUTES.CATALOG, label: 'Catalog settings', icon: Tags },
  { to: ROUTES.INVENTORY, label: 'Inventory', icon: Boxes },
  { to: ROUTES.SUPPLIERS, label: 'Suppliers', icon: Truck },
  { to: ROUTES.REPORTS, label: 'Reports', icon: BarChart3 },
  { to: ROUTES.STORES, label: 'Stores', icon: Store, roles: [ROLES.ADMIN] },
  { to: ROUTES.USERS, label: 'Users', icon: Users, roles: [ROLES.ADMIN] },
  { to: ROUTES.SETTINGS, label: 'Settings', icon: Settings, roles: [ROLES.ADMIN] },
];

const MainLayout = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true',
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role),
  );

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      navigate(ROUTES.LOGIN);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      localStorage.setItem('sidebar-collapsed', String(!collapsed));
      return !collapsed;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-app">
      <Sidebar
        items={visibleItems}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCollapse={toggleSidebar}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          user={user}
          onMenuClick={() => setMobileSidebarOpen(true)}
          onLogout={handleLogout}
        />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
