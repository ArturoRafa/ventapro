import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import { SnackbarProvider } from './context/SnackbarContext';
import ProtectedRoute from './components/ui/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import InventoryPage from './pages/InventoryPage';
import CustomersPage from './pages/CustomersPage';
import ConfigPage from './pages/ConfigPage';
import CashRegisterPage from './pages/CashRegisterPage';
import PosPage from './pages/PosPage';
import CreditsPage from './pages/CreditsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import SalesHistoryPage from './pages/SalesHistoryPage';

function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfigProvider>
          <SnackbarProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/pos" replace />} />
                <Route path="caja" element={<CashRegisterPage />} />
                <Route path="pos" element={<PosPage />} />
                <Route path="productos" element={<ProductsPage />} />
                <Route path="categorias" element={<CategoriesPage />} />
                <Route
                  path="inventario"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <InventoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="clientes" element={<CustomersPage />} />
                <Route path="creditos" element={<CreditsPage />} />
                <Route path="ventas" element={<SalesHistoryPage />} />
                <Route
                  path="reportes"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="configuracion"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ConfigPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="usuarios"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SnackbarProvider>
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
