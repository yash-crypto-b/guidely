/**
 * Test Fixtures for Resume and Job Description Testing
 * These are realistic examples for validating ATS scoring.
 */

// ─── Valid Resume Fixtures ──────────────────────────────────────────────

export const validResume = `
John Smith
Software Engineer | john.smith@email.com | (555) 123-4567 | linkedin.com/in/johnsmith

EXPERIENCE

Senior Software Engineer | TechCorp Inc. | Jan 2021 - Present
- Led development of microservices architecture serving 1M+ daily users
- Implemented CI/CD pipeline reducing deployment time by 60%
- Mentored team of 5 junior developers
- Technologies: React, Node.js, TypeScript, AWS, Docker, Kubernetes

Software Developer | StartupXYZ | Jun 2018 - Dec 2020
- Built real-time collaboration features using WebSockets
- Optimized database queries improving performance by 40%
- Technologies: Python, Django, PostgreSQL, Redis

EDUCATION

Bachelor of Science in Computer Science
University of California, Berkeley | 2018

SKILLS
JavaScript, TypeScript, Python, React, Node.js, AWS, Docker, Kubernetes, PostgreSQL, Redis, Git, Agile/Scrum
`.trim();

export const validResumeMinimal = `
Jane Doe
jane@email.com

Experience: 3 years as a developer at ABC Corp.
Skills: JavaScript, React, Node.js
Education: BS Computer Science, MIT 2020
`.trim();

export const validResumeLong = `
Robert Johnson
Senior Full Stack Developer
robert.j@email.com | (555) 987-6543 | San Francisco, CA

PROFESSIONAL SUMMARY
Experienced full-stack developer with 8+ years building scalable web applications.
Passionate about clean code, test-driven development, and mentoring teams.

WORK EXPERIENCE

Lead Developer | MegaTech Solutions | Mar 2019 - Present
• Architected and implemented enterprise SaaS platform handling 10M+ API requests/day
• Led migration from monolith to microservices, improving scalability by 300%
• Established coding standards and review processes for team of 15 developers
• Implemented monitoring and alerting reducing incident response time by 70%
• Technologies: React, TypeScript, Node.js, Go, AWS (ECS, RDS, S3, CloudFront)

Full Stack Developer | Digital Innovations Inc. | Jan 2016 - Feb 2019
• Developed customer-facing web applications serving 500K+ users
• Implemented A/B testing framework increasing conversion rates by 25%
• Built real-time analytics dashboard with WebSocket integration
• Technologies: Angular, Python, Django, PostgreSQL, Elasticsearch

Junior Developer | WebAgency Co. | Jun 2014 - Dec 2015
• Developed responsive websites for 20+ enterprise clients
• Implemented automated testing suite achieving 90% code coverage
• Technologies: HTML, CSS, JavaScript, jQuery, PHP, MySQL

EDUCATION

Master of Science in Computer Science
Stanford University | 2014

Bachelor of Science in Computer Science
University of Michigan | 2012

CERTIFICATIONS
• AWS Solutions Architect Professional
• Google Cloud Professional Developer
• Kubernetes Administrator (CKA)

SKILLS
Languages: JavaScript, TypeScript, Python, Go, SQL
Frontend: React, Angular, HTML5, CSS3, Redux, Next.js
Backend: Node.js, Django, Express, FastAPI
Databases: PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch
Cloud: AWS (EC2, ECS, RDS, S3, Lambda), GCP, Azure
DevOps: Docker, Kubernetes, Terraform, Jenkins, GitHub Actions
Tools: Git, Jira, Confluence, Datadog, New Relic
`.trim();

// ─── Invalid Resume Fixtures ────────────────────────────────────────────

export const garbageResume = `
asdfjkl; qwertyuiop 1234567890
!!!@#$%^&*()_+{}|:<>?
aaaaaaaaaaaaaaaaaaaaaaaaaa
\x00\x01\x02\x03\x04\x05
`.trim();

export const shortResume = `Just a name`;

export const ocrGarbledResume = `
J0hn Sm1th
S0ftw@re Eng1n33r | j0hn@em@1l.c0m

3xp3r13nc3:
- Bu1lt w3bs1t3s
- Wrot3 c0d3

Sk1lls: J@vaScr1pt, R3@ct
`.trim();

// ─── Valid Job Description Fixtures ─────────────────────────────────────

