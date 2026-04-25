import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import CheckoutPage from './pages/CheckoutPage';
import TrackingPage from './pages/TrackingPage';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import LogiqBrain from './pages/LogiqBrain';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/:productId" element={<CheckoutPage />} />
            <Route path="/track" element={<TrackingPage />} />
            <Route path="/track/:orderId" element={<TrackingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<CustomerDashboard />} />
            </Route>

            <Route element={<ProtectedRoute roleRequired="ADMIN" />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/logiq" element={<LogiqBrain />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
