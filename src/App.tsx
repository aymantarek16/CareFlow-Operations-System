import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import NotFound from "./pages/NotFound.tsx";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPatients from "./pages/admin/AdminPatients";
import AdminPatientDetail from "./pages/admin/AdminPatientDetail";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminStaff from "./pages/admin/AdminStaff.tsx";
import AdminDoctorDetail from "./pages/admin/AdminDoctorDetail";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminAppointmentDetail from "./pages/admin/AdminAppointmentDetail";
import AdminInvoices from "./pages/admin/AdminInvoices";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDepartments from "./pages/admin/AdminDepartments";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorRecords from "./pages/doctor/DoctorRecords";
import DoctorPrescriptions from "./pages/doctor/DoctorPrescriptions";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientBookAppointment from "./pages/patient/PatientBookAppointment";
import PatientRecords from "./pages/patient/PatientRecords";
import PatientInvoices from "./pages/patient/PatientInvoices";
import PatientProfile from "./pages/patient/PatientProfile";
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import ReceptionistPatients from "./pages/receptionist/ReceptionistPatients";
import ReceptionistAppointments from "./pages/receptionist/ReceptionistAppointments";
import ReceptionistCheckIn from "./pages/receptionist/ReceptionistCheckIn";
import ReceptionistBilling from "./pages/receptionist/ReceptionistBilling";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
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

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
