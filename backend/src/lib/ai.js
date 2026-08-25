import { env } from '../config/env.js';
import { nvidiaCircuitBreaker, CircuitBreakerError } from './circuitBreaker.js';
import { errorTracker, ErrorCategory, Severity } from './errorTracker.js';
import { sanitizeForAI, validateLatexOutput, validateLength, LENGTH_LIMITS } from './security.js';

// Fallback model if primary is overloaded (Nemotron Mini is faster)
const FALLBACK_MODEL = 'nvidia/nemotron-mini-4b-instruct';

// Nemotron Mini has 4096 token context window
// ~1 token ≈ 4 chars for English text
const CONTEXT_WINDOW = 4096;
const CHARS_PER_TOKEN = 4;
const SAFETY_MARGIN = 100; // Reduced safety margin for more output tokens

const BACKSLASH = String.fromCharCode(92);

/** Estimate token count from text */
function estimateTokens(text) {
  return Math.ceil((text || '').length / CHARS_PER_TOKEN);
}

/** Calculate safe max_tokens based on messages */
function safeMaxTokens(messages, desiredMax = 2048) {
  const usedTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
  const available = CONTEXT_WINDOW - usedTokens - SAFETY_MARGIN;
  // Ensure at least 1000 tokens for response to avoid cut-off JSON
  return Math.min(desiredMax, Math.max(1000, available));
}

/** Truncate text to fit within token budget */
function truncateToBudget(text, maxTokens) {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if ((text || '').length <= maxChars) return text;
  console.warn(`[ai] Truncating input from ${text.length} to ${maxChars} chars`);
  return text.substring(0, maxChars) + '\n...[truncated]';
}

// Call NVIDIA API with circuit breaker + retry + fallback model
async function callNvidia(messages, maxTokens = 2048, timeoutMs = 60_000, model = null) {
  const targetModel = model || env.NVIDIA_MODEL;
  const maxRetries = model ? 1 : 2;

  return nvidiaCircuitBreaker.execute(async () => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      let res;
      try {
        res = await fetch(`${env.NVIDIA_BASE_URL}/chat/completions`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
          },
          body: JSON.stringify({
            model: targetModel,
            messages,
            temperature: 0.3,
            max_tokens: maxTokens,
          }),
        });
      } finally {
        clearTimeout(timeout);
      }

      if (res.ok) {
        const data = await res.json();
        errorTracker.addBreadcrumb('ai', `NVIDIA ${targetModel} succeeded`, {
          model: targetModel,
          tokens: data.usage?.total_tokens,
        });
        return data.choices?.[0]?.message?.content ?? '';
      }

      const body = await res.text();
      console.error(`[ai] NVIDIA ${targetModel} error ${res.status} (attempt ${attempt}/${maxRetries}):`, body.substring(0, 500));

      errorTracker.addBreadcrumb('ai', `NVIDIA ${targetModel} error ${res.status}`, {
        model: targetModel,
        status: res.status,
        attempt,
      });

      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        const delay = attempt * 2000;
        console.log(`[ai] Retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (res.status >= 500 && targetModel === env.NVIDIA_MODEL) {
        console.log(`[ai] Primary model overloaded, trying fallback: ${FALLBACK_MODEL}`);
        try {
          return await callNvidiaDirect(messages, maxTokens, timeoutMs, FALLBACK_MODEL);
        } catch (fallbackErr) {
          console.error('[ai] Fallback also failed:', fallbackErr.message);
        }
      }

      if (res.status === 401) throw new Error('AI service authentication failed. Please check your API key.');
      if (res.status === 429) throw new Error('AI rate limit exceeded. Please wait a minute and try again.');
      if (res.status === 503) throw new Error('AI service is temporarily overloaded. Please try again shortly.');
      if (res.status >= 500) throw new Error('AI service is temporarily unavailable. Please try again.');
      throw new Error(`AI service error (${res.status}). Please try again.`);
    }
  });
}

// Direct call without circuit breaker (for fallback model)
async function callNvidiaDirect(messages, maxTokens = 2048, timeoutMs = 60_000, model) {
  const targetModel = model;

  for (let attempt = 1; attempt <= 1; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let res;
    try {
      res = await fetch(`${env.NVIDIA_BASE_URL}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages,
          temperature: 0.3,
          max_tokens: maxTokens,
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? '';
    }

    const body = await res.text();
    console.error(`[ai] NVIDIA ${targetModel} error ${res.status}:`, body.substring(0, 200));
    throw new Error(`AI fallback service error (${res.status})`);
  }
}

