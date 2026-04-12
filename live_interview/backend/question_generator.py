from google import genai
import os
from dotenv import load_dotenv
load_dotenv(override=True)
import json




# ---------------- GEMINI CLIENT ----------------
client = genai.Client(
    api_key=os.getenv("GOOGLE_API_KEY")
)


# ---------------- MAIN FUNCTION ----------------
def generate_questions(skills, experience, num_questions=5):
    """
    Generate interview questions using Gemini
    strictly aligned with experience level.
    """

    # -------- VALIDATION --------
    if not skills:
        return ["Please add at least one skill to generate questions."]

    experience = (experience or "fresher").lower()

    if experience not in ["fresher", "junior", "mid", "senior"]:
        experience = "fresher"

    skill_text = ", ".join(skills)

    # -------- EXPERIENCE RULE MAP (anchors Gemini) --------
    experience_rules = {
        "fresher": """
- Ask ONLY basic conceptual and syntax-level questions
- No system design
- No architecture
- No performance optimization
""",
        "junior": """
- Ask implementation and logic-based questions
- Small real-world use cases
- No large-scale system design
""",
        "mid": """
- Ask optimization, internals, and trade-offs
- Include moderate design and scalability
""",
        "senior": """
- Ask system design and architecture questions
- Focus on scalability, performance, and trade-offs
"""
    }

    # -------- PROMPT --------
    prompt = f"""
You are a senior technical interviewer.

Generate exactly {num_questions} interview questions.

Candidate profile:
- Experience level: {experience}
- Skills: {skill_text}

STRICT EXPERIENCE RULES:
{experience_rules[experience]}

GLOBAL RULES:
- Questions must strictly match the experience level
- One clear question per line
- No explanations
- No markdown
- No headings
"""

    # -------- GEMINI CALL --------
    response = client.models.generate_content(
        model="models/gemini-flash-latest",
        contents=prompt
    )

    if not response or not response.text:
        return ["Failed to generate questions. Please try again."]

    # -------- CLEAN OUTPUT --------
    questions = [
        q.strip(" .-0123456789")
        for q in response.text.split("\n")
        if q.strip()
    ]

    # Hard guarantee count
    return questions[:num_questions]

# ---------------- ANSWER EVALUATION ----------------
def evaluate_answer(question, answer):
    if len(answer.strip().split()) == 1:
        return {
            "score": 6,
            "strengths": "Correct keyword identified",
            "weaknesses": "Answer lacks explanation",
            "improvement": "Add brief explanation next time"
        }

    prompt = f"""
You are a fair and practical technical interviewer.

Evaluate the candidate answer based on correctness, even if it is short.

RULES:
- Give partial marks for partially correct answers
- Do NOT penalize for short answers if concept is correct
- Accept concise answers if technically accurate
- Be lenient for freshers

Question:
{question}

Candidate Answer:
{answer}

Respond ONLY in JSON:

{{
 "score": number from 0-10,
 "strengths": "...",
 "weaknesses": "...",
 "improvement": "..."
}}
"""

    try:
        response = client.models.generate_content(
            model="models/gemini-flash-latest",
            contents=prompt
        )

        return json.loads(response.text)

    except Exception as e:
        print("Gemini error:", e)
        return {
            "score": 0,
            "strengths": "",
            "weaknesses": "",
            "improvement": "AI evaluation temporarily unavailable"
        }
