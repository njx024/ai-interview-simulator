from fastapi import FastAPI, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
from dotenv import load_dotenv
import whisper
from google import genai
from voice_analysis import analyze_voice

load_dotenv(override=True)
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

from resume_parser import extract_text_from_resume, extract_skills, extract_experience
from question_generator import generate_questions
from question_generator import evaluate_answer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Whisper model once
print("Loading Whisper model...")
whisper_model = whisper.load_model("base")
print("Whisper model loaded.")

# Store questions in memory for now
QUESTIONS = []
ANSWERS = {}
EVALUATIONS = {}

@app.get("/")
def root():
    return {"status": "Backend running"}

# -------- Resume Upload --------
@app.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    
    # Save uploaded file temporarily
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        contents = await file.read()
        tmp.write(contents)
        temp_path = tmp.name

    # Use your existing logic
    text = extract_text_from_resume(temp_path)
    skills = extract_skills(text)
    experience = extract_experience(text)


    # Cleanup
    os.remove(temp_path)

    experience = (experience or "fresher").lower()

    return {
        "skills": skills,
        "experience": experience
    }

# -------- Generate Questions --------
@app.post("/generate_questions")
def gen_questions(data: dict = Body(...)):
    global QUESTIONS
    skills = data.get("skills", [])
    experience = data.get("experience", "fresher")

    print("SKILLS:", skills)
    print("EXPERIENCE:", experience)

    try:
        QUESTIONS = generate_questions(skills, experience, num_questions=5)
        print("QUESTIONS FROM GEMINI:", QUESTIONS)
    except Exception as e:
        print("ERROR IN generate_questions():", e)
        return {"questions": [], "error": str(e)}

    return {"questions": QUESTIONS}

@app.get("/questions")
def get_questions():
    return {"questions": QUESTIONS}

# -------- Speech to Text (Whisper) --------
from fastapi import Form

@app.post("/transcribe")
async def transcribe_audio(
    index: int = Form(...),
    file: UploadFile = File(...)
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        audio_bytes = await file.read()
        tmp.write(audio_bytes)
        temp_audio_path = tmp.name

    try:
        print("Transcribing audio:", temp_audio_path)

        result = whisper_model.transcribe(temp_audio_path)
        text = result.get("text", "").strip()
        voice_metrics = analyze_voice(text)

        print("Transcription:", text)

        # ✅ STORE BOTH TEXT + VOICE
        ANSWERS[str(index)] = {
            "text": text,
            "voice": voice_metrics
        }

    except Exception as e:
        print("Transcription error:", e)
        return {"answer": "", "error": str(e)}

    finally:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

    # ✅ IMPORTANT RETURN
    return {
        "index": index,
        "answer": text,
        "voice_analysis": voice_metrics
    }

@app.post("/evaluate_answer")
def evaluate_answer_api(data: dict = Body(...)):

    question_index = data.get("index")
    question = data.get("question")
    answer = data.get("answer")

    if not question or not answer:
        return {"error": "Question and answer required"}

    result = evaluate_answer(question, answer)

    if str(question_index) in ANSWERS:
        ANSWERS[str(question_index)]["text"] = answer
    else:
        ANSWERS[str(question_index)] = {
            "text": answer,
            "voice": {}
        }   
    EVALUATIONS[str(question_index)] = result

    return {"evaluation": result}

@app.get("/final_report")



def generate_final_report():

    total_score = 0
    strengths = []
    weaknesses = []
    detailed=[]
    confidence_levels = []

    for i, q in enumerate(QUESTIONS):

        eval_data = EVALUATIONS.get(str(i), {})
        answer_data = ANSWERS.get(str(i), {})

        score_10 = eval_data.get("score", 0)
        score = round((score_10 / 10) * 2, 1)
        if score > 0 and score < 0.5:
            score = 0.5

        total_score += score

        strengths.append(eval_data.get("strengths", ""))
        weaknesses.append(eval_data.get("weaknesses", ""))

        voice = answer_data.get("voice", {})
        if voice:
            confidence_levels.append(voice.get("confidence_level"))

        detailed.append({
            "question": q,
            "answer": answer_data.get("text", ""),
            "voice_analysis": voice,
            "evaluation": eval_data
        })

    if len(QUESTIONS) > 0:
        technical_score = round(total_score, 2)
    else:
        technical_score = 0
        
    overall_confidence = "Medium"

    if confidence_levels:
        if confidence_levels.count("High") > len(confidence_levels)/2:
            overall_confidence = "High"
        elif confidence_levels.count("Low") > len(confidence_levels)/2:
            overall_confidence = "Low"


    return {
    "technical_score": technical_score,
    "confidence_level": overall_confidence,
    "strengths": list(set(strengths)),
    "weaknesses": list(set(weaknesses)),
    "detailed_analysis": detailed
}
