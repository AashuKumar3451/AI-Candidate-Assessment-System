import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useJobs } from "@/context/JobsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon, BriefcaseIcon, CalendarIcon, UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import CVCard from "@/components/hr/CVCard";

const JobDetails = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { jobs, cvsByJob, fetchCVsForJob, isLoading } = useJobs();
  
  const job = jobs.find(j => j.id === jobId);
  const cvs = jobId ? cvsByJob[jobId] || [] : [];

  // Effect to fetch CVs when jobId changes
  useEffect(() => {
    if (jobId) {
      console.log('Fetching CVs for jobId:', jobId); // Debugging log
      fetchCVsForJob(jobId);
    }
  }, [jobId, fetchCVsForJob]);

  // Log for available CVs (useEffect for debugging)
  useEffect(() => {
    console.log('CVs available for this job:', cvs);
  }, [cvs]);

  // Handle case where the job isn't found
  if (!job) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/hr/dashboard")} className="mb-4">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <Card>
          <CardContent className="py-12 flex flex-col items-center">
            <div className="bg-muted rounded-full p-4 mb-4">
              <BriefcaseIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Job not found</h3>
            <p className="text-muted-foreground text-center mb-6">
              This job posting may have been removed or doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const postedDate = new Date(job.createdAt);
  const formattedDate = formatDistanceToNow(postedDate, { addSuffix: true });

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate("/hr/dashboard")} className="mb-4">
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      {/* Job Details */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{job.title}</CardTitle>
              <p className="text-muted-foreground">{job.company}</p>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <CalendarIcon className="h-4 w-4 mr-1" />
                <span>Posted {formattedDate}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="whitespace-pre-line">{job.description}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Location</h3>
              <p>{job.location}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Applications Section */}
      <h2 className="text-2xl font-bold mb-4">Applications</h2>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : cvs.length > 0 ? (
        <div className="grid gap-4">
          {Array.from(new Map(cvs.map(cv => [cv.id, cv])).values()).map((cv) => (
            <CVCard key={cv.id} cv={cv}  />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 flex flex-col items-center">
            <div className="bg-muted rounded-full p-4 mb-4">
              <UserIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No applications yet</h3>
            <p className="text-muted-foreground text-center">
              When candidates apply for this job, their CVs will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default JobDetails;
