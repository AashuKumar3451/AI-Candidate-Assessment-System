import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { BriefcaseIcon, SearchIcon, UploadIcon } from "lucide-react";
import { useAuth } from '@/context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();

  console.log("Landing Page - isAuthenticated:", isAuthenticated);
  console.log("Landing Page - user:", user);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-teal py-20">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            AI-Powered CV Classification for Modern Recruitment
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Connect the right talent with the right opportunities using advanced AI classification technology
          </p>

          {!isAuthenticated && (
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/auth?role=hr">
                <Button size="lg" className="bg-white text-brand-blue hover:bg-white/10">
                  Sign In as HR
                </Button>
              </Link>
              <Link to="/auth?role=candidate">
                <Button size="lg" variant="outline" className="border-white text-brand-blue hover:bg-white/10">
                  Sign In as Candidate
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full bg-brand-blue/10 w-12 h-12 flex items-center justify-center mb-4">
                  <BriefcaseIcon className="h-6 w-6 text-brand-blue" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Post Jobs</h3>
                <p className="text-gray-600">
                  HR professionals can create detailed job listings with required skills and qualifications.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full bg-brand-teal/10 w-12 h-12 flex items-center justify-center mb-4">
                  <UploadIcon className="h-6 w-6 text-brand-teal" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload CVs</h3>
                <p className="text-gray-600">
                  Candidates can browse jobs and upload their CVs for AI analysis and matching.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full bg-purple-100 w-12 h-12 flex items-center justify-center mb-4">
                  <SearchIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Matching</h3>
                <p className="text-gray-600">
                  Our AI system scores and classifies CVs, helping HR find the best candidates faster.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 py-16">
        <div className="container mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Streamline Your Recruitment Process?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join our platform today to experience the power of AI-based CV classification
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/auth">
              <Button size="lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
