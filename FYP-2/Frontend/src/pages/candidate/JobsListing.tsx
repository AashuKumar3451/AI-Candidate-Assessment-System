

import { useEffect, useState } from "react";
import { useJobs } from "@/context/JobsContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BriefcaseIcon, SearchIcon } from "lucide-react";
import JobCard from "@/components/candidate/JobCard";

const JobsListing = () => {
  const { jobs, fetchJobs, isLoading } = useJobs();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchJobs(); // use the one from context
  }, [fetchJobs]);

  const filteredJobs = jobs.filter(job =>
    (job.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Browse Job Opportunities</h1>

      {/* Search bar */}
      <div className="relative mb-8">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search job titles, companies, or keywords..."
          className="pl-10 pr-4"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Jobs list */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid gap-4">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 flex flex-col items-center">
            <div className="bg-muted rounded-full p-4 mb-4">
              <BriefcaseIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-lg font-medium mb-2">No matching jobs found</h3>
                <p className="text-muted-foreground text-center">
                  Try adjusting your search keywords or browse all available jobs.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">No jobs available yet</h3>
                <p className="text-muted-foreground text-center">
                  Check back soon for new job opportunities.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default JobsListing;
