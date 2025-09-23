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
import os, json, torch
from flask import Flask
import traceback

from dotenv import load_dotenv
# Try to load from local .env file first, then from environment variables
load_dotenv()  # Load from current directory
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

        gen_model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        prompt = f"""
        Generate a technical test with 3 sections:
        1. **5 MCQs** with 4 options each and the correct answer marked.
        2. **3 logic-based pseudocode questions.**
        3. **2 theory questions** that require descriptive answers.

        Base the questions on this Job Description and align them with the skills from the resume.
        Job Description: {job_description}
        Resume: {resume}

        Format the output as a JSON object with the following structure:
        {{
            "mcqs": [
                {{
                    "question": "...",
                    "options": ["A", "B", "C", "D"],
                    "answer": "B"
                }}
            ],
            "pseudocode": [
                "Write a pseudocode to..."
            ],
            "theory": [
                "Explain the concept of..."
            ]
        }}
        """

        response = gen_model.generate_content(prompt)
        generated_text = response.candidates[0].content.parts[0].text.strip()

        # --------- ✅ Extract actual JSON from Gemini output ----------
        import re
        json_match = re.search(r'\{.*\}', generated_text, re.DOTALL)
        if not json_match:
            print("Generated Text (Invalid JSON):", generated_text)
            return jsonify({"error": "Could not extract JSON from response."}), 500

        raw_json = json_match.group()

        try:
            questions = json.loads(raw_json)
        except json.JSONDecodeError as e:
            print("Extracted JSON string:", raw_json)
            return jsonify({"error": "Failed to parse JSON", "details": str(e)}), 500

        # --------- ✅ Fix MCQ answers like "A"/"B" to actual text ----------
        # for mcq in questions.get("mcqs", []):
        #     answer = mcq.get("answer")
        #     options = mcq.get("options", [])
        #     if isinstance(answer, str) and answer.upper() in "ABCD":
        #         index = "ABCD".index(answer.upper())
        #         if index < len(options):
        #             mcq["answer"] = options[index]

        # --------- ✅ Validate structure ----------
        for section in ['mcqs', 'pseudocode', 'theory']:
            if section not in questions:
                return jsonify({"error": f"Missing section: {section}"}), 400

        return jsonify({"questions": questions, "success": True})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/test-scan', methods=['POST'])
def scan_test():
    try:
        data = request.get_json()
        questions = data.get("questions")
        answers = data.get("answers")
        candidate_name = data.get("candidateName")
        if not questions or not answers or not candidate_name:
            return jsonify({"error": "Missing required fields"}), 400

        gen_model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = f"Evaluate the following test answers by {candidate_name} on a scale of 0 to 10. For each question, provide a score and a brief explanation of the evaluation:\n"

        section_titles = {
            "mcqs": "MCQs",
            "pseudocode": "Pseudocode",
            "theory": "Theory"
        }

        all_qna = []
        for section in ["mcqs", "pseudocode", "theory"]:
            q_list = questions.get(section, [])
            a_list = answers.get(section, [])
            prompt += f"\n=== {section_titles[section]} ===\n"
            for i, (q, a) in enumerate(zip(q_list, a_list), 1):
                if section == "mcqs":
                    q_text = f"{q.get('question')} Options: {q.get('options')}"
                else:
                    q_text = q
                prompt += f"{i}. Question: {q_text}\n   Answer: {a}\n"
                all_qna.append((section, q_text, a))

        response = gen_model.generate_content(prompt)
        evaluation = response.text or ""

        # Extract scores and explanations
        scores, explanations = [], []
        for line in evaluation.split("\n"):
            score_match = re.search(r"(\d+(?:\.\d+)?)/10", line)
            if score_match:
                scores.append(float(score_match.group(1)))
            elif "Explanation:" in line:
                explanations.append(line.split("Explanation:")[-1].strip())

        final_score = sum(scores) / len(scores) if scores else 0

        # Generate PDF report
        pdf_buffer = io.BytesIO()
        c = canvas.Canvas(pdf_buffer, pagesize=letter)
        y_position = 750
        c.drawString(100, y_position, f"Test Report for {candidate_name}")
        y_position -= 30
        c.drawString(100, y_position, f"Final Score: {final_score:.2f}/10")
        y_position -= 40

        for i, (section, q, a) in enumerate(all_qna, 1):
            s = scores[i - 1] if i - 1 < len(scores) else "-"
            exp = explanations[i - 1] if i - 1 < len(explanations) else "Not available"
            c.drawString(100, y_position, f"{i}. [{section.upper()}] {q}")
            y_position -= 20
            c.drawString(120, y_position, f"Answer: {a}")
            y_position -= 20
            c.drawString(120, y_position, f"Score: {s}/10")
            y_position -= 20
            c.drawString(120, y_position, f"Explanation: {exp}")
            y_position -= 40
            if y_position < 100:
                c.showPage()
                y_position = 750

        c.save()
        pdf_buffer.seek(0)
        encoded_pdf = base64.b64encode(pdf_buffer.getvalue()).decode("utf-8")

        return jsonify({
            "success": True,
            "finalScore": final_score,
            "testReport": evaluation,
            "testReportPdf": encoded_pdf
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
