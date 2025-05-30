import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Shield, Upload, Mail, FileText, Users } from 'lucide-react';
import AdminDashboard from '@/components/AdminDashboard';
import StudentPortal from '@/components/StudentPortal';
import LoginForm from '@/components/LoginForm';

const Index = () => {
  const [userRole, setUserRole] = useState<'admin' | 'student' | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentEmail, setStudentEmail] = useState<string>('');

  const handleLogin = (role: 'admin' | 'student', email?: string) => {
    setUserRole(role);
    setIsLoggedIn(true);
    if (role === 'student' && email) {
      setStudentEmail(email);
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setIsLoggedIn(false);
    setStudentEmail('');
  };

  if (isLoggedIn && userRole) {
    return userRole === 'admin' ? (
      <AdminDashboard onLogout={handleLogout} />
    ) : (
      <StudentPortal onLogout={handleLogout} studentEmail={studentEmail} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Fee Receipt Generator</h1>
                <p className="text-sm text-gray-500">Automated Receipt Management System</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              v2.0 Live
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Fee Receipt Generator
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Streamline your fee receipt management with automated PDF generation, 
            bulk email distribution, and real-time progress tracking.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="p-2 bg-blue-100 rounded-lg w-fit">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-blue-900">Easy Upload</CardTitle>
              <CardDescription>
                Drag & drop Excel data and Word templates for instant processing
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="p-2 bg-green-100 rounded-lg w-fit">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-green-900">Bulk Generation</CardTitle>
              <CardDescription>
                Generate hundreds of personalized PDF receipts in minutes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="p-2 bg-purple-100 rounded-lg w-fit">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-purple-900">Auto Email</CardTitle>
              <CardDescription>
                Send receipts directly to students with delivery tracking
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Login Options */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Admin Login */}
            <Card className="border-blue-300 hover:border-blue-400 transition-colors">
              <CardHeader className="text-center">
                <div className="mx-auto p-3 bg-blue-600 rounded-full w-fit mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-blue-900">Admin Portal</CardTitle>
                <CardDescription>
                  Upload templates, generate receipts, and manage distributions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Admin Features:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Upload Excel & Word templates</li>
                      <li>• Real-time generation progress</li>
                      <li>• Bulk email distribution</li>
                      <li>• Receipt management & deletion</li>
                    </ul>
                  </div>
                  <LoginForm role="admin" onLogin={(role) => handleLogin(role)} />
                </div>
              </CardContent>
            </Card>

            {/* Student Login */}
            <Card className="border-green-300 hover:border-green-400 transition-colors">
              <CardHeader className="text-center">
                <div className="mx-auto p-3 bg-green-600 rounded-full w-fit mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-green-900">Student Portal</CardTitle>
                <CardDescription>
                  View and download your fee receipts securely
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Student Features:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• View receipt status</li>
                      <li>• Download PDF receipts</li>
                      <li>• Secure access control</li>
                      <li>• Mobile-friendly interface</li>
                    </ul>
                  </div>
                  <LoginForm role="student" onLogin={(role, email) => handleLogin(role, email)} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-2">System Requirements</h3>
            <p className="text-gray-600 text-sm">
              Supports .docx templates and .xlsx data files. Generates PDFs with automated email delivery. 
              Secure role-based access for administrators and students.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
