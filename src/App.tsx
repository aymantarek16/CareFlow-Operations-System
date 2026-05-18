import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const LoginPage = lazy(() => import("./pages/Login"));
const RegisterPage = lazy(() => import("./pages/Register"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPatients = lazy(() => import("./pages/admin/AdminPatients"));
const AdminPatientDetail = lazy(() => import("./pages/admin/AdminPatientDetail"));
const AdminDoctors = lazy(() => import("./pages/admin/AdminDoctors"));
const AdminDoctorDetail = lazy(() => import("./pages/admin/AdminDoctorDetail"));
const AdminStaff = lazy(() => import("./pages/admin/AdminStaff"));
const AdminAppointments = lazy(() => import("./pages/admin/AdminAppointments"));
const AdminAppointmentDetail = lazy(() => import("./pages/admin/AdminAppointmentDetail"));
const AdminInvoices = lazy(() => import("./pages/admin/AdminInvoices"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminActivity = lazy(() => import("./pages/admin/AdminActivity"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminDepartments = lazy(() => import("./pages/admin/AdminDepartments"));
const AdminBackup = lazy(() => import("./pages/admin/AdminBackup"));
const DoctorDashboard = lazy(() => import("./pages/doctor/DoctorDashboard"));
const DoctorAppointments = lazy(() => import("./pages/doctor/DoctorAppointments"));
const DoctorPatients = lazy(() => import("./pages/doctor/DoctorPatients"));
const DoctorRecords = lazy(() => import("./pages/doctor/DoctorRecords"));
const DoctorPrescriptions = lazy(() => import("./pages/doctor/DoctorPrescriptions"));
const PatientDashboard = lazy(() => import("./pages/patient/PatientDashboard"));
const PatientAppointments = lazy(() => import("./pages/patient/PatientAppointments"));
const PatientBookAppointment = lazy(() => import("./pages/patient/PatientBookAppointment"));
const PatientRecords = lazy(() => import("./pages/patient/PatientRecords"));
const PatientInvoices = lazy(() => import("./pages/patient/PatientInvoices"));
const PatientProfile = lazy(() => import("./pages/patient/PatientProfile"));
const ReceptionistDashboard = lazy(() => import("./pages/receptionist/ReceptionistDashboard"));
const ReceptionistPatients = lazy(() => import("./pages/receptionist/ReceptionistPatients"));
const ReceptionistAppointments = lazy(() => import("./pages/receptionist/ReceptionistAppointments"));
const ReceptionistCheckIn = lazy(() => import("./pages/receptionist/ReceptionistCheckIn"));
const ReceptionistBilling = lazy(() => import("./pages/receptionist/ReceptionistBilling"));
const Notifications = lazy(() => import("./pages/Notifications"));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
              <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />

              {/* Admin */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]}><DashboardLayout /></ProtectedRoute>}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/patients" element={<AdminPatients />} />
                <Route path="/admin/patients/:id" element={<AdminPatientDetail />} />
                <Route path="/admin/doctors" element={<AdminDoctors />} />
                <Route path="/admin/doctors/:id" element={<AdminDoctorDetail />} />
                <Route path="/admin/staff" element={<AdminStaff />} />
                <Route path="/admin/appointments" element={<AdminAppointments />} />
                <Route path="/admin/appointments/:id" element={<AdminAppointmentDetail />} />
                <Route path="/admin/invoices" element={<AdminInvoices />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/activity" element={<AdminActivity />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/departments" element={<AdminDepartments />} />
                <Route path="/admin/backup" element={<AdminBackup />} />
              </Route>

              {/* Doctor */}
              <Route element={<ProtectedRoute allowedRoles={["doctor"]}><DashboardLayout /></ProtectedRoute>}>
                <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                <Route path="/doctor/appointments" element={<DoctorAppointments />} />
                <Route path="/doctor/patients" element={<DoctorPatients />} />
                <Route path="/doctor/records" element={<DoctorRecords />} />
                <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
              </Route>

              {/* Patient */}
              <Route element={<ProtectedRoute allowedRoles={["patient"]}><DashboardLayout /></ProtectedRoute>}>
                <Route path="/patient/dashboard" element={<PatientDashboard />} />
                <Route path="/patient/appointments" element={<PatientAppointments />} />
                <Route path="/patient/book-appointment" element={<PatientBookAppointment />} />
                <Route path="/patient/records" element={<PatientRecords />} />
                <Route path="/patient/invoices" element={<PatientInvoices />} />
                <Route path="/patient/profile" element={<PatientProfile />} />
              </Route>

              {/* Receptionist */}
              <Route element={<ProtectedRoute allowedRoles={["receptionist"]}><DashboardLayout /></ProtectedRoute>}>
                <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
                <Route path="/receptionist/patients" element={<ReceptionistPatients />} />
                <Route path="/receptionist/appointments" element={<ReceptionistAppointments />} />
                <Route path="/receptionist/check-in" element={<ReceptionistCheckIn />} />
                <Route path="/receptionist/billing" element={<ReceptionistBilling />} />
              </Route>

              {/* Shared (all authenticated roles) */}
              <Route element={<ProtectedRoute allowedRoles={["admin", "doctor", "patient", "receptionist"]}><DashboardLayout /></ProtectedRoute>}>
                <Route path="/notifications" element={<Notifications />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
