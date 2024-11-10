import pandas as pd
from sentence_transformers import SentenceTransformer, util

# Load job descriptions and resumes
job_descriptions_file = "../Datasets/Job_descriptions.xlsx"
tfidf_resumes_file = "all_resumes_with_tfidf_keywords.xlsx"

# Read the job descriptions
job_df = pd.read_excel(job_descriptions_file)
job_df = job_df[["Job ID", "Job Title", "Description", "Required Skills", "Experience", "Location"]]

# Read TF-IDF processed resumes
resume_df = pd.read_excel(tfidf_resumes_file)
resume_df = resume_df[["Filename", "Top_Keywords"]]

# Fill NaN values in 'Top_Keywords' with an empty string
resume_df['Top_Keywords'] = resume_df['Top_Keywords'].fillna("")

# Initialize SBERT model
sbert_model = SentenceTransformer("paraphrase-MPNet-base-v2")

# Function to generate SBERT embeddings
def get_sbert_embedding(text):
    return sbert_model.encode(text, convert_to_tensor=True)

# Generate embeddings for job descriptions (combine relevant fields)
job_descriptions_embeddings = []
for index, row in job_df.iterrows():
    combined_text = f"{row['Description']} Skills Required: {row['Required Skills']} Experience: {row['Experience']}"
    job_descriptions_embeddings.append(get_sbert_embedding(combined_text))

# Generate embeddings for resumes using top keywords
resume_embeddings = []
for keywords in resume_df["Top_Keywords"]:
    if isinstance(keywords, list):
        keywords = ' '.join(keywords)
    elif not isinstance(keywords, str):
        keywords = str(keywords)  # Ensure all entries are strings
    resume_embeddings.append(get_sbert_embedding(keywords))

# Calculate cosine similarity between each resume and each job description
for job_index, job_embedding in enumerate(job_descriptions_embeddings):
    similarities = []
    for resume_index, resume_embedding in enumerate(resume_embeddings):
        # Calculate similarity score using SBERT embeddings
        sbert_similarity = util.cos_sim(job_embedding, resume_embedding).item()

        # Collect resume details
        similarities.append({
            "Resume": resume_df["Filename"].iloc[resume_index],
            "Matched Keywords": resume_df["Top_Keywords"].iloc[resume_index],
            "Similarity Score": round(sbert_similarity, 3)
        })
    
    # Sort resumes by similarity in descending order
    sorted_similarities = sorted(similarities, key=lambda x: x["Similarity Score"], reverse=True)
    
    # Convert to DataFrame for this job description
    output_df = pd.DataFrame(sorted_similarities)
    
    # Save each job description's results to a separate file
    job_id = job_df["Job ID"].iloc[job_index]
    job_title = job_df["Job Title"].iloc[job_index]
    output_file = f"{job_id}_{job_title}_resumes_sorted_by_similarity.xlsx"
    output_df.to_excel(output_file, index=False)

    print(f"Saved resumes sorted by similarity for Job ID {job_id} to {output_file}")
