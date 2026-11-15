
import re
from fastapi import HTTPException
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from utils import extract_text_from_pdf, analyze_skills


app = FastAPI(title="Resumate AI API")


# ==========================================
# CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# HOME ROUTE
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Resumate AI API is running!"
    }


# ==========================================
# RESUME ANALYSIS HELPERS
# ==========================================

def get_resume_checks(resume_text):

    text = resume_text.lower()

    words = re.findall(r"\b[\w+#.-]+\b", text)
    word_count = len(words)

    # Contact information
    has_email = bool(
        re.search(
            r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
            resume_text,
            re.IGNORECASE
        )
    )

    phone_candidates = re.findall(
        r"(?<!\w)(?:\+?\d[\d\s().-]{8,}\d)(?!\w)",
        resume_text
    )

    has_phone = any(
        10 <= len(re.sub(r"\D", "", number)) <= 13
        for number in phone_candidates
    )

    # Common resume sections
    section_names = [
        "summary",
        "professional summary",
        "objective",
        "experience",
        "work experience",
        "employment",
        "education",
        "skills",
        "technical skills",
        "projects",
        "certifications"
    ]

    detected_sections = [
        section
        for section in section_names
        if re.search(
            r"\b" + re.escape(section) + r"\b",
            text
        )
    ]

    unique_sections = list(dict.fromkeys(detected_sections))

    has_sections = len(unique_sections) >= 2

    # Bullet points
    has_bullets = bool(
        re.search(
            r"(?m)^\s*(?:[-•*▪]|\d+[.)])\s+",
            resume_text
        )
    )

    # Measurable achievements
    has_metrics = bool(
        re.search(
            r"\b\d+(?:\.\d+)?\s*(?:%|percent|users|clients|projects|"
            r"employees|customers|hours|days|months|years)\b",
            text
        )
        or re.search(r"₹\s?\d+|\$\s?\d+", text)
    )

    # Action verbs commonly used in resumes
    action_verbs = [
        "developed",
        "created",
        "built",
        "designed",
        "implemented",
        "managed",
        "improved",
        "led",
        "tested",
        "analyzed",
        "automated",
        "delivered",
        "optimized",
        "maintained"
    ]

    detected_action_verbs = [
        verb for verb in action_verbs
        if re.search(r"\b" + verb + r"\b", text)
    ]

    has_action_verbs = len(detected_action_verbs) >= 2

    # ==========================================
    # ATS COMPATIBILITY ESTIMATE
    # Five checks, 20 points each
    # ==========================================

    ats_checks = {
        "email": has_email,
        "phone": has_phone,
        "resume_sections": has_sections,
        "sufficient_text": word_count >= 150,
        "bullet_points": has_bullets
    }

    ats_score = sum(ats_checks.values()) * 20

    ats_issues = []

    if not has_email:
        ats_issues.append(
            "Add a clearly visible professional email address."
        )

    if not has_phone:
        ats_issues.append(
            "Add a valid contact phone number."
        )

    if not has_sections:
        ats_issues.append(
            "Use clear resume sections such as Skills, Education and Experience."
        )

    if word_count < 150:
        ats_issues.append(
            "Your resume contains very little text. Add relevant details."
        )

    if not has_bullets:
        ats_issues.append(
            "Use bullet points to make experience and achievements easier to scan."
        )

    # ==========================================
    # RESUME QUALITY ESTIMATE
    # Five checks, 20 points each
    # ==========================================

    quality_checks = {
        "appropriate_length": 250 <= word_count <= 1000,
        "clear_sections": len(unique_sections) >= 3,
        "bullet_points": has_bullets,
        "measurable_achievements": has_metrics,
        "action_verbs": has_action_verbs
    }

    quality_score = sum(quality_checks.values()) * 20

    quality_issues = []

    if word_count < 250:
        quality_issues.append(
            "Add more relevant details about your education, projects and experience."
        )
    elif word_count > 1000:
        quality_issues.append(
            "Consider removing repetitive or less relevant information."
        )

    if len(unique_sections) < 3:
        quality_issues.append(
            "Add clearly labeled sections to organize your resume."
        )

    if not has_bullets:
        quality_issues.append(
            "Use bullet points to describe your responsibilities and projects."
        )

    if not has_metrics:
        quality_issues.append(
            "Include measurable achievements wherever possible."
        )

    if not has_action_verbs:
        quality_issues.append(
            "Start achievement statements with strong action verbs."
        )

    strengths = []

    if has_email:
        strengths.append("Email address detected.")

    if has_phone:
        strengths.append("Phone number detected.")

    if has_sections:
        strengths.append("Multiple resume sections detected.")

    if has_bullets:
        strengths.append("Bullet-point formatting detected.")

    if has_metrics:
        strengths.append("Measurable achievements detected.")

    if has_action_verbs:
        strengths.append("Strong action verbs detected.")

    return {
        "ats_score": ats_score,
        "resume_quality_score": quality_score,
        "word_count": word_count,
        "detected_sections": unique_sections,
        "ats_checks": ats_checks,
        "ats_issues": ats_issues,
        "quality_issues": quality_issues,
        "resume_strengths": strengths
    }


# ==========================================
# MAIN RESUME UPLOAD AND ANALYSIS ROUTE
# ==========================================

@app.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        return JSONResponse(
            status_code=400,
            content={
                "error": "Please upload a PDF file."
            }
        )

    if not job_description.strip():
        return JSONResponse(
            status_code=400,
            content={
                "error": "Please enter a job description."
            }
        )

    content = await file.read()

    if not content:
        return JSONResponse(
            status_code=400,
            content={
                "error": "The uploaded PDF is empty."
            }
        )

    try:
        extracted_text = extract_text_from_pdf(content)

    except Exception:
        return JSONResponse(
            status_code=400,
            content={
                "error": "Could not read this PDF. Please upload a valid PDF."
            }
        )

    if not extracted_text.strip():
        return JSONResponse(
            status_code=400,
            content={
                "error": "No readable text found. This may be a scanned PDF. Please upload a text-based PDF."
            }
        )

    # Skill analysis
       # Skill analysis
    try:
        analysis = analyze_skills(
            extracted_text,
            job_description
        )

    except Exception as e:
        print("Analysis error:", e)

        raise HTTPException(
            status_code=500,
            detail="Resume analysis failed. Please try again."
        )

    total_required = len(analysis["required_skills"])
    total_matched = len(analysis["matched_skills"])

    match_percentage = (
        round((total_matched / total_required) * 100, 2)
        if total_required > 0 else 0
    )
    # ATS and resume quality analysis
    resume_checks = get_resume_checks(extracted_text)

    
    return {
    "filename": file.filename,

    "required_skills": analysis["required_skills"],
    "matched_skills": analysis["matched_skills"],
    "missing_skills": analysis["missing_skills"],
    "related_skills": analysis["related_skills"],
    "recommendations": analysis["recommendations"],
    "match_percentage": match_percentage,

    "ats_score": resume_checks["ats_score"],
    "resume_quality_score": resume_checks["resume_quality_score"],
    "word_count": resume_checks["word_count"],
    "detected_sections": resume_checks["detected_sections"],
    "ats_checks": resume_checks["ats_checks"],
    "ats_issues": resume_checks["ats_issues"],
    "quality_issues": resume_checks["quality_issues"],
    "resume_strengths": resume_checks["resume_strengths"],

    "message": "Resume analyzed successfully!"
}