function extractJSON(raw) {
  const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {
      console.log('[ai] Code block JSON parse failed, trying other methods...');
    }
  }

  let braceCount = 0;
  let startIndex = -1;
  let endIndex = -1;
  
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '{') {
      if (braceCount === 0) startIndex = i;
      braceCount++;
    } else if (raw[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
  }
  
  if (startIndex >= 0 && endIndex > startIndex) {
    const candidate = raw.substring(startIndex, endIndex + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      let fixed = candidate
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/\n/g, ' ')
        .replace(/\t/g, ' ');
      try {
        return JSON.parse(fixed);
      } catch (e2) {
        console.error('[ai] JSON parse error after fix attempt:', e2.message);
        console.error('[ai] Candidate JSON:', candidate.substring(0, 200));
      }
    }
  }

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error('[ai] No JSON found in response. Raw:', raw.substring(0, 300));
    throw new Error('AI returned an unparseable response. Please try again.');
  }
  
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    // Try to fix truncated JSON (response cut off mid-string)
    let fixed = match[0];
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    
    // Close unclosed string if ends with quote
    if (fixed.endsWith('"')) {
      // Might be incomplete string, try closing
    }
    
    // Close unclosed brackets/braces
    for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';
    
    // Remove trailing comma before closing
    fixed = fixed.replace(/,\s*([\]\}])/g, '$1');
    
    try {
      return JSON.parse(fixed);
    } catch (e2) {
      console.error('[ai] JSON parse error after fix attempt:', e2.message);
      console.error('[ai] Raw response:', raw.substring(0, 500));
      throw new Error('AI returned invalid JSON. Please try again.');
    }
  }
}

/**
 * Calculate keyword match score based on actual text analysis.
 * This validates the AI's keyword_match score.
 */
function calculateKeywordMatch(jobDescription, resumeText) {
  if (!jobDescription || !resumeText) return 50;
  
  // Common stop words to ignore
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'about', 'above', 'after', 'again', 'also', 'am', 'any', 'because', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'during', 'each', 'for', 'from', 'further', 'get', 'got', 'had', 'has', 'having', 'here', 'into', 'its', 'let', 'like', 'make', 'many', 'may', 'much', 'must', 'need', 'new', 'now', 'old', 'one', 'out', 'over', 'own', 'per', 'put', 'see', 'set', 'shall', 'since', 'still', 'take', 'then', 'there', 'think', 'through', 'under', 'until', 'up', 'use', 'very', 'via', 'way', 'well', 'work', 'yet']);
  
  // Extract keywords from JD (look for important terms)
  const extractKeywords = (text) => {
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s\-\.]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
    return [...new Set(words)];
  };
  
  const jdKeywords = extractKeywords(jobDescription);
  const resumeLower = resumeText.toLowerCase();
  
  if (jdKeywords.length === 0) return 50;
  
  // Count how many JD keywords appear in resume
  let found = 0;
  let importantFound = 0;
  
  for (const keyword of jdKeywords) {
    if (resumeLower.includes(keyword)) {
      found++;
    }
  }
  
  // Also check for skill-specific patterns
  const skillPatterns = [
    /javascript|js\b/i, /typescript|ts\b/i, /python/i, /java\b/i,
    /react/i, /angular/i, /vue/i, /node\.?js/i, /express/i,
    /sql/i, /nosql/i, /mongodb|postgres|mysql|oracle/i,
    /aws|azure|gcp|google cloud/i, /docker|kubernetes|k8s/i,
    /git/i, /agile|scrum/i, /ci\/cd/i, /devops/i,
    /html/i, /css/i, /rest|api/i, /graphql/i,
    /machine learning|ml|ai|artificial intelligence/i,
    /data analysis|analytics/i, /project management/i,
    /leadership/i, /communication/i, /team/i, /collaboration/i,
  ];
  
  let skillMatches = 0;
  for (const pattern of skillPatterns) {
    const jdMentions = jobDescription.match(pattern);
    const resumeMentions = resumeText.match(pattern);
    if (jdMentions && resumeMentions) {
      skillMatches++;
    }
  }
  
  // Calculate score: 50% keyword coverage + 50% skill matches
  const keywordCoverage = (found / jdKeywords.length) * 100;
  const skillCoverage = skillPatterns.length > 0 
    ? (skillMatches / Math.min(skillPatterns.length, 5)) * 100 
    : 50;
  
  const score = Math.round((keywordCoverage * 0.6) + (skillCoverage * 0.4));
  
  console.log(`[keyword] JD keywords: ${jdKeywords.length}, Found: ${found}, Skill matches: ${skillMatches}, Score: ${score}`);
  
  return Math.max(10, Math.min(95, score)); // Cap at 95 to avoid false perfect scores
}

