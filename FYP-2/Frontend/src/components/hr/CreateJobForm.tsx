
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useJobs } from "@/context/JobsContext";

// Define the form schema
const formSchema = z.object({
  title: z.string().min(3, { message: "Job title must be at least 3 characters" }),
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  details: z.string().min(30, { message: "Description must be at least 30 characters" }),
  requiredSkills: z.string().min(3, { message: "Please list at least one required skill" }),
  location: z.string().min(2, { message: "Location must be at least 2 characters" }),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateJobFormProps {
  onSuccess: () => void;
}

const CreateJobForm = ({ onSuccess }: CreateJobFormProps) => {
  const { createJob, isLoading } = useJobs();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      companyName: "",
      details: "",
      requiredSkills: "",
      location: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    // Make sure all required fields are passed to createJob
    const formattedData = {
      title: data.title,
      companyName: data.companyName,
      details: data.details,
      requiredSkills: data.requiredSkills.split(',').map(skill => skill.trim()),
      location: data.location,
    };
    
    await createJob(formattedData);
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Frontend Developer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Tech Innovators Inc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the job position, responsibilities, and requirements..." 
                  rows={6}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="requiredSkills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Required Skills</FormLabel>
              <FormControl>
                <Input placeholder="e.g. React, TypeScript, CSS" {...field} />
              </FormControl>
              <FormDescription>Separate skills with commas</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Remote, New York, NY" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Post Job"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateJobForm;
