import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Garage from "./pages/Garage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";
import Tariff from "./pages/Tariff";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import ActiveRide from "./pages/ActiveRide";
import { getCurrentUser } from "@/lib/api";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/garage" element={<Garage />} />
          <Route path="/tariff" element={<Tariff />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/active-ride" element={<ActiveRide />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              (() => {
                const user = getCurrentUser();
                return user?.role === "superadmin" ? <SuperAdmin /> : <Dashboard />;
              })()
            }
          />
          <Route path="/admin" element={<Admin />} />
          <Route path="/superadmin" element={<SuperAdmin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
