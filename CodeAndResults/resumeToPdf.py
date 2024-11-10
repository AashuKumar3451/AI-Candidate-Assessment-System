import os
import fitz  # PyMuPDF for reading PDF files
import pandas as pd

# Paths to the folders
input_folder = "../Resumes"  # Folder containing PDF resumes
output_file = "all_resumes_combined.xlsx"  # Combined Excel file

# List to store data for each resume
data = []

# Step 1: Loop through each PDF in the input folder
for filename in os.listdir(input_folder):
    if filename.endswith(".pdf"):
        pdf_path = os.path.join(input_folder, filename)

        # Step 2: Extract text from PDF
        with fitz.open(pdf_path) as pdf:
            text = ""
            for page in pdf:
                text += page.get_text() + "\n"

        # Append filename and content to data list
        data.append([filename, text])

# Step 3: Sort the data alphabetically by filename
data.sort(key=lambda x: x[0])

# Step 4: Create a DataFrame and save to a single Excel file
df = pd.DataFrame(data, columns=["Filename", "Content"])
df.to_excel(output_file, index=False)

print("All resumes have been combined into a single Excel file in alphabetical order.")