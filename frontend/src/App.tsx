import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import ProductEditPage from "./pages/ProductEditPage";
import NewInvoicePage from "./pages/NewInvoicePage";
import ReportsPage from "./pages/ReportsPage";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceDetailsPage from "./pages/InvoiceDetailsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id/edit" element={<ProductEditPage />} />
          <Route path="/billing/new" element={<NewInvoicePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/history" element={<InvoicesPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
