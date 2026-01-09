import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RateLimitWarning } from "@/components/RateLimitWarning";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { SessionTimeoutProvider } from "@/components/SessionTimeoutProvider";
import { SentryTestButton } from "@/components/SentryTestButton";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
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
import ResetPassword from "./pages/ResetPassword";
import TestCoverage from "./pages/TestCoverage";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <QueryErrorBoundary>
        <AuthProvider>
          <SessionTimeoutProvider>
            <RateLimitWarning />
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <SentryTestButton />
            <BrowserRouter>
              <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/prompts" element={<ProtectedRoute><Prompts /></ProtectedRoute>} />
            <Route path="/prompts/:id" element={<ProtectedRoute><PromptDetail /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/models/compare" element={<ProtectedRoute><ModelComparison /></ProtectedRoute>} />
            <Route path="/models/batch" element={<ProtectedRoute><BatchTesting /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/scheduled-tests" element={<ProtectedRoute><ScheduledTests /></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
            <Route path="/api-usage" element={<ProtectedRoute><ApiUsage /></ProtectedRoute>} />
            <Route path="/api-docs" element={<ProtectedRoute><ApiDocs /></ProtectedRoute>} />
            <Route path="/security" element={<ProtectedRoute><SecurityDashboard /></ProtectedRoute>} />
            <Route path="/security/audit-log" element={<ProtectedRoute><SecurityAuditLog /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/api-keys" element={<ProtectedRoute><ApiKeys /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/deployment-metrics" element={<ProtectedRoute><DeploymentMetrics /></ProtectedRoute>} />
            <Route path="/test-coverage" element={<ProtectedRoute><TestCoverage /></ProtectedRoute>} />
            <Route path="/share/:token" element={<SharedTestRun />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </SessionTimeoutProvider>
        </AuthProvider>
      </QueryErrorBoundary>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
