
import { Link } from "react-router-dom";
import { Job } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, EyeIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface JobListItemProps {
  job: Job;
}

const JobListItem = ({ job }: JobListItemProps) => {
  const postedDate = new Date(job.createdAt);
  const formattedDate = formatDistanceToNow(postedDate, { addSuffix: true });

  return (
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
              <p className="text-sm line-clamp-2">{job.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {job.requiredSkills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
            
            <div className="text-sm">
              <span className="font-medium">Location:</span> {job.location}
            </div>
          </div>
          
          <div>
            <Link to={`/hr/jobs/${job.id}`}>
              <Button variant="outline" size="sm">
                <EyeIcon className="h-4 w-4 mr-2" />
                View Applications
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobListItem;
