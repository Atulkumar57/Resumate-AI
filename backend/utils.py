
import re
from io import BytesIO
from pdfminer.high_level import extract_text


# ==========================================
# 1. EXTRACT TEXT FROM PDF
# ==========================================

def extract_text_from_pdf(file_content):
    """Extract readable text from an uploaded PDF."""

    if not isinstance(file_content, bytes) or not file_content:
        return ""

    pdf_file = BytesIO(file_content)
    extracted_text = extract_text(pdf_file)

    return extracted_text or ""


# ==========================================
# 2. SKILL DATABASE
# ==========================================

SKILL_ALIASES = {
    "python": ["python"],
    "java": ["java"],
    "javascript": ["javascript", "js"],
    "typescript": ["typescript", "ts"],
    "react": ["react", "react.js"],
    "react native": ["react native"],
    "sql": ["sql", "structured query language"],
    "html": ["html"],
    "css": ["css"],
    "fastapi": ["fastapi", "fast api"],
    "postgresql": ["postgresql", "postgres"],
    "mysql": ["mysql"],
    "machine learning": ["machine learning"],
    "artificial intelligence": ["artificial intelligence"],
    "computer vision": ["computer vision"],
    "docker": ["docker"],
    "git": ["git"],
    "github": ["github"],
    "manual testing": ["manual testing"],
    "selenium": ["selenium"],
    "blockchain": ["blockchain"],
    "solidity": ["solidity"],
    "agile": ["agile"],
    "object oriented programming": [
        "oop",
        "object oriented programming"
    ],
    "api testing": ["api testing"],
    "rest api": ["rest api", "restful api"],
    "linux": ["linux"],
    "c++": ["c++"],
    "c#": ["c#"],
    "node.js": ["node.js", "nodejs"],
    "express.js": ["express.js", "expressjs"],
    "mongodb": ["mongodb", "mongo db"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure", "microsoft azure"],
    "communication": ["communication skills"],
    "problem solving": ["problem solving"],
    "data structures": ["data structures", "dsa"],
    "data analysis": ["data analysis"],
    "pandas": ["pandas"],
    "numpy": ["numpy"],
    "flask": ["flask"],
    "django": ["django"],
    "pytest": ["pytest"],
    "junit": ["junit"],
    "software testing": ["software testing"],
    "automation testing": [
        "automation testing",
        "test automation"
    ]
}


# Related skills are shown separately.
# They are NOT automatically counted as exact matches.

RELATED_SKILLS = {
    "sql": ["postgresql", "mysql"]
}


# ==========================================
# 3. NORMALIZE TEXT
# ==========================================

def normalize_text(text):
    """Normalize text for consistent skill matching."""

    if not isinstance(text, str):
        return ""

    text = text.lower()
    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ==========================================
# 4. CHECK WHETHER A SKILL EXISTS
# ==========================================

def contains_term(text, term):
    """Match complete terms instead of accidental substrings."""

    text = normalize_text(text)
    term = normalize_text(term)

    pattern = (
        r"(?<!\w)"
        + re.escape(term)
        + r"(?!\w)"
    )

    return re.search(pattern, text) is not None


# ==========================================
# 5. ANALYZE RESUME SKILLS
# ==========================================

def analyze_skills(resume_text, job_description):

    resume_text = normalize_text(resume_text)
    job_description = normalize_text(job_description)

    required_skills = []
    matched_skills = []
    missing_skills = []
    related_skills = []

    # Find skills mentioned in the job description.

    for skill, aliases in SKILL_ALIASES.items():

        if any(
            contains_term(job_description, alias)
            for alias in aliases
        ):
            required_skills.append(skill)

    # Check which required skills appear in the resume.

    for skill in required_skills:

        aliases = SKILL_ALIASES[skill]

        if any(
            contains_term(resume_text, alias)
            for alias in aliases
        ):
            matched_skills.append(skill)

        else:
            missing_skills.append(skill)

            # Check for related skills separately.

            related = RELATED_SKILLS.get(skill, [])

            detected_related = [
                related_skill
                for related_skill in related
                if any(
                    contains_term(
                        resume_text,
                        alias
                    )
                    for alias in SKILL_ALIASES[related_skill]
                )
            ]

            if detected_related:
                related_skills.append({
                    "required_skill": skill,
                    "detected_skills": detected_related
                })

    # Calculate exact skill match percentage.

    total_required = len(required_skills)
    total_matched = len(matched_skills)

    match_percentage = (
        round((total_matched / total_required) * 100, 2)
        if total_required > 0
        else 0
    )

    # Recommend missing skills.

    recommendations = [
        f"Consider learning or demonstrating {skill}."
        for skill in missing_skills
    ]

    return {
        "required_skills": required_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "related_skills": related_skills,
        "recommendations": recommendations,
        "match_percentage": match_percentage
    }
