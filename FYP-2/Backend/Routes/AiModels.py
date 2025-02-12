from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io
import fitz  # PyMuPDF
import base64
import re
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import google.generativeai as genai
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    print("Error: GOOGLE_API_KEY is not set!")
else:
    genai.configure(api_key=API_KEY)

app = Flask(__name__)
CORS(app)

model = SentenceTransformer('all-MiniLM-L6-v2')

def preprocess_text(text):
    """Clean and normalize text for processing."""
    text = text.lower()
    text = re.sub(r'\S+@\S+', '', text)  # Remove emails
    text = re.sub(r'\(?\+?[0-9]*\)?[\s\-]?[0-9]+[\s\-]?[0-9]+[\s\-]?[0-9]+', '', text)  # Remove phone numbers
    text = re.sub(r'http[s]?://\S+', '', text)  # Remove URLs
    text = re.sub(r'www\.\S+', '', text)
    text = re.sub(r'[•\[\]\{\}\(\)\+\-_\=\|\\^~`"\':;,<>/?]', ' ', text)  # Remove special characters
    text = re.sub(r'\s+', ' ', text).strip()  # Normalize spaces
    return text

def extract_text_from_pdf(pdf_data):
    """Extract text from a base64-encoded PDF file."""
    try:
        pdf_binary = base64.b64decode(pdf_data)
        pdf_file = io.BytesIO(pdf_binary)
        with fitz.open(stream=pdf_file, filetype="pdf") as doc:
            text = "".join([page.get_text() for page in doc])
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None

@app.route('/resume-scan', methods=['POST'])
def resume_scan():
    """Scans resume and compares it with job description for similarity."""
    try:
        data = request.get_json()
        pdf_data = data.get("pdf")
        job_description = data.get("jobDescription")
        if not pdf_data or not job_description:
            return jsonify({"error": "Missing required fields"}), 400

        extracted_text = extract_text_from_pdf(pdf_data)
        if extracted_text:
            processed_resume = preprocess_text(extracted_text)
            processed_jd = preprocess_text(job_description)
            resume_embedding = model.encode([processed_resume])[0]
            jd_embedding = model.encode([processed_jd])[0]
            similarity_score = cosine_similarity([jd_embedding], [resume_embedding])[0][0]
            return jsonify({
                "extractedText": extracted_text,
                "jobDescription": job_description,
                "similarityScore": float(similarity_score)
            })
        return jsonify({"error": "Error extracting text"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/test-generate', methods=['POST'])
def generate_test():
    """Generates technical interview questions based on job description and resume."""
    try:
        data = request.get_json()
        job_description = data.get("jobDescription")
        resume = data.get("resume")
        if not job_description or not resume:
            return jsonify({"error": "Missing required fields"}), 400

        gen_model = genai.GenerativeModel("gemini-pro")
        prompt = f"""
        Generate 10 technical interview questions based on the job description and the skills that are in job description and aligned with resume.
        Job Description: {job_description}
        Resume: {resume}
        Provide the questions in a numbered list.
        """
        response = gen_model.generate_content(prompt)

        # Extract questions properly
        questions = [q.strip() for q in response.text.split("\n") if q.strip()]
        return jsonify({"questions": questions, "success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/test-scan', methods=['POST'])
def scan_test():
    """Evaluates test answers and generates a detailed report."""
    try:
        data = request.get_json()
        questions = data.get("questions")
        answers = data.get("answers")
        candidate_name = data.get("candidateName")
        if not questions or not answers or not candidate_name:
            return jsonify({"error": "Missing required fields"}), 400


        gen_model = genai.GenerativeModel("gemini-pro")
        prompt = "Evaluate the following answers on a scale of 0-10 with an explanation for each:\n"

        for i, (q, a) in enumerate(zip(questions, answers), 1):
            prompt += f"\n{i}. Question: {q}\n   Answer: {a}\n"

        response = gen_model.generate_content(prompt)
        evaluation = response.text or ""


        scores, explanations = [], []
        for line in evaluation.split("\n"):
            score_match = re.search(r"(\d+(?:\.\d+)?)/10", line)
            if score_match:
                scores.append(float(score_match.group(1)))
            elif "Explanation:" in line:
                explanations.append(line.split("Explanation:")[-1].strip())

        final_score = sum(scores) / len(scores) if scores else 0

        # ✅ Generate PDF report
        pdf_buffer = io.BytesIO()
        c = canvas.Canvas(pdf_buffer, pagesize=letter)
        y_position = 750

        c.drawString(100, y_position, f"Test Report for {candidate_name}")
        y_position -= 30
        c.drawString(100, y_position, f"Final Score: {final_score:.2f}/10")
        y_position -= 40

        for i, (q, a, s, exp) in enumerate(zip(questions, answers, scores, explanations), 1):
            c.drawString(100, y_position, f"{i}. {q}")
            y_position -= 20
            c.drawString(120, y_position, f"Answer: {a}")
            y_position -= 20
            c.drawString(120, y_position, f"Score: {s}/10")
            y_position -= 20
            c.drawString(120, y_position, f"Explanation: {exp}")
            y_position -= 40

            if y_position < 50:
                c.showPage()
                y_position = 750

        c.save()
        pdf_buffer.seek(0)

        return jsonify({
            "success": True,
            "finalScore": final_score,
            "testReport": evaluation
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
