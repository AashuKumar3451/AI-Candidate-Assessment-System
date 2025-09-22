
import { useState } from "react";
import { Job } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, UploadIcon } from "lucide-react";
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
  const { uploadCV } = useJobs();
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const postedDate = new Date(job.createdAt);
  const formattedDate = formatDistanceToNow(postedDate, { addSuffix: true });
  
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
              
              <Button onClick={() => setIsDialogOpen(true)}>
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload CV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload your CV</DialogTitle>
            <DialogDescription>
              Apply for {job.title} at {job.company} by uploading your CV.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedFile || isUploading}>
              {isUploading ? "Uploading..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JobCard;
