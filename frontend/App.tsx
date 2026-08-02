import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import SystemCheck from './pages/SystemCheck';
import FaceRegistration from './pages/FaceRegistration';
import FaceVerification from './pages/FaceVerification';
import Instructions from './pages/Instructions';
import LiveExam from './pages/LiveExam';
import ExamResult from './pages/ExamResult';
import BehaviourReport from './pages/BehaviourReport';
import ExamHistory from './pages/ExamHistory';

// Faculty Pages
import FacultyDashboard from './pages/FacultyDashboard';
import QuestionBank from './pages/QuestionBank';
import CreateExam from './pages/CreateExam';
import LiveMonitoring from './pages/LiveMonitoring';
import StudentReports from './pages/StudentReports';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import StudentsDirectory from './pages/StudentsDirectory';
import FacultyDirectory from './pages/FacultyDirectory';
import AISettings from './pages/AISettings';
import ViolationLogs from './pages/ViolationLogs';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="features" element={<Features />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Dashboard Routes (Student, Faculty, Admin sharing DashboardLayout) */}
        <Route path="/" element={<DashboardLayout />}>
          {/* Student Portal */}
          <Route path="student/dashboard" element={<StudentDashboard />} />
          <Route path="student/system-check" element={<SystemCheck />} />
          <Route path="student/face-registration" element={<FaceRegistration />} />
          <Route path="student/face-verification" element={<FaceVerification />} />
          <Route path="student/instructions" element={<Instructions />} />
          <Route path="student/live-exam" element={<LiveExam />} />
          <Route path="student/exam-result" element={<ExamResult />} />
          <Route path="student/report" element={<BehaviourReport />} />
          <Route path="student/history" element={<ExamHistory />} />

          {/* Faculty Portal */}
          <Route path="faculty/dashboard" element={<FacultyDashboard />} />
          <Route path="faculty/questions" element={<QuestionBank />} />
          <Route path="faculty/create-exam" element={<CreateExam />} />
          <Route path="faculty/live-monitoring" element={<LiveMonitoring />} />
          <Route path="faculty/student-reports" element={<StudentReports />} />

          {/* Admin Portal */}
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/students" element={<StudentsDirectory />} />
          <Route path="admin/faculty" element={<FacultyDirectory />} />
          <Route path="admin/ai-settings" element={<AISettings />} />
          <Route path="admin/violation-logs" element={<ViolationLogs />} />
          <Route path="admin/audit-logs" element={<AuditLogs />} />
          <Route path="admin/settings" element={<Settings />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
