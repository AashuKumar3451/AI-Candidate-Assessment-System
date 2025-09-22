export interface MCQQuestion {
  question: string;
  options: string[];
  answer?: string; // Only included in the response, not in the candidate view
}

export interface Test {
  candidate: string;
  test: {
    mcqs: MCQQuestion[];
    pseudocode: string[];
    theory: string[];
  };
}

export interface TestSubmission {
  mcqs: string[];
  pseudocode: string[];
  theory: string[];
}

export interface TestResult {
  score: number;
  message: string;
}