# Resume Matching with Job Descriptions Using SBERT and TF-IDF

This project aims to match resumes to job descriptions by leveraging **Sentence-BERT (SBERT)** embeddings and **TF-IDF** for keyword extraction. Each resume is scored for similarity with each job description, with results saved in a separate file per job description, ordered by relevance.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Project Structure](#project-structure)
6. [Output Files](#output-files)
7. [Contributing](#contributing)
8. [License](#license)

---

## Project Overview

The goal of this project is to identify the top matching resumes for given job descriptions using a combination of:
- **TF-IDF** to extract keywords from resumes.
- **SBERT** embeddings to calculate semantic similarity between job descriptions and resume content.

For each job description, a sorted list of resumes is generated based on similarity scores, making it easy to identify the best candidates.

---

## Features

- **Pdf To Excel Conversion**: Converts the resumes into a joint excel file for all resumes.
- **Preprocessing Of Resumes**: Removes stop words, add comma to separate keywords and adds an empty string for empty resumes.
- **TF-IDF Keyword Extraction**: Extracts the most relevant keywords from each resume.
- **SBERT Semantic Matching**: Calculates similarity between job descriptions and resumes to find the best fit.
- **Individual Output Files**: Each job description gets a separate output file with resumes ranked by relevance.
- **Keyword Matching Insights**: Each result includes the top keywords that matched, along with the similarity score.

---

## Installation

### Prerequisites

- Python 3.7+
- Required Python packages (see `CodeAndResults/libraries.txt`)

### Setup

1. Clone this repository:

    ```bash
    git clone clone AashuKumar3451/AI-Candidate-Assessment-System
    cd CodeAndResults
    ```

2. Install required packages:

    ```bash
    pip install -r CodeAndResults/libraries.txt
    ```

---

## Usage

1. **Prepare Raw Input Files**:
   - Place your raw job descriptions in an Excel file named `../Datasets/Job_descriptions.xlsx` with the following columns:
     - `Job ID`, `Job Title`, `Description`, `Required Skills`, `Experience`, `Location`
   - Place all resume PDFs in a designated folder `../Resumes`

2. **Run the Script**:

   - **Step 1**: Run the script to extract text from PDF resumes and save them in `all_resumes_combined.xlsx`:
     ```python
     python resumeToPdf.py
     ```
     This script will convert each PDF resume to text and save it in an Excel file for easy access.

   - **Step 2**: Run the preprocessing script to remove stopwords, and lemmatize each resume. The output will be saved as `all_resumes_combined_preprocessed.xlsx`:
     ```python
     python preproccessText.py
     ```

   - **Step 3**: Run the tf-idf script to apply TF-IDF to extract top keywords from each resume. The output will be saved as `all_resumes_with_tfidf_keywords.xlsx`:
     ```python
     python keywordExtraction.py
     ```

   - **Step 4**: Finally, run the main similarity matching script to compute the similarity between each job description and resume using SBERT. This will generate separate files for each job, listing the top-matching resumes in descending order of similarity:
     ```python
     python similarityUsingSBert.py
     ```

3. **View Output Files**:
   - Each job description will have its own Excel file in the output folder, showing resumes sorted by similarity score. Each file includes:
     - **Resume Filename**: The name of each matching resume.
     - **Matched Keywords**: The top keywords that match with the job description.
     - **Similarity Score**: A numerical score representing the relevance of each resume to the job.

---

## Project Structure

```
CodeAndResults/
├── resumeToPdf.py                         # Resume in pdf to convert it in excel
├── all_resumes_combined.xlsx              #Combination of resumes in excel form
├── preproscessText.py                     # Lemmatization and stop words exclusion code
├── all_resumes_combined_preprocessed.xlsx #Preprocessed resumes
├── keywordExtraction.py                   # Keyword extraction code through tf-idf
├── all_resumes_with_tfidf_keywords        #Keywords extraction output file
├── similarityUsingSBert                   # Finding similarity index through SBERT code
├── job_descriptions_file                  #Job descriptions files with ranking of resumes
├── libraries.txt                          # List of dependencies
Datasets
├── Job_descriptions.xlsx                  # Input file for job descriptions
Resumes
├── All Resumes (in pdf) 
Inspirations
├── Reasearch papers 
BasePaper.pdf                              #Base paper that we are following
FYP_Proposal_AI – Powered Candidate Assessment System.docx  #Project Proposal
FYP-1 Defense Presentation      #Project presentation
FYP.ipynb           #collab file for the project
planning.txt        #Project planning
Work On The Website.drawio.pdf      #System Architecture

```

---

## Output Files

For each job description, the script will create an output file with the format:
- `{Job ID}_{Job Title}_resumes_sorted_by_similarity.xlsx`

Each output file contains:
- **Resume**: The filename of the resume.
- **Matched Keywords**: The top keywords extracted via TF-IDF.
- **Similarity Score**: The SBERT similarity score between the resume and job description.

---

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/NewFeature`).
3. Commit your changes (`git commit -m 'Add some NewFeature'`).
4. Push to the branch (`git push origin feature/NewFeature`).
5. Open a pull request.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
