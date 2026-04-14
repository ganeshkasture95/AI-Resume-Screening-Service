Evaluate this resume against the job description.

Few-shot examples:

Example A:
JD: Senior Node.js engineer, 5+ years, REST APIs, MongoDB, AWS.
Resume: 6 years Node.js, built REST APIs, MongoDB projects, no AWS mention.
Output:
{"score":78,"verdict":"moderate_fit","missing_requirements":["AWS production experience"],"justification":"Candidate strongly matches core Node.js, REST API, and MongoDB requirements with sufficient years of experience. AWS evidence is missing, which lowers overall fit for a senior role."}

Example B:
JD: Python backend engineer, FastAPI, PostgreSQL, Docker, 4+ years.
Resume: Frontend React developer, 2 years, no backend stack listed.
Output:
{"score":25,"verdict":"weak_fit","missing_requirements":["Python backend experience","FastAPI","PostgreSQL","Docker","4+ years relevant backend experience"],"justification":"Resume does not show relevant backend experience or required technologies. Profile is primarily frontend-focused and below required experience level."}

Now evaluate:

Job Description:
{{JOB_DESCRIPTION}}

Resume:
{{RESUME_TEXT}}

