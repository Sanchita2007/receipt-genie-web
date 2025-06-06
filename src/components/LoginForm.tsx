import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { supabase } from '@/supabaseClient'; // Import Supabase client

interface LoginFormProps {
  role: 'admin' | 'student';
  onLogin: (role: 'admin' | 'student', email: string, userId: string) => void; // Added userId
}

const LoginForm = ({ role, onLogin }: LoginFormProps) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message || "Please enter valid credentials",
        variant: "destructive",
      });
    } else if (data.user) {
      toast({
        title: "Login Successful",
        description: `Welcome to the ${role} portal!`,
      });
      onLogin(role, data.user.email!, data.user.id); // Pass email and id
    } else {
      // Should not happen if no error and no user, but as a fallback
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDemoLogin = () => {
    // This only fills the form. Actual login must go through Supabase.
    // Ensure these demo users exist in your Supabase auth.users table.
    const demoCredentials = {
      email: role === 'admin' ? 'admin@example.com' : 'student@example.com', // Use placeholder emails
      password: 'password123' // Use a common demo password
    };
    
    setCredentials(demoCredentials);
    toast({
      title: "Demo Credentials Filled",
      description: "Click Sign In to attempt login. Ensure users exist in Supabase.",
    });
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${role}-email`}>
            {role === 'admin' ? 'Admin Email' : 'Student Email'}
          </Label>
          <Input
            id={`${role}-email`}
            type="email"
            placeholder={role === 'admin' ? 'admin@example.com' : 'your.email@example.com'}
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            className="w-full"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${role}-password`}>Password</Label>
          <div className="relative">
            <Input
              id={`${role}-password`}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full pr-10"
              required
              autoComplete="current-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            type="submit"
            className={`w-full ${
              role === 'admin' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Signing In...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </div>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleDemoLogin}
          >
            Fill Demo Credentials
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default LoginForm;