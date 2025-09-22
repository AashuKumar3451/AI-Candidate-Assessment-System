
import { useState, useEffect } from "react";
import { Job } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, UploadIcon, CheckCircleIcon, ClockIcon, UserCheckIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useJobs } from "@/context/JobsContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";

interface JobCardProps {
  job: Job;
}

const JobCard = ({ job }: JobCardProps) => {
  const { uploadCV, applicationStatus, checkApplicationStatus } = useJobs();
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  
  const postedDate = new Date(job.createdAt);
  const formattedDate = formatDistanceToNow(postedDate, { addSuffix: true });
  
  const currentApplicationStatus = applicationStatus[job.id];
  
  // Check application status when component mounts
  useEffect(() => {
    const checkStatus = async () => {
      setIsCheckingStatus(true);
      try {
        await checkApplicationStatus(job.id);
      } catch (error) {
        console.error('Failed to check application status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    
    checkStatus();
  }, [job.id, checkApplicationStatus]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if the file is a PDF
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }
    
    setIsUploading(true);
    try {
      await uploadCV(job.id, selectedFile);
      setIsDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getApplicationStatusDisplay = () => {
    if (isCheckingStatus) {
      return {
        text: "Checking status...",
        icon: <ClockIcon className="h-4 w-4 mr-2" />,
        variant: "secondary" as const,
        disabled: true
      };
    }

    if (!currentApplicationStatus?.hasApplied) {
      return {
        text: "Upload CV",
        icon: <UploadIcon className="h-4 w-4 mr-2" />,
        variant: "default" as const,
        disabled: false
      };
    }

    // Application exists - show status based on selection
    if (currentApplicationStatus.isSelectedForInterview) {
      return {
        text: "Selected for Interview",
        icon: <UserCheckIcon className="h-4 w-4 mr-2" />,
        variant: "default" as const,
        disabled: true,
        className: "bg-green-100 text-green-800 hover:bg-green-100"
      };
    }

    if (currentApplicationStatus.isSelectedForTest) {
      return {
        text: "Selected for Test",
        icon: <CheckCircleIcon className="h-4 w-4 mr-2" />,
        variant: "default" as const,
        disabled: true,
        className: "bg-blue-100 text-blue-800 hover:bg-blue-100"
      };
    }

    // Applied but not selected yet
    return {
      text: "Application Submitted",
      icon: <CheckCircleIcon className="h-4 w-4 mr-2" />,
      variant: "secondary" as const,
      disabled: true,
      className: "bg-gray-100 text-gray-800 hover:bg-gray-100"
    };
  };

  const getApplicationStatusInfo = () => {
    if (!currentApplicationStatus?.hasApplied) return null;

    const appliedDate = currentApplicationStatus.appliedAt 
      ? formatDistanceToNow(new Date(currentApplicationStatus.appliedAt), { addSuffix: true })
      : null;

    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center text-sm text-gray-600 mb-1">
          <CheckCircleIcon className="h-4 w-4 mr-2 text-green-600" />
          <span className="font-medium">Application Status</span>
        </div>
        <div className="text-xs text-gray-500">
          Applied {appliedDate}
          {currentApplicationStatus.resumeScore && (
            <span className="ml-2">
              • Score: {currentApplicationStatus.resumeScore}%
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{job.title}</h3>
              <p className="text-muted-foreground text-sm mb-2">{job.company}</p>
              
              <div className="flex items-center text-xs text-muted-foreground mb-3">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span>Posted {formattedDate}</span>
              </div>
              
              <div className="mb-4">
                <p className="text-sm line-clamp-3">{job.description}</p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {job.requiredSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
              
              <div className="text-sm mb-4">
                <span className="font-medium">Location:</span> {job.location}
              </div>
              
              {getApplicationStatusInfo()}
              
              <Button 
                onClick={() => setIsDialogOpen(true)}
                disabled={getApplicationStatusDisplay().disabled}
                variant={getApplicationStatusDisplay().variant}
                className={getApplicationStatusDisplay().className}
              >
                {getApplicationStatusDisplay().icon}
                {getApplicationStatusDisplay().text}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentApplicationStatus?.hasApplied ? "Application Status" : "Upload your CV"}
            </DialogTitle>
            <DialogDescription>
              {currentApplicationStatus?.hasApplied 
                ? `You have already applied for ${job.title} at ${job.company}.`
                : `Apply for ${job.title} at ${job.company} by uploading your CV.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {currentApplicationStatus?.hasApplied ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-green-300 rounded-lg p-6 bg-green-50">
                <CheckCircleIcon className="h-8 w-8 text-green-600 mb-2" />
                <div className="text-center">
                  <p className="font-medium text-green-800 mb-2">Application Submitted Successfully!</p>
                  <div className="text-sm text-green-600 space-y-1">
                    {currentApplicationStatus.appliedAt && (
                      <p>Applied: {formatDistanceToNow(new Date(currentApplicationStatus.appliedAt), { addSuffix: true })}</p>
                    )}
                    {currentApplicationStatus.resumeScore && (
                      <p>Resume Score: {currentApplicationStatus.resumeScore}%</p>
                    )}
                    {currentApplicationStatus.isSelectedForTest && (
                      <p className="font-medium">✅ Selected for Test</p>
                    )}
                    {currentApplicationStatus.isSelectedForInterview && (
                      <p className="font-medium">✅ Selected for Interview</p>
                    )}
                    {!currentApplicationStatus.isSelectedForTest && !currentApplicationStatus.isSelectedForInterview && (
                      <p>Status: Under Review</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                <UploadIcon className="h-8 w-8 text-muted-foreground mb-2" />
                
                <div className="flex flex-col items-center text-center">
                  <label htmlFor="cv-upload" className="cursor-pointer text-brand-blue hover:underline">
                    Click to upload your CV
                  </label>
                  <input
                    id="cv-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-muted-foreground mt-1">PDF format only</p>
                </div>
                
                {selectedFile && (
                  <div className="mt-4 text-sm">
                    Selected: <span className="font-medium">{selectedFile.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {currentApplicationStatus?.hasApplied ? "Close" : "Cancel"}
            </Button>
            {!currentApplicationStatus?.hasApplied && (
              <Button onClick={handleSubmit} disabled={!selectedFile || isUploading}>
                {isUploading ? "Uploading..." : "Submit Application"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JobCard;