// ─── Call 1: Fast — score, breakdown, rationale, questions ───────────────
export async function analyzeScore({ jobDescription, resumeText }) {
  const sanitizedJD = sanitizeForAI(jobDescription, 'jobDescription');
  const sanitizedResume = sanitizeForAI(resumeText, 'resume');

  const systemPrompt = `ATS analyzer. Compare resume vs job. Return ONLY JSON.

Rules:
- skills_match(0-100): % of JD required skills found in resume
- experience_match(0-100): years in resume vs years required
- keyword_match(0-100): % of JD keywords in resume
- education_match(0-100): degree match
- Do NOT give 100 to all. Most resumes score 40-75.
- ats_score = skills*0.35 + experience*0.30 + keyword*0.20 + education*0.15
- recommendation: apply(>=75), tailor(50-74), skip(<50)
- 10 interview questions about gaps

JSON: {"ats_score":N,"score_breakdown":{"skills_match":N,"experience_match":N,"education_match":N,"keyword_match":N},"recommendation":"apply|tailor|skip","rationale":"text","interview_questions":["q1","q2","q3","q4","q5","q6","q7","q8","q9","q10"]}`;

  const userPrompt = `Analyze this resume against the job description:\n\nJOB DESCRIPTION:\n${sanitizedJD}\n\nRESUME:\n${sanitizedResume}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  const maxTokens = safeMaxTokens(messages, 2048);
  console.log(`[ai] Score analysis: estimated prompt tokens=${estimateTokens(systemPrompt) + estimateTokens(userPrompt)}, max_tokens=${maxTokens}`);

  let result;
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`[ai] Analysis attempt ${attempts}/${maxAttempts}`);
    
    try {
      const raw = await callNvidia(messages, maxTokens, 60_000);
      result = extractJSON(raw);
      break;
    } catch (e) {
      console.error(`[ai] Attempt ${attempts} failed:`, e.message);
      if (attempts >= maxAttempts) {
        throw new Error('AI failed to return valid JSON after multiple attempts. Please try again.');
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (typeof result.ats_score !== 'number' || result.ats_score < 0 || result.ats_score > 100) {
    throw new Error('AI returned an invalid score. Please try again.');
  }

  if (result.score_breakdown) {
    const b = result.score_breakdown;
    b.skills_match = Math.max(0, Math.min(100, Math.round(b.skills_match || 0)));
    b.experience_match = Math.max(0, Math.min(100, Math.round(b.experience_match || 0)));
    b.education_match = Math.max(0, Math.min(100, Math.round(b.education_match || 0)));
    b.keyword_match = Math.max(0, Math.min(100, Math.round(b.keyword_match || 0)));
    
    // Validate with keyword matching - cap score if AI is too optimistic
    const keywordScore = calculateKeywordMatch(jobDescription, resumeText);
    if (keywordScore < b.keyword_match) {
      console.log(`[ai] Adjusting keyword_match from ${b.keyword_match} to ${keywordScore} (based on actual keyword analysis)`);
      b.keyword_match = keywordScore;
    }
    
    // If all breakdown scores are the same, the AI didn't analyze properly
    const allSame = b.skills_match === b.experience_match && 
                    b.experience_match === b.keyword_match && 
                    b.keyword_match === b.education_match;
    if (allSame && b.skills_match > 80) {
      console.log('[ai] All scores identical and high - adjusting based on keyword match');
      b.keyword_match = keywordScore;
      b.skills_match = Math.min(b.skills_match, keywordScore + 10);
    }
    
    result.ats_score = Math.round(
      (b.skills_match * 0.35) +
      (b.experience_match * 0.30) +
      (b.keyword_match * 0.20) +
      (b.education_match * 0.15)
    );
  } else {
    result.score_breakdown = {
      skills_match: result.ats_score,
      experience_match: result.ats_score,
      education_match: result.ats_score,
      keyword_match: result.ats_score,
    };
  }

  if (result.ats_score >= 75) {
    result.recommendation = 'apply';
  } else if (result.ats_score >= 50) {
    result.recommendation = 'tailor';
  } else {
    result.recommendation = 'skip';
  }

  if (!Array.isArray(result.interview_questions)) {
    result.interview_questions = [
      'Tell me about your experience with the key technologies in this role.',
      'How do you handle working under pressure?',
      'Describe a challenging project you worked on.',
      'How do you stay current with new technologies?',
      'Can you walk me through your problem-solving approach?',
      'How do you collaborate with cross-functional teams?',
      'What interests you most about this position?',
      'Describe your experience with agile methodologies.',
      'How do you prioritize multiple deadlines?',
      'Where do you see yourself in 3-5 years?'
    ];
  }
  while (result.interview_questions.length < 10) {
    result.interview_questions.push('Tell me more about your relevant experience.');
  }
  result.interview_questions = result.interview_questions.slice(0, 10);

  if (!result.rationale) {
    result.rationale = 'Analysis complete. Please review the score breakdown for details.';
  }

  return result;
}

// ─── Call 2: Slower — LaTeX CV only ────────────────────────────────────
export async function generateCustomCV({ jobDescription, resumeText, rationale }) {
  const sanitizedJD = sanitizeForAI(jobDescription, 'jobDescription');
  const sanitizedResume = sanitizeForAI(resumeText, 'resume');

  const systemPrompt = [
    'Generate a tailored LaTeX resume for this candidate.',
    'Return ONLY the LaTeX document code. Do NOT include instructions, notes, or comments.',
    '',
    'Structure:',
    '- Start with ' + BACKSLASH + 'documentclass{article}',
    '- Use ' + BACKSLASH + 'section* for: Name (with contact), Experience, Education, Skills',
    '- Each job: title, company, dates, bullet points with ' + BACKSLASH + 'item',
    '- End with ' + BACKSLASH + 'end{document}',
    '',
    'Format rules:',
    '- Escape % as ' + BACKSLASH + '%, & as ' + BACKSLASH + '&, # as ' + BACKSLASH + '#',
    '- Use ' + BACKSLASH + 'textbf for job titles',
    '- Use ' + BACKSLASH + 'begin{itemize} for bullet lists',
    '- Keep total under 1500 characters',
    '',
    'DO NOT include any text like "characters", "escape", or formatting instructions.',
    'Return ONLY the LaTeX code between ' + BACKSLASH + 'documentclass and ' + BACKSLASH + 'end{document}.',
  ].join('\n');

  const userPrompt = 'JOB: ' + sanitizedJD + '\n\nRESUME: ' + sanitizedResume + '\n\nANALYSIS: ' + (rationale || 'Optimize for this role.');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  const maxTokens = safeMaxTokens(messages, 2048);
  console.log(`[ai] CV generation: estimated prompt tokens=${estimateTokens(systemPrompt) + estimateTokens(userPrompt)}, max_tokens=${maxTokens}`);

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[ai] CV generation attempt ${attempt}/3`);
      const raw = await callNvidia(messages, maxTokens, 120_000);
      
      let latex = raw.replace(/```latex\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Fix: AI sometimes omits the leading backslash
      if (latex.startsWith('documentclass')) {
        latex = BACKSLASH + latex;
        console.log('[ai] Fixed missing backslash before documentclass');
      }
      if (latex.startsWith('\ndocumentclass')) {
        latex = latex.replace('\ndocumentclass', BACKSLASH + 'documentclass');
      }

      // Also fix other common missing backslashes
      latex = latex.replace(/^section\{/gm, BACKSLASH + 'section{');
      latex = latex.replace(/^begin\{/gm, BACKSLASH + 'begin{');
      latex = latex.replace(/^end\{/gm, BACKSLASH + 'end{');
      latex = latex.replace(/^usepackage/gm, BACKSLASH + 'usepackage');
      latex = latex.replace(/^textbf\{/gm, BACKSLASH + 'textbf{');
      latex = latex.replace(/^vspace/gm, BACKSLASH + 'vspace');
      
      // Post-process: Remove instruction-like text that AI might have included
      latex = latex.replace(/\\section\*\{Optimization\}[\s\S]*?(?=\\end\{document\})/g, '');
      latex = latex.replace(/\\section\*\{Notes\}[\s\S]*?(?=\\end\{document\})/g, '');
      latex = latex.replace(/Characters.*$/gm, '');
      latex = latex.replace(/Escape.*$/gm, '');
      latex = latex.replace(/\\textbf\{\d+\} characters/g, '');
      // Remove empty sections that might result from cleanup
      latex = latex.replace(/\\section\*\{[^}]*\}\s*\\end\{document\}/g, '\\end{document}');
      
      // Ensure document ends properly
      if (!latex.includes('\\end{document}')) {
        latex = latex.trim() + '\n\n' + BACKSLASH + 'end{document}';
      }
      
      const hasDocClass = latex.includes(BACKSLASH + 'documentclass') || latex.includes('documentclass{article}');
      const hasEndDoc = latex.includes(BACKSLASH + 'end{document}') || latex.includes('end{document}');
      
      if (!hasDocClass || !hasEndDoc) {
        console.error('[ai] CV attempt', attempt, '- Invalid LaTeX. Response:', raw.substring(0, 300));
        lastError = new Error('AI did not return valid LaTeX.');
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        throw lastError;
      }

      const { safe, threats, sanitized } = validateLatexOutput(latex);
      if (!safe) {
        console.warn('[ai] Dangerous LaTeX commands detected and filtered:', threats);
        latex = sanitized;
      }

      return latex;
    } catch (e) {
      lastError = e;
      if (attempt < 3) {
        console.log(`[ai] CV attempt ${attempt} failed: ${e.message}, retrying...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  throw lastError || new Error('CV generation failed after 3 attempts. Please try again.');
}

