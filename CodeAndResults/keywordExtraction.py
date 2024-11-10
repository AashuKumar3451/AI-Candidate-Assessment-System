from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
import pandas as pd

# Load the processed file from Step 1
input_file = "all_resumes_combined_preprocessed.xlsx"
df = pd.read_excel(input_file)

# Fill NaN values with an empty string
df['Preprocessed_Content'] = df['Preprocessed_Content'].fillna("")

# Identify non-empty documents
non_empty_indices = df['Preprocessed_Content'] != ""
non_empty_documents = df.loc[non_empty_indices, 'Preprocessed_Content'].tolist()

# Apply TF-IDF on non-empty documents
tfidf = TfidfVectorizer(max_features=100)
tfidf_matrix = tfidf.fit_transform(non_empty_documents)

# Get feature names (words) and extract top keywords for each non-empty resume
feature_names = tfidf.get_feature_names_out()
top_keywords_per_resume = []

for row in tfidf_matrix:
    sorted_indices = np.argsort(row.toarray()).flatten()[::-1]
    top_keywords = [feature_names[i] for i in sorted_indices[:20]]
    top_keywords_per_resume.append(', '.join(top_keywords))

# Directly assign the top keywords to non-empty rows in the original DataFrame
df.loc[non_empty_indices, 'Top_Keywords'] = top_keywords_per_resume

# For empty documents, fill with "No keywords"
df['Top_Keywords'] = df['Top_Keywords'].fillna("No keywords")

# Sort the DataFrame alphabetically by the "Filename" column
df = df.sort_values(by="Filename").reset_index(drop=True)

# Save the results to a new Excel file
output_file = "all_resumes_with_tfidf_keywords.xlsx"
df[['Filename', 'Top_Keywords']].to_excel(output_file, index=False)

print("TF-IDF keyword extraction complete. Saved to", output_file)