import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NessieQueue } from './pages/NessieQueue';
import { CreateBatchPage } from './pages/CreateBatchPage';
import { SettingsPage } from './pages/SettingsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DocsPage } from './pages/DocsPage';
import { AppShell } from './components/nessie/AppShell';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes — no login required ── */}
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms"   element={<TermsPage />} />

        {/* ── Protected routes — login required ── */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/queue"     element={<NessieQueue />} />
          <Route path="/queue/new" element={<CreateBatchPage />} />
          <Route path="/settings"  element={<SettingsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/docs"      element={<DocsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/queue" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;