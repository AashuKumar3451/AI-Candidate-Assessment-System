

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Job, CV } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/sonner';
import { API_CONFIG } from '@/lib/config';

interface JobsContextType {
  jobs: Job[];
  cvsByJob: Record<string, CV[]>;
  isLoading: boolean;
  createJob: (jobData: Omit<Job, 'id' | 'hrId' | 'createdAt'> & { companyName: string, details: string }) => Promise<void>;
  fetchJobs: () => Promise<void>;
  uploadCV: (jobId: string, file: File) => Promise<void>;
  fetchCVsForJob: (jobId: string) => Promise<void>;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

const API_BASE_URL = API_CONFIG.BASE_URL;

export const JobsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cvsByJob, setCvsByJob] = useState<Record<string, CV[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchJobs = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping fetchJobs');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping fetchJobs');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching jobs for user:', user.email, 'Role:', user.role);
      
      // Use different endpoints based on user role
      const endpoint = user.role === 'hr' ? '/jd/getJD' : '/jd/getAllJobs';
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch jobs:', response.status, errorText);
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched jobs data:', data);

      const transformedJobs: Job[] = data.map((job: any) => ({
        id: job._id || job.id,
        title: job.title || job.jobTitle,
        company: job.companyName || job.company || 'Company Name',
        description: job.details || job.jobDescription,
        requiredSkills: job.skills || [], 
        location: job.location || 'Remote',
        hrId: job.hrId || job.hrEmail,
        createdAt: job.createdAt || new Date().toISOString()
        
      }));

      setJobs(transformedJobs);
    } catch (error) {
      toast.error('Failed to fetch jobs.');
      console.error('fetchJobs error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchJobs();
    } else {
      setJobs([]);
      setCvsByJob({});
    }
  }, [user, fetchJobs]);

  const createJob = async (jobData: Omit<Job, 'id' | 'hrId' | 'createdAt'> & { companyName: string, details: string }) => {
    if (!user || user.role !== 'hr') {
      toast.error('Only HR users can create jobs.');
      return;
    }

    setIsLoading(true);
    try {
      const apiJobData = {
        hrEmail: user.email,
        title: jobData.title,
        details: jobData.details, 
        companyName: jobData.companyName,
        location: jobData.location,
        skills: jobData.requiredSkills,
      };

      //const response = await fetch(`${API_BASE_URL}/jd/addJD`, {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/jd/add-jd/form`, { 
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(apiJobData),
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      await fetchJobs();
      toast.success('Job created successfully!');
    } catch (error) {
      toast.error('Failed to create job.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };


/*
  const fetchCVsForJob = async (jobId: string) => {
    // Only HR users should be able to view CVs
    if (!user || user.role !== 'hr') {
      toast.error('Only HR users can view CVs.');
      return;
    }
  
    setIsLoading(true);  // Start loading spinner
    try {
      // Fetch CVs from the API
      const response = await fetch(`${API_BASE_URL}/jd/applications/${jobId}`, {
        headers: getAuthHeaders(),
      });
  
      // If the response is not OK, throw an error
      if (!response.ok) {
        throw new Error(`Failed to fetch CVs for job ${jobId}. Status: ${response.status}`);
      }
  
      // Parse the response as JSON
      const data = await response.json();
  
      // Log fetched data for debugging purposes
      console.log("Fetched candidates data:", data);
  
      // Ensure candidates exist in the response
      if (!data.candidates || !Array.isArray(data.candidates)) {
        throw new Error('Invalid data format: "candidates" array is missing or malformed.');
      }
  
      // Filter job candidates for the given jobId
      const filteredReports = data.candidates.filter((report: any) => 
        report.jobDescriptionAppliedFor === jobId
      );
  
      // Log filtered candidates for debugging
      console.log("Filtered reports for jobId:", jobId, filteredReports);
  
      // Transform filtered data into the expected CV format
      const transformedCVs: CV[] = filteredReports.map((report: any) => ({
        id: report._id || report.id || Math.random().toString(36).substring(2, 12),
        candidateId: report.candidateId || report.candidateEmail,
        candidateName: report.candidateName || "Unnamed",
        jobId: jobId,
        fileName: report.fileName || `${report.candidateName || "Candidate"}_CV.pdf`,
        uploadedAt: report.uploadedAt || new Date().toISOString(),
        score: report.cvScore || 0,
        classification: report.classification || report.skills || [],
        notes: report.notes || ''
      }));
  
      // Log the transformed CVs
      console.log("Transformed CVs:", transformedCVs);
  
      // Store the transformed CVs in the state
      setCvsByJob(prev => ({
        ...prev,
        [jobId]: transformedCVs,
      }));
  
    } catch (error) {
      // Log error and show a toast notification to the user
      console.error('Error fetching CVs:', error);
      toast.error('Failed to fetch CVs for this job.');
    } finally {
      // Stop the loading spinner regardless of success or failure
      setIsLoading(false);
    }
  };
  

*/


const fetchCVsForJob = useCallback(async (jobId: string) => {
  if (!user || user.role !== 'hr') {
  toast.error('Only HR users can view CVs.');
  return;
  }
  
  setIsLoading(true);
  
  setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jd/applications/${jobId}`, {
        headers: getAuthHeaders(),
      });

  if (!response.ok) {
    throw new Error(`Failed to fetch CVs for job ${jobId}. Status: ${response.status}`);
  }
  
  const data = await response.json();
  console.log("Fetched candidates data:", data);
  
  if (!data.candidates || !Array.isArray(data.candidates)) {
    throw new Error('Invalid data format: "candidates" array is missing or malformed.');
  }
  
  const filteredCandidates = data.candidates.filter((report: any) =>
    report.jobDescriptionAppliedFor === jobId
  );


const transformedCVs: CV[] = filteredCandidates.map((report: any) => ({
  id: report._id || report.id || Math.random().toString(36).substring(2, 12),
  candidateId: report._id, // Use the actual candidate ID
  candidateName: report.candidateName || (report.user?.name ?? "Unnamed"),
  candidateEmail: report.user?.email, // Extract email from user object
  jobId: jobId,
  fileName:
    report.fileName ||
    `${report.candidateName || report.user?.name || "Candidate"}_CV.pdf`,
  uploadedAt: report.uploadedAt || new Date().toISOString(),
  score: report.resumeScore || report.cvScore || 0,
  classification: report.classification || report.skills || [],
  notes: report.notes || '',
  resume: report.resume || null,
  isSelectedForTest: report.isSelectedForTest || false,
  isSelectedForInterview: report.isSelectedForInterview || false,
  isRejectedForTest: report.isRejectedForTest || false,
}))

.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)); // ⬅️ Sort by score descending








  setCvsByJob((prev) => {
    const existing = prev[jobId];
    const isSame = JSON.stringify(existing) === JSON.stringify(transformedCVs);
    if (isSame) return prev;
    return {
      ...prev,
      [jobId]: transformedCVs,
    };
  });

} catch (error: any) {
  console.error('Error fetching CVs:', error);
  toast.error('Failed to fetch CVs for this job.');
  } finally {
  setIsLoading(false);
  }
  }, [user]);





  /*
  const fetchCVsForJob = async (jobId: string) => {
    if (!user || user.role !== 'hr') {
      toast.error('Only HR users can view CVs.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jd/applications/${jobId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CVs');
      }

     // const data = await response.json();

      //const jobReports = data.filter((report: any) =>
       // report.jobId === jobId || report.jobTitle === jobs.find(j => j.id === jobId)?.title
      const data = await response.json();
      const jobReports = data.candidates || []; // Access the correct array

      // Optional: Filter if needed
      const filteredReports = jobReports.filter((report: any) =>
      report.jobDescriptionAppliedFor === jobId   
    
    );

    const transformedCVs: CV[] = filteredReports.map((report: any) => ({
      id: report._id || report.id || Math.random().toString(36).substring(2, 12),
      candidateId: report.candidateId || report.candidateEmail,
      candidateName: report.candidateName || "Unnamed",
      jobId: jobId,
      fileName: report.fileName || `${report.candidateName || "Candidate"}_CV.pdf`,
      uploadedAt: report.uploadedAt || new Date().toISOString(),
      score: report.cvScore || 0,
      classification: report.classification || report.skills || [],
      notes: report.notes || ''
    }));
    

    /*
      const transformedCVs: CV[] = jobReports.map((report: any) => ({
        id: report._id || report.id || Math.random().toString(36).substring(2, 12),
        candidateId: report.candidateId || report.candidateEmail,
        candidateName: report.candidateName,
        jobId: jobId,
        fileName: report.fileName || `${report.candidateName}_CV.pdf`,
        uploadedAt: report.uploadedAt || new Date().toISOString(),
        score: report.cvScore || 0,
        classification: report.classification || report.skills || [],
        notes: report.notes || ''
      }));
  
*/

    /*
    const transformedCVs: CV[] = filteredReports.map((report: any) => ({
  id: report._id || report.id || Math.random().toString(36).substring(2, 12),
  candidateId: report.candidateId || report.candidateEmail,
  candidateName: report.candidateName || "Unnamed",
  jobId: jobId,
  fileName: report.fileName || `${report.candidateName || "Candidate"}_CV.pdf`,
  uploadedAt: report.uploadedAt || new Date().toISOString(),
  score: report.cvScore || 0,
  classification: report.classification || report.skills || [],
  notes: report.notes || ''
}));


      setCvsByJob(prev => ({
        ...prev,
        [jobId]: transformedCVs
      }));
    } catch (error) {
      toast.error('Failed to fetch CVs for this job.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

*/


  /*
  const uploadCV = async (jobId: string, file: File) => {
    if (!user || user.role !== 'candidate') {
      toast.error('Only candidates can upload CVs.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      //formData.append('jobId', jobId);
      //formData.append('candidateEmail', user.email);
      formData.append('coverLetter', '');


      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/jd/apply/${jobId}`, {
      
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload CV');
      }

      toast.success('CV uploaded successfully! It will be processed by our AI system.');
    } catch (error) {
      toast.error('Failed to upload CV.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
*/

const uploadCV = async (jobId: string, file: File) => {
  if (!user || user.role !== 'candidate') {
    toast.error('Only candidates can upload CVs.');
    return;
  }

  setIsLoading(true);
  try {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('coverLetter', '');

    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/jd/apply/${jobId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();

      if (errorText.includes("already applied")) {
        toast.warning('You have already applied for this job.');
      } else {
        toast.error('Failed to upload CV.');
      }

      throw new Error(errorText);
    }

    toast.success('CV uploaded successfully! It will be processed by our AI system.');
  } catch (error) {
    console.error('CV Upload Error:', error);
  } finally {
    setIsLoading(false);
  }
};




  return (
    <JobsContext.Provider value={{
      jobs,
      cvsByJob,
      isLoading,
      createJob,
      fetchJobs,
      uploadCV,
      fetchCVsForJob
    }}>
      {children}
    </JobsContext.Provider>
  );
};

export const useJobs = () => {
  const context = useContext(JobsContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobsProvider');
  }
  return context;
};
