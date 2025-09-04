import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Team from "./pages/Team";
import Transfers from "./pages/Transfers";
import Gameweek from "./pages/Gameweek";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import Fixtures from "./pages/Fixtures"; // Import the new Fixtures page

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-pl-purple">
            <Routes>
              {/* --- Routes WITHOUT the Navbar --- */}
              <Route path="/" element={<Splash />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Login />} />

              {/* --- Routes WITH the Navbar (wrapped by MainLayout) --- */}
              <Route element={<MainLayout />}>
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/team"
                  element={
                    <ProtectedRoute>
                      <Team />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transfers"
                  element={
                    <ProtectedRoute>
                      <Transfers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/gameweek/:gw"
                  element={
                    <ProtectedRoute>
                      <Gameweek />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <Leaderboard />
                    </ProtectedRoute>
                  }
                />
                {/* --- ADDED FIXTURES ROUTE --- */}
                <Route
                  path="/fixtures"
                  element={
                    <ProtectedRoute>
                      <Fixtures />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* --- Catch-all Not Found Route --- */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

