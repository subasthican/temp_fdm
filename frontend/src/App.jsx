/**
 * Route table. Back-office routes live under MainLayout (gated to
 * BACK_OFFICE_ROLES); the POS terminal lives under POSLayout (any
 * authenticated role). ConfirmDialogHost and the toaster are mounted
 * exactly once, here.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import POSLayout from './layouts/POSLayout.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';
import POSPage from './pages/pos/POSPage.jsx';
import RegisterSelectPage from './pages/pos/RegisterSelectPage.jsx';
import StoresPage from './pages/stores/StoresPage.jsx';
import UsersPage from './pages/users/UsersPage.jsx';
import CatalogPage from './pages/catalog/CatalogPage.jsx';
import ProductsPage from './pages/products/ProductsPage.jsx';
import ProductDetailPage from './pages/products/ProductDetailPage.jsx';
import InventoryPage from './pages/inventory/InventoryPage.jsx';
import { ConfirmDialogHost } from './components/ui';
import { BACK_OFFICE_ROLES, ROLES, ROUTES } from './constants';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<POSLayout />}>
            <Route path={ROUTES.POS} element={<POSPage />} />
            <Route
              path={ROUTES.SELECT_REGISTER}
              element={<RegisterSelectPage />}
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={BACK_OFFICE_ROLES} />}>
          <Route element={<MainLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
            <Route path={ROUTES.PRODUCT_DETAIL} element={<ProductDetailPage />} />
            <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
            <Route path={ROUTES.CATALOG} element={<CatalogPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route element={<MainLayout />}>
            <Route path={ROUTES.STORES} element={<StoresPage />} />
            <Route path={ROUTES.USERS} element={<UsersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>

      <ConfirmDialogHost />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
};

export default App;
