import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Index from "./pages/Index";
import WorkDetail from "./pages/WorkDetail";
import Work from "./pages/Work";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Legal from "./pages/Legal";

const ConnectomeDemo = lazy(() => import("./pages/ConnectomeDemo"));
const KpsaDemo = lazy(() => import("./pages/KpsaDemo"));

const queryClient = new QueryClient();

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/work/" element={<Work />} />
          <Route
            path="/work/axosim-connectome-demo/"
            element={
              <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
                <ConnectomeDemo />
              </Suspense>
            }
          />
          <Route
            path="/work/kpsa-demo/"
            element={
              <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
                <KpsaDemo />
              </Suspense>
            }
          />
          <Route path="/work/:slug/" element={<WorkDetail />} />
          <Route path="/about/" element={<About />} />
          <Route path="/contact/" element={<Contact />} />
          <Route path="/legal/" element={<Legal />} />
          <Route path="/disclosure" element={<Navigate to="/legal/" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
