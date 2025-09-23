import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { Loader } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_CONFIG } from "@/lib/config";
import { Test, TestSubmission } from "@/types/test";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
//import { Input } from "@/components/ui/input";

const TestPage = () => {
    const { candidateId, JID } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState<number | null>(null);

    // State for answers
    const [mcqAnswers, setMcqAnswers] = useState<string[]>([]);
    const [pseudocodeAnswers, setPseudocodeAnswers] = useState<string[]>([]);
    const [theoryAnswers, setTheoryAnswers] = useState<string[]>([]);

    // Fetch the test on mount
    useEffect(() => {
        if (user?.role !== 'candidate') {
            toast.error("Only candidates can take tests");
            navigate("/");
            return;
        }

        fetchTest();
    }, [candidateId, JID, user]);

    const fetchTest = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Authentication required");
                navigate("/auth");
                return;
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/test/show/${candidateId}/${JID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    toast.error("No access or test not available");
                    navigate("/");
                    return;
                }
                throw new Error(`Error: ${response.status}`);
            }

            const testData: Test = await response.json();
            setTest(testData);

            // Initialize answer arrays with empty strings
            setMcqAnswers(new Array(testData.test.mcqs.length).fill(''));
            setPseudocodeAnswers(new Array(testData.test.pseudocode.length).fill(''));
            setTheoryAnswers(new Array(testData.test.theory.length).fill(''));
        } catch (error) {
            toast.error("Failed to load test");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleMcqChange = (questionIndex: number, answer: string) => {
        const updatedAnswers = [...mcqAnswers];
        updatedAnswers[questionIndex] = answer;
        setMcqAnswers(updatedAnswers);
    };

    const handlePseudocodeChange = (questionIndex: number, answer: string) => {
        const updatedAnswers = [...pseudocodeAnswers];
        updatedAnswers[questionIndex] = answer;
        setPseudocodeAnswers(updatedAnswers);
    };

    const handleTheoryChange = (questionIndex: number, answer: string) => {
        const updatedAnswers = [...theoryAnswers];
        updatedAnswers[questionIndex] = answer;
        setTheoryAnswers(updatedAnswers);
    };

    const handleSubmit = async () => {
        // Validate that all questions are answered
        if (mcqAnswers.some(answer => !answer) ||
            pseudocodeAnswers.some(answer => !answer) ||
            theoryAnswers.some(answer => !answer)) {
            toast.error("Please answer all questions before submitting");
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error("Authentication required");
                navigate("/auth");
                return;
            }

            const submission: TestSubmission = {
                mcqs: mcqAnswers,
                pseudocode: pseudocodeAnswers,
                theory: theoryAnswers
            };

            const response = await fetch(`${API_CONFIG.BASE_URL}/test/submit/${candidateId}/${JID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submission)
            });

            if (!response.ok) {
                if (response.status === 403) {
                    toast.error("No access or test not available");
                    return;
                }
                if (response.status === 400) {
                    toast.error("Test already submitted");
                    setSubmitted(true);
                    return;
                }
                throw new Error(`Error: ${response.status}`);
            }

            const result = await response.json();
            setScore(result.finalScore || result.score);
            setSubmitted(true);
            toast.success("Test submitted successfully");








        } catch (error) {
            toast.error("Failed to submit test");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const downloadReport = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token || !JID) {
                toast.error("Authentication or Job ID missing");
                return;
            }

            const response = await fetch(`${API_CONFIG.BASE_URL}/test/my-report/${candidateId}/${JID}`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                toast.error("Failed to fetch report.");
                return;
            }

            const data = await response.json();
            const base64 = data.reportPdfBase64;

            const byteCharacters = atob(base64);
            const byteArray = new Uint8Array(
                [...byteCharacters].map(char => char.charCodeAt(0))
            );
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Test_Report_${JID}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            toast.error("Error downloading report");
        }
    };






    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="h-10 w-10 animate-spin text-brand-blue" />
            </div>
        );
    }

    if (!test) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <h1 className="text-2xl font-bold mb-4">Test Not Found</h1>
                <Button onClick={() => navigate("/")}>Return Home</Button>
            </div>
        );
    }



    return (
        <div className="container py-8 max-w-4xl mx-auto">
            <Card className="shadow-lg">
                <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-2xl">Candidate Assessment</CardTitle>
                    <CardDescription>
                        Answer all questions and submit when complete
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-8">
                    {/* MCQ Section */}
                    {test.test.mcqs.length > 0 && (
                        <section className="space-y-6">
                            <h2 className="text-xl font-semibold border-b pb-2">Multiple Choice Questions</h2>

                            {test.test.mcqs.map((mcq, index) => (
                                <div key={`mcq-${index}`} className="space-y-4 p-4 bg-gray-50 rounded-md">
                                    <h3 className="font-medium">{index + 1}. {mcq.question}</h3>

                                    <RadioGroup
                                        value={mcqAnswers[index]}
                                        onValueChange={(value) => handleMcqChange(index, value)}
                                        disabled={submitted}
                                    >
                                        <div className="space-y-2">
                                            {mcq.options.map((option, optIndex) => (
                                                <div key={`option-${index}-${optIndex}`} className="flex items-center space-x-2">
                                                    <RadioGroupItem
                                                        value={option}
                                                        id={`option-${index}-${optIndex}`}
                                                        disabled={submitted}
                                                    />
                                                    <label
                                                        htmlFor={`option-${index}-${optIndex}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {option}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </RadioGroup>
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Pseudocode Section */}
                    {test.test.pseudocode.length > 0 && (
                        <section className="space-y-6">
                            <h2 className="text-xl font-semibold border-b pb-2">Pseudocode Questions</h2>

                            {test.test.pseudocode.map((question, index) => (
                                <div key={`pseudocode-${index}`} className="space-y-4 p-4 bg-gray-50 rounded-md">
                                    <h3 className="font-medium">{index + 1}. {question}</h3>
                                    <Textarea
                                        placeholder="Write your pseudocode here..."
                                        rows={6}
                                        value={pseudocodeAnswers[index]}
                                        onChange={(e) => handlePseudocodeChange(index, e.target.value)}
                                        disabled={submitted}
                                        className="w-full"
                                    />
                                </div>
                            ))}
                        </section>
                    )}

                    {/* Theory Section */}
                    {test.test.theory.length > 0 && (
                        <section className="space-y-6">
                            <h2 className="text-xl font-semibold border-b pb-2">Theory Questions</h2>

                            {test.test.theory.map((question, index) => (
                                <div key={`theory-${index}`} className="space-y-4 p-4 bg-gray-50 rounded-md">
                                    <h3 className="font-medium">{index + 1}. {question}</h3>
                                    <Textarea
                                        placeholder="Write your answer here..."
                                        rows={6}
                                        value={theoryAnswers[index]}
                                        onChange={(e) => handleTheoryChange(index, e.target.value)}
                                        disabled={submitted}
                                        className="w-full"
                                    />
                                </div>
                            ))}
                        </section>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-4 bg-gray-50 border-t p-6">
          {submitted && score !== null && (
            <div className="w-full flex justify-between items-center bg-brand-blue-light/20 p-4 rounded-md">
              <p className="font-semibold">Your score: {score} / 10</p>
              <Button onClick={downloadReport}>Download Report</Button>
            </div>
          )}

                    <div className="w-full flex justify-end">
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || submitted}
                            className="px-8"
                        >
                            {submitting ? (
                                <>
                                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : "Submit Test"}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default TestPage;