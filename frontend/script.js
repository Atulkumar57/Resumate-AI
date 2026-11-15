document.addEventListener("DOMContentLoaded", () => {
  const resumeForm = document.getElementById("resumeForm");
  const analysisResult = document.getElementById("analysisResult");
  const resumeFileInput = document.getElementById("resumeFile");
  const jobDescriptionInput = document.getElementById("jobDescription");
  const submitButton = resumeForm?.querySelector('button[type="submit"]');

  if (
    !resumeForm ||
    !analysisResult ||
    !resumeFileInput ||
    !jobDescriptionInput
  ) {
    console.error("Resumate AI: Required HTML elements were not found.");
    return;
  }

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeScore(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : 0;
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function renderList(items, emptyMessage, type = "") {
    if (!items.length) {
      return `<div class="result-empty">${escapeHTML(emptyMessage)}</div>`;
    }

    return items
      .map(
        (item) => `
      <div class="detail-item ${type}">
        ${escapeHTML(item)}
      </div>
    `,
      )
      .join("");
  }

  function renderSkills(skills, type) {
    if (!skills.length) {
      return `<p class="result-empty">None detected</p>`;
    }

    return `
      <div class="skill-list">
        ${skills
          .map(
            (skill) => `
          <span class="skill-tag ${type}">
            ${escapeHTML(skill)}
          </span>
        `,
          )
          .join("")}
      </div>
    `;
  }

  // ==========================================
  // IMPROVEMENT SUGGESTIONS
  // ==========================================

  function generateSuggestions(missingSkills, atsIssues, qualityIssues) {
    const skillAdvice = {
      python: "Practice Python programming and build a practical project.",
      java: "Strengthen Java fundamentals and object-oriented programming.",
      javascript: "Build interactive web applications using JavaScript.",
      fastapi: "Learn FastAPI by developing and testing REST APIs.",
      sql: "Practice SQL queries, joins, and database management.",
      docker: "Learn Docker containers and deploy a small application.",
      git: "Practice Git and maintain your projects on GitHub.",
      react: "Learn React components, hooks, and state management.",
      html: "Improve HTML structure and semantic markup.",
      css: "Practice responsive layouts, Flexbox, and CSS Grid.",
      selenium: "Build browser automation tests using Selenium.",
      blockchain: "Build a small blockchain-based application.",
    };

    const suggestions = [];

    missingSkills.forEach((skill) => {
      const key = String(skill).toLowerCase();

      suggestions.push(
        skillAdvice[key] ||
          `Learn ${skill} and demonstrate it through a practical project.`,
      );
    });

    if (atsIssues.length) {
      suggestions.push(
        "Review ATS compatibility issues and improve the affected resume sections.",
      );
    }

    if (qualityIssues.length) {
      suggestions.push("Improve resume structure, clarity, and readability.");
    }

    suggestions.push(
      "Add measurable achievements and results to your work experience.",
    );

    suggestions.push(
      "Include relevant projects that demonstrate your practical skills.",
    );

    suggestions.push("Use clear section headings and consistent formatting.");

    return [...new Set(suggestions)];
  }

  // ==========================================
  // SCORE CARDS
  // ==========================================

  function createScoreCard(title, score, description) {
    const percentage = safeScore(score);

    return `
      <div class="dashboard-score-card">
        <div class="dashboard-score-top">
          <span>${escapeHTML(title)}</span>
          <span class="score-indicator">●</span>
        </div>

        <div class="dashboard-score-value">
          ${percentage}%
        </div>

        <div class="dashboard-progress">
          <div
            class="dashboard-progress-fill"
            style="width: ${percentage}%"
          ></div>
        </div>

        <p>${escapeHTML(description)}</p>
      </div>
    `;
  }

  // ==========================================
  // ATS CHECKS
  // ==========================================

  function renderATSChecks(checks) {
    const labels = {
      email: "Email address",
      phone: "Phone number",
      resume_sections: "Resume sections",
      sufficient_text: "Sufficient resume content",
      bullet_points: "Bullet-point formatting",
    };

    return Object.entries(labels)
      .map(([key, label]) => {
        const passed = checks[key] === true;

        return `
        <div class="ats-check-item">
          <span>${label}</span>

          <span class="${passed ? "check-passed" : "check-failed"}">
            ${passed ? "✓ Passed" : "✕ Needs attention"}
          </span>
        </div>
      `;
      })
      .join("");
  }

  // ==========================================
  // ERROR DISPLAY
  // ==========================================

  function showError(message) {
    analysisResult.innerHTML = `
      <div class="results-error">
        <span>!</span>

        <div>
          <h3>Unable to analyze resume</h3>
          <p>${escapeHTML(message)}</p>
        </div>
      </div>
    `;

    analysisResult.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // ==========================================
  // DISPLAY ANALYSIS RESULTS
  // ==========================================

  function displayResults(data) {
    if (!data || typeof data !== "object") {
      throw new Error("The server returned unexpected analysis data.");
    }

    const requiredSkills = safeArray(data.required_skills);
    const matchedSkills = safeArray(data.matched_skills);
    const missingSkills = safeArray(data.missing_skills);
    const relatedSkills = safeArray(data.related_skills);
    const backendRecommendations = safeArray(data.recommendations);

    const detectedSections = safeArray(data.detected_sections);
    const atsIssues = safeArray(data.ats_issues);
    const qualityIssues = safeArray(data.quality_issues);
    const strengths = safeArray(data.resume_strengths);

    const atsChecks =
      data.ats_checks && typeof data.ats_checks === "object"
        ? data.ats_checks
        : {};

    const matchScore = safeScore(data.match_percentage);
    const atsScore = safeScore(data.ats_score);
    const qualityScore = safeScore(data.resume_quality_score);

    const wordCount = Math.max(0, Number(data.word_count) || 0);

    const suggestions = backendRecommendations.length
      ? backendRecommendations
      : generateSuggestions(missingSkills, atsIssues, qualityIssues);

    const sectionsText = detectedSections.length
      ? detectedSections.map(escapeHTML).join(", ")
      : "No sections detected";

    analysisResult.innerHTML = `
      <div class="results-dashboard">

        <!-- HEADER -->

        <div class="results-header">
          <div>
            <span class="results-eyebrow">
              <span class="live-dot"></span>
              ANALYSIS COMPLETE
            </span>

            <h2>Your Resume Analysis</h2>

            <p>
              Here's your resume performance breakdown
              and what you can improve.
            </p>
          </div>

          <div class="results-status">
            <span>✓</span> Analysis complete
          </div>
        </div>

        <!-- MAIN SCORE -->

        <div class="results-overview">

          <div class="main-score-panel">
            <div
              class="main-score-ring"
              style="--score-deg: ${matchScore * 3.6}deg"
              role="img"
              aria-label="Job description match ${matchScore}%"
            >
              <div class="main-score-inner">
                <strong>${matchScore}%</strong>
                <span>Match score</span>
              </div>
            </div>

            <div class="main-score-description">
              <span class="panel-label">JOB MATCH</span>

              <h3>
                ${
                  matchScore >= 80
                    ? "Excellent potential!"
                    : matchScore >= 60
                      ? "Good progress!"
                      : "Room to improve"
                }
              </h3>

              <p>
                Your resume matches ${matchScore}% of the
                detected job requirements. Review your
                missing skills and recommendations below.
              </p>
            </div>
          </div>

          <div class="quick-stats">

            <div class="quick-stat">
              <span class="quick-stat-icon purple-icon">✓</span>
              <div>
                <strong>${matchedSkills.length}</strong>
                <span>Matched skills</span>
              </div>
            </div>

            <div class="quick-stat">
              <span class="quick-stat-icon orange-icon">!</span>
              <div>
                <strong>${missingSkills.length}</strong>
                <span>Missing skills</span>
              </div>
            </div>

            <div class="quick-stat">
              <span class="quick-stat-icon blue-icon">⌘</span>
              <div>
                <strong>${requiredSkills.length}</strong>
                <span>Required skills</span>
              </div>
            </div>

            <div class="quick-stat">
              <span class="quick-stat-icon green-icon">▤</span>
              <div>
                <strong>${wordCount}</strong>
                <span>Resume words</span>
              </div>
            </div>

          </div>
        </div>

        <!-- SCORE CARDS -->

        <div class="results-section-heading">
          <div>
            <span class="panel-label">PERFORMANCE</span>
            <h3>Your resume scores</h3>
          </div>
        </div>

        <div class="dashboard-score-grid">

          ${createScoreCard(
            "ATS Compatibility",
            atsScore,
            "Rule-based compatibility estimate",
          )}

          ${createScoreCard(
            "Resume Quality",
            qualityScore,
            "Structure and content quality estimate",
          )}

          ${createScoreCard(
            "Skills Match",
            matchScore,
            "Detected job requirement match",
          )}

        </div>

        <!-- ATS CHECKS AND STRENGTHS -->

        <div class="results-two-column">

          <div class="results-panel">
            <div class="results-panel-heading">
              <span class="panel-icon">✓</span>
              <div>
                <h3>ATS Compatibility Checks</h3>
                <p>Important resume elements</p>
              </div>
            </div>

            <div class="ats-check-list">
              ${renderATSChecks(atsChecks)}
            </div>
          </div>

          <div class="results-panel">
            <div class="results-panel-heading">
              <span class="panel-icon">✦</span>
              <div>
                <h3>Resume Strengths</h3>
                <p>What your resume does well</p>
              </div>
            </div>

            ${renderList(
              strengths,
              "No specific strengths were returned by the analyzer.",
              "strength-item",
            )}
          </div>

        </div>

        <!-- SKILL ANALYSIS -->

        <div class="results-section-heading">
          <div>
            <span class="panel-label">SKILL ANALYSIS</span>
            <h3>Skills breakdown</h3>
          </div>
        </div>

        <div class="results-two-column">

          <div class="results-panel">
            <div class="results-panel-heading">
              <span class="panel-icon success-panel-icon">✓</span>
              <div>
                <h3>Matched Skills</h3>
                <p>Skills found in your resume</p>
              </div>
            </div>

            ${renderSkills(matchedSkills, "skill-matched")}
          </div>

          <div class="results-panel">
            <div class="results-panel-heading">
              <span class="panel-icon warning-panel-icon">!</span>
              <div>
                <h3>Missing Skills</h3>
                <p>Skills to consider developing</p>
              </div>
            </div>

            ${renderSkills(missingSkills, "skill-missing")}
          </div>

        </div>



<!-- RELATED SKILLS -->

<div class="results-panel required-skills-panel">
  <div class="results-panel-heading">
    <span class="panel-icon">↗</span>
    <div>
      <h3>Related Skills Detected</h3>
      <p>Related technologies found in your resume</p>
    </div>
  </div>

  ${
    relatedSkills.length
      ? relatedSkills
          .map(
            (item) => `
          <div class="detail-item">
            <strong>${escapeHTML(item.required_skill)}</strong>
            <p>
              Related skills detected:
              ${escapeHTML(safeArray(item.detected_skills).join(", "))}
            </p>
          </div>
        `,
          )
          .join("")
      : '<p class="result-empty">No related skills detected.</p>'
  }
</div>


        <!-- REQUIRED SKILLS -->

        <div class="results-panel required-skills-panel">
          <div class="results-panel-heading">
            <span class="panel-icon">⌘</span>
            <div>
              <h3>Required Skills</h3>
              <p>Skills identified in the job description</p>
            </div>
          </div>

          ${renderSkills(requiredSkills, "skill-required")}
        </div>

        <!-- IMPROVEMENT AREAS -->

        <div class="results-section-heading">
          <div>
            <span class="panel-label">IMPROVEMENT AREAS</span>
            <h3>What needs attention?</h3>
          </div>
        </div>

        <div class="results-two-column">

          <div class="results-panel">
            <div class="results-panel-heading">
              <span class="panel-icon warning-panel-icon">!</span>
              <div>
                <h3>ATS Improvements</h3>
                <p>Potential compatibility issues</p>
              </div>
            </div>

            ${renderList(
              atsIssues,
              "No ATS issues were returned by the analyzer.",
              "issue-item",
            )}
          </div>

          <div class="results-panel">
            <div class="results-panel-heading">
              <span class="panel-icon warning-panel-icon">!</span>
              <div>
                <h3>Quality Improvements</h3>
                <p>Content and presentation issues</p>
              </div>
            </div>

            ${renderList(
              qualityIssues,
              "No quality issues were returned by the analyzer.",
              "issue-item",
            )}
          </div>

        </div>

        <!-- RESUME OVERVIEW -->

        <div class="results-panel resume-overview-panel">
          <div class="results-panel-heading">
            <span class="panel-icon">▤</span>
            <div>
              <h3>Resume Overview</h3>
              <p>Detected document information</p>
            </div>
          </div>

          <div class="overview-information">
            <div>
              <span>Word count</span>
              <strong>${wordCount}</strong>
            </div>

            <div>
              <span>Detected sections</span>
              <strong>${sectionsText}</strong>
            </div>
          </div>
        </div>

        <!-- RECOMMENDATIONS -->

        <div class="recommendations-panel">
          <div class="recommendations-heading">
            <span class="recommendation-sparkle">✦</span>

            <div>
              <span class="panel-label">YOUR NEXT STEPS</span>
              <h3>Resume Improvement Plan</h3>
              <p>
                Practical suggestions based on the
                analysis results.
              </p>
            </div>
          </div>

          <div class="recommendation-list">
            ${suggestions
              .map(
                (suggestion, index) => `
              <div class="recommendation-item">
                <span class="recommendation-number">
                  ${String(index + 1).padStart(2, "0")}
                </span>

                <p>${escapeHTML(suggestion)}</p>

                <span class="recommendation-check">✓</span>
              </div>
            `,
              )
              .join("")}
          </div>
        </div>

        <div class="results-footer">
          <span>✦</span>
          Keep improving. Your next opportunity starts here.
        </div>

      </div>
    `;

    analysisResult.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // ==========================================
  // FORM SUBMISSION
  // ==========================================

  resumeForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const resumeFile = resumeFileInput.files?.[0];
    const jobDescription = jobDescriptionInput.value.trim();

    // CHECK 1: RESUME FILE

    if (!resumeFile) {
      showError("Please select a PDF resume.");
      return;
    }

    // CHECK 2: PDF FORMAT

    if (!resumeFile.name.toLowerCase().endsWith(".pdf")) {
      showError("Please upload a PDF file.");
      return;
    }

    if (resumeFile.type && resumeFile.type !== "application/pdf") {
      showError("The selected file does not appear to be a valid PDF.");
      return;
    }

    // CHECK 3: JOB DESCRIPTION

    if (!jobDescription) {
      showError("Please enter a job description.");
      return;
    }

    // PREPARE DATA

    const formData = new FormData();

    formData.append("file", resumeFile);
    formData.append("job_description", jobDescription);

    // LOADING STATE

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Analyzing Your Resume...";
    }

    analysisResult.innerHTML = `
      <div class="results-loading">
        <div class="loading-spinner"></div>

        <h3>Analyzing your resume...</h3>

        <p>
          Resumate AI is evaluating your skills,
          ATS compatibility, and resume quality.
        </p>
      </div>
    `;

    analysisResult.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    // SEND REQUEST TO BACKEND

    try {
      const response = await fetch("http://127.0.0.1:8000/upload-resume", {
        method: "POST",
        body: formData,
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        const message = data.detail || data.error || "Resume analysis failed.";

        throw new Error(
          typeof message === "string" ? message : JSON.stringify(message),
        );
      }

      // DISPLAY RESULTS

      displayResults(data);
    } catch (error) {
      console.error("Resume analysis error:", error);

      showError(
        `Something went wrong: ${error.message}. Check that your backend server is running and try again.`,
      );
    } finally {
      // RESTORE BUTTON

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = "Analyze My Resume <span>→</span>";
      }
    }
  });

  console.log("Resumate AI JavaScript loaded successfully.");
});