export const validJobDescription = `
Senior Software Engineer

About the Role
We are looking for a Senior Software Engineer to join our growing team. You will be responsible for designing, developing, and maintaining scalable web applications.

Required Qualifications:
- 5+ years of experience in software development
- Strong proficiency in JavaScript, TypeScript, and React
- Experience with Node.js and RESTful APIs
- Familiarity with AWS cloud services
- Experience with Docker and containerization
- Strong problem-solving skills
- Excellent communication abilities

Preferred Qualifications:
- Experience with Kubernetes and microservices
- Knowledge of PostgreSQL or similar databases
- Familiarity with CI/CD pipelines
- Experience with agile/scrum methodologies

Education:
- Bachelor's degree in Computer Science or equivalent experience

This is a full-time position with competitive salary and benefits.
`.trim();

export const validJobDescriptionShort = `
We need a frontend developer with React experience. Must know JavaScript and HTML/CSS. 2+ years experience required. This is a full-time position.
`.trim();

export const validJobDescriptionTech = `
Machine Learning Engineer

Requirements:
- Masters or PhD in CS, Statistics, or related field
- 3+ years experience with machine learning frameworks
- Proficient in Python, TensorFlow, PyTorch
- Experience with NLP and transformer models
- Strong mathematical background in linear algebra and statistics
- Experience deploying models to production
- Familiarity with MLOps practices

Nice to have:
- Experience with LLMs and fine-tuning
- Knowledge of vector databases
- Publications in ML conferences
`.trim();

// ─── Invalid Job Description Fixtures ───────────────────────────────────

export const garbageJobDescription = `
?????? 12345 asdfghjkl
!!!@#$%^&*()
`.trim();

export const shortJobDescription = `Need`;

// ─── PDF Test Buffers ───────────────────────────────────────────────────

// Minimal valid PDF (1 page, very small)
export const minimalPdf = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
190
%%EOF`);

// Multi-page PDF header (simulates >10 pages)
export const multiPagePdfHeader = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R 5 0 R 6 0 R 7 0 R 8 0 R 9 0 R 10 0 R 11 0 R 12 0 R 13 0 R 14 0 R] /Count 12 >>
endobj
`);

// ─── Mock AI Responses ──────────────────────────────────────────────────

export const mockAiScoreResponse = JSON.stringify({
  ats_score: 78,
  score_breakdown: {
    skills_match: 85,
    experience_match: 80,
    education_match: 70,
    keyword_match: 75,
  },
  recommendation: 'apply',
  rationale: 'Strong candidate with relevant experience and skills matching the job requirements.',
  interview_questions: [
    'Tell me about your experience with microservices.',
    'How do you handle code reviews?',
    'Describe your approach to testing.',
    'How do you stay updated with new technologies?',
    'Tell me about a challenging project you led.',
    'How do you handle technical debt?',
    'Describe your experience with cloud services.',
    'How do you approach debugging complex issues?',
    'Tell me about your mentoring experience.',
    'How do you balance speed with code quality?',
  ],
});

export const mockAiLatexResponse = `
\\documentclass{article}
\\usepackage[margin=0.75in]{geometry}
\\begin{document}
\\section*{John Smith}
john@email.com | (555) 123-4567

\\section*{Experience}
\\textbf{Software Engineer} | TechCorp | 2021-Present
\\begin{itemize}
\\item Led microservices development
\\item Implemented CI/CD pipeline
\\end{itemize}

\\section*{Skills}
JavaScript, TypeScript, React, Node.js, AWS

\\section*{Education}
BS Computer Science, UC Berkeley 2018
\\end{document}
`.trim();

export const mockCoverLetterResponse = `
Dear Hiring Manager,

I am writing to express my strong interest in the Senior Software Engineer position at your company. With over 5 years of experience in software development, I have developed a deep expertise in building scalable web applications using modern technologies.

In my current role at TechCorp, I have led the development of microservices architecture serving over 1 million daily users. My experience with React, Node.js, and AWS aligns perfectly with your requirements. I am particularly proud of implementing a CI/CD pipeline that reduced deployment time by 60%.

I am excited about the opportunity to bring my skills in JavaScript, TypeScript, and cloud services to your team. I am confident that my experience with Docker, Kubernetes, and agile methodologies would make me a valuable addition to your organization.

I would welcome the opportunity to discuss how my background and skills would contribute to your team's success.

Sincerely,
John Smith
`.trim();
