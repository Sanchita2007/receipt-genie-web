import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Linkedin, Mail, Code, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

  const developers = [
    {
      name: "Sanchita Jarare",
      role: "Developer",
      email: "jararesanchita@gmail.com",
      linkedin: "https://www.linkedin.com/in/sanchitajarare",
      skills: ["Python", "Java", "React"]
    },
    {
      name: "Anuraag B. Rathod",
      role: "Sr. Professor, AI & ML Dept.",
      email: "",
      linkedin: "",
      skills: []
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <h1 className="text-xl font-bold text-gray-900">About Us</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Project Overview */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Fee Receipt Generator</h2>
          <h3 className="text-lg text-gray-600 mb-4 italic">
            Vidyavardhini's Bhausaheb Vartak Polytechnic
          </h3>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A modern, automated solution for generating and managing fee receipts. 
            Built with cutting-edge technologies to streamline educational administration.
          </p>
        </div>

        {/* Project Details */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Technologies Used</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">Tailwind CSS</Badge>
                  <Badge variant="secondary">Node.js</Badge>
                  <Badge variant="secondary">Vite</Badge>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Bulk receipt generation from Excel data</li>
                  <li>• Automated email distribution</li>
                  <li>• Real-time progress tracking</li>
                  <li>• Receipt preview and download</li>
                  <li>• Role-based access control</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Development Team */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Meet Our Development Team
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {developers.map((dev, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">
                      {dev.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{dev.name}</CardTitle>
                  <Badge variant="outline">{dev.role}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dev.skills.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-sm mb-2">Skills</h5>
                        <div className="flex flex-wrap gap-1">
                          {dev.skills.map((skill, skillIndex) => (
                            <Badge key={skillIndex} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-center space-x-3">
                      {dev.email && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`mailto:${dev.email}`}>
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {dev.linkedin && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={dev.linkedin} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-4">
                <Heart className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-gray-700">Made with love for educational institutions</span>
              </div>
              <p className="text-gray-600 text-sm">
                This project is designed to simplify fee receipt management and improve 
                administrative efficiency in educational institutions.
              </p>
              <div className="mt-4">
                <Badge variant="secondary">Version 2.0</Badge>
                <Badge variant="secondary" className="ml-2">Open Source</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default About;
