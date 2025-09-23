import { useState, useEffect } from "react";
import { CV } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, DownloadIcon, FileTextIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/sonner";
import { API_CONFIG } from "@/lib/config";
import { EmailService, EmailData } from "@/services/emailService";
import { useAuth } from "@/context/AuthContext";

interface CVCardProps {
  cv: CV;
}

const CVCard = ({ cv }: CVCardProps) => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [reportBase64, setReportBase64] = useState<string | null>(null);

  const uploadDate = new Date(cv.uploadedAt);
  const formattedDate = formatDistanceToNow(uploadDate, { addSuffix: true });

  const jobId = cv.jobId;
  const candidateId = cv.id;

  const disabled = sending || isSelected || isRejected;
  const [testScore, setTestScore] = useState<number | null>(null);

  useEffect(() => {
  setIsSelected(cv.isSelectedForTest ?? false);

  // You can use this logic if you *don't* have `isRejectedForTest`:
  setIsRejected(
    cv.isRejectedForTest ?? (
      cv.isSelectedForTest === false && cv.isSelectedForInterview === false
    )
  );
}, [cv]);





  // ✅ Fetch report if available
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem("token");
        const url = `${API_CONFIG.BASE_URL}/report/${candidateId}/${jobId}`;

        console.log("🔍 Fetching report from:", url);
        console.log("🪪 Using token:", token ? "[TOKEN PRESENT]" : "[NO TOKEN]");
        console.log("🧾 Candidate ID:", candidateId);
        console.log("📄 Job ID:", jobId);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("📡 Server responded with status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Report fetched successfully:", data);
          setReportBase64(data.reportPdfBase64);
          setTestScore(data.testScore ?? null);
        } else {
          const errorData = await response.json();
          console.warn("⚠️ Report fetch failed with message:", errorData.error);
          setReportBase64(null);
        }
      } catch (error) {
        console.error("❌ Network or unexpected error fetching report:", error);
        setReportBase64(null);
      }
    };

    if (candidateId && jobId) {
      fetchReport();
    } else {
      console.warn("❗ candidateId or jobId missing. Skipping fetch.");
    }
  }, [candidateId, jobId]);

  const handleDownload = () => {
    if (cv.resume && cv.resume.startsWith("data:")) {
      const fileType = cv.resume.match(/^data:(.+);base64,/)?.[1] || "application/pdf";
      const extension = fileType.split("/")[1] || "pdf";

      const link = document.createElement("a");
      link.href = cv.resume;
      link.download = `${cv.fileName || "CV"}.${extension}`;
      link.click();
    } else {
      toast.error("No valid CV file available to download.");
    }
  };

  const handleDownloadReport = () => {
    if (!reportBase64) return;
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${reportBase64}`;
    link.download = `${cv.candidateName || "Candidate"}_TestReport.pdf`;
    link.click();
  };

  const handleSelect = async () => {
    try {
      setSending(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/jd/select-resume/${jobId}/${candidateId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Selection failed");
      }

      setIsSelected(true);
      
      // Send test acceptance email using EmailJS
      const emailData: EmailData = {
        candidateName: cv.candidateName,
        candidateEmail: cv.candidateEmail || cv.candidateId, // Use candidateEmail if available, fallback to candidateId
        jobTitle: "Software Engineer", // You might want to get this from job data
        companyName: "Your Company", // You might want to get this from job data
        testLink: `https://ai-candidate-frontend.vercel.app/test/${candidateId}/${jobId}`, // Test link
        hrName: user?.name || "HR Team",
        hrEmail: user?.email || "hr@company.com",
      };

      const emailSent = await EmailService.sendTestAcceptanceEmail(emailData);
      
      if (emailSent) {
        toast.success("Candidate selected for test and email sent!");
      } else {
        toast.success("Candidate selected for test, but email failed to send.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to select candidate.");
    } finally {
      setSending(false);
    }
  };

  const handleReject = async () => {
    try {
      setSending(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/jd/reject-resume/${jobId}/${candidateId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Rejection failed");
      }

      const data = await response.json();
      setIsRejected(true);
      
      // Send test rejection email using EmailJS
      const emailData: EmailData = {
        candidateName: cv.candidateName,
        candidateEmail: cv.candidateEmail || cv.candidateId, // Use candidateEmail if available, fallback to candidateId
        jobTitle: "Software Engineer", // You might want to get this from job data
        companyName: "Your Company", // You might want to get this from job data
        hrName: user?.name || "HR Team",
        hrEmail: user?.email || "hr@company.com",
      };

      const emailSent = await EmailService.sendTestRejectionEmail(emailData);
      
      if (emailSent) {
        const message = data.wasPreviouslySelected 
          ? "Candidate rejected from test and email sent!" 
          : "Candidate rejected for test and email sent!";
        toast.success(message);
      } else {
        const message = data.wasPreviouslySelected 
          ? "Candidate rejected from test, but email failed to send." 
          : "Candidate rejected for test, but email failed to send.";
        toast.success(message);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to reject candidate.");
    } finally {
      setSending(false);
    }
  };

  const handleSelectForInterview = async () => {
  try {
    setSending(true);
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_CONFIG.BASE_URL}/report/select/${jobId}/${candidateId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Interview selection failed");
    }

    // Send interview acceptance email using EmailJS
    const emailData: EmailData = {
      candidateName: cv.candidateName,
      candidateEmail: cv.candidateEmail || cv.candidateId, // Use candidateEmail if available, fallback to candidateId
      jobTitle: "Software Engineer", // You might want to get this from job data
      companyName: "Your Company", // You might want to get this from job data
      interviewDate: "TBD", // You might want to get this from a form or API
      interviewTime: "TBD", // You might want to get this from a form or API
      hrName: user?.name || "HR Team",
      hrEmail: user?.email || "hr@company.com",
    };

    const emailSent = await EmailService.sendInterviewAcceptanceEmail(emailData);
    
    if (emailSent) {
      toast.success("Candidate selected for interview and email sent!");
    } else {
      toast.success("Candidate selected for interview, but email failed to send.");
    }
  } catch (error: any) {
    console.error("Interview selection error:", error);
    toast.error(error?.message || "Error selecting for interview");
  } finally {
    setSending(false);
  }
};

const handleRejectFromInterview = async () => {
  try {
    setSending(true);
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${API_CONFIG.BASE_URL}/report/reject/${jobId}/${candidateId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Interview rejection failed");
    }

    // Send interview rejection email using EmailJS
    const emailData: EmailData = {
      candidateName: cv.candidateName,
      candidateEmail: cv.candidateEmail || cv.candidateId, // Use candidateEmail if available, fallback to candidateId
      jobTitle: "Software Engineer", // You might want to get this from job data
      companyName: "Your Company", // You might want to get this from job data
      hrName: user?.name || "HR Team",
      hrEmail: user?.email || "hr@company.com",
    };

    const emailSent = await EmailService.sendInterviewRejectionEmail(emailData);
    
    if (emailSent) {
      const message = data.wasPreviouslySelected 
        ? "Candidate rejected from interview and email sent!" 
        : "Candidate rejected for interview and email sent!";
      toast.success(message);
    } else {
      const message = data.wasPreviouslySelected 
        ? "Candidate rejected from interview, but email failed to send." 
        : "Candidate rejected for interview, but email failed to send.";
      toast.success(message);
    }
  } catch (error: any) {
    console.error("Interview rejection error:", error);
    toast.error(error?.message || "Error rejecting from interview");
  } finally {
    setSending(false);
  }
};






  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Candidate Info */}
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white mr-2">
                {cv.candidateName?.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <h3 className="font-semibold">
                  {cv.candidateName || "Unnamed Candidate"}
                </h3>
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  <span>Uploaded {formattedDate}</span>
                </div>
                <div className="mt-1 space-x-1">
                  {isSelected && <Badge variant="default">Selected</Badge>}
                  {isRejected && <Badge variant="destructive">Rejected</Badge>}
                </div>
              </div>
            </div>

            {/* Match Score */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">Match Score</div>
                <div className="text-sm font-semibold">{cv.score ?? "N/A"}</div>
              </div>
            </div>

            {/* ✅ Show Download Report Button */}
            {reportBase64 && (
  <div className="mb-4">
    {/* Report Button & Score */}
    <div className="flex items-center space-x-4 mb-2">
      <Button variant="outline" size="sm" onClick={handleDownloadReport}>
        <FileTextIcon className="h-4 w-4 mr-2" />
        Download Test Report
      </Button>
      {testScore !== null && (
        <div className="text-sm text-muted-foreground">
          Test Score: <span className="font-semibold">{testScore}</span>
        </div>
      )}
    </div>

    {/* Interview Buttons */}
    <div className="space-x-2">
      <Button
        variant="default"
        size="sm"
        onClick={handleSelectForInterview}
        disabled={sending}
      >
        {sending ? "Selecting..." : "Select for Interview"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleRejectFromInterview}
        disabled={sending}
      >
        {sending ? "Rejecting..." : "Reject for Interview"}
      </Button>
    </div>
  </div>
)}

            {/* AI Notes */}
            {cv.notes && (
              <div className="mb-4">
                <div className="text-sm font-medium mb-1">AI Notes</div>
                <p className="text-sm text-muted-foreground">{cv.notes}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="ml-6 space-y-2 flex flex-col items-start">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              Download CV
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleSelect}
              disabled={disabled}
            >
              {isSelected
                ? "Selected"
                : sending
                  ? "Selecting..."
                  : "Select for Test"}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={disabled}
            >
              {isRejected
                ? "Rejected"
                : sending
                  ? "Rejecting..."
                  : "Reject"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CVCard;
