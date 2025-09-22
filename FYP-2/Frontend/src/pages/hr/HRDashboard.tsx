
import { useState } from "react";
import { Link } from "react-router-dom";
import { useJobs } from "@/context/JobsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BriefcaseIcon, PlusIcon } from "lucide-react";
import JobListItem from "@/components/hr/JobListItem";
import CreateJobForm from "@/components/hr/CreateJobForm";

const HRDashboard = () => {
  const { jobs, isLoading } = useJobs();
  const [selectedTab, setSelectedTab] = useState("postedJobs");

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">HR Dashboard</h1>
        {selectedTab === "postedJobs" && (
          <Button onClick={() => setSelectedTab("postJob")}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Post New Job
          </Button>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="postedJobs">Posted Jobs</TabsTrigger>
          <TabsTrigger value="postJob">Post New Job</TabsTrigger>
        </TabsList>
        
        <TabsContent value="postedJobs">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <JobListItem key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 flex flex-col items-center">
                <div className="bg-muted rounded-full p-4 mb-4">
                  <BriefcaseIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No jobs posted yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Start by posting your first job opening to find the perfect candidates.
                </p>
                <Button onClick={() => setSelectedTab("postJob")}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Post New Job
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="postJob">
          <Card>
            <CardHeader>
              <CardTitle>Post a New Job</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateJobForm onSuccess={() => setSelectedTab("postedJobs")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HRDashboard;
