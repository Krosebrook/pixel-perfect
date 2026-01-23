import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { SentryTestButton } from "@/components/SentryTestButton";
import Index from "./pages/Index";
import Prompts from "./pages/Prompts";
import PromptDetail from "./pages/PromptDetail";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import ModelComparison from "./pages/ModelComparison";
import BatchTesting from "./pages/BatchTesting";
import SharedTestRun from "./pages/SharedTestRun";
import Templates from "./pages/Templates";
import Leaderboard from "./pages/Leaderboard";
import ScheduledTests from "./pages/ScheduledTests";
import Teams from "./pages/Teams";
import ApiUsage from "./pages/ApiUsage";
import ApiDocs from "./pages/ApiDocs";
import SecurityDashboard from "./pages/SecurityDashboard";
import SecurityAuditLog from "./pages/SecurityAuditLog";
import Analytics from "./pages/Analytics";
import ApiKeys from "./pages/ApiKeys";
import Settings from "./pages/Settings";
import DeploymentMetrics from "./pages/DeploymentMetrics";
import TestCoverage from "./pages/TestCoverage";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <QueryErrorBoundary>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SentryTestButton />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/prompts" element={<Prompts />} />
              <Route path="/prompts/:id" element={<PromptDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/models/compare" element={<ModelComparison />} />
              <Route path="/models/batch" element={<BatchTesting />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/scheduled-tests" element={<ScheduledTests />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/api-usage" element={<ApiUsage />} />
              <Route path="/api-docs" element={<ApiDocs />} />
              <Route path="/security" element={<SecurityDashboard />} />
              <Route path="/security/audit-log" element={<SecurityAuditLog />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/api-keys" element={<ApiKeys />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/deployment-metrics" element={<DeploymentMetrics />} />
              <Route path="/test-coverage" element={<TestCoverage />} />
              <Route path="/share/:token" element={<SharedTestRun />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsentBanner />
          </BrowserRouter>
        </TooltipProvider>
      </QueryErrorBoundary>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