// ─── Call 3: Cover Letter Generation ───────────────────────────────────
export async function generateCoverLetter({ jobDescription, resumeText, rationale, company }) {
  const sanitizedJD = sanitizeForAI(jobDescription, 'jobDescription');
  const sanitizedResume = sanitizeForAI(resumeText, 'resume');

  const systemPrompt = [
    'Generate a professional cover letter for this candidate.',
    'Return ONLY the cover letter text with paragraphs.',
    '',
    'Start: Dear Hiring Manager,',
    'Middle: Highlight 2-3 key qualifications matching the job.',
    'End: Sincerely, [Name]',
    'Keep 250-350 words, 3-4 paragraphs.',
  ].join('\n');

  const userPrompt = 'JOB: ' + sanitizedJD + '\n\nRESUME: ' + sanitizedResume + '\n\nANALYSIS: ' + (rationale || 'Tailor to highlight relevant experience.');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  const maxTokens = safeMaxTokens(messages, 1500);
  console.log(`[ai] Cover letter: estimated prompt tokens=${estimateTokens(systemPrompt) + estimateTokens(userPrompt)}, max_tokens=${maxTokens}`);

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[ai] Cover letter attempt ${attempt}/3`);
      const raw = await callNvidia(messages, maxTokens, 90_000);
      
      let letter = raw.trim();
      letter = letter.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
      
      if (!letter || letter.length < 50) {
        console.log(`[ai] Cover letter attempt ${attempt} - too short (${letter?.length || 0} chars)`);
        lastError = new Error('AI did not return a valid cover letter.');
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        throw lastError;
      }

      if (!letter.toLowerCase().includes('sincerely')) {
        letter += '\n\nSincerely,\n[Your Name]';
      }

      return letter;
    } catch (e) {
      lastError = e;
      if (attempt < 3) {
        console.log(`[ai] Cover letter attempt ${attempt} failed: ${e.message}, retrying...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  
  throw lastError || new Error('Cover letter generation failed after 3 attempts. Please try again.');
}

// ─── Health Check for Circuit Breaker ──────────────────────────────────
export function getAIServiceHealth() {
  return {
    circuitBreaker: nvidiaCircuitBreaker.getMetrics(),
    model: env.NVIDIA_MODEL,
    fallbackModel: FALLBACK_MODEL,
  };
}
