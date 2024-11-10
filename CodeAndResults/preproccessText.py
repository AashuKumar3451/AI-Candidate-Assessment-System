import pandas as pd
import nltk
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

# Initialize the lemmatizer and stop words
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

# Load the input Excel file
input_file = "all_resumes_combined.xlsx"
output_file = "all_resumes_combined_preprocessed.xlsx"

# Read the Excel file into a DataFrame
df = pd.read_excel(input_file)

# Define a function to lemmatize text and add commas between words
def preprocess_text(text):
    # Tokenize the text into words
    words = word_tokenize(text)
    # Lemmatize each word
    lemmatized_words = [lemmatizer.lemmatize(word) for word in words]
    filtered_words = [word.lower() for word in lemmatized_words if word.lower() not in stop_words]
    # Join the lemmatized words with commas
    return ', '.join(filtered_words)

# Apply lemmatization to the "Content" column
df['Preprocessed_Content'] = df['Content'].apply(preprocess_text)

# Sort the DataFrame alphabetically by the "Filename" column
df = df.sort_values(by="Filename").reset_index(drop=True)

# Save the modified DataFrame with the new column to a new Excel file
df[['Filename', 'Preprocessed_Content']].to_excel(output_file, index=False)

print("Lemmatization with excluding stop words applied, sorted by filename, and saved to", output_file)