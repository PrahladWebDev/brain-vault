import fetch from 'node-fetch';

const STOPWORDS = new Set([
  'the','a','an','and','or','but','is','are','was','were','be','been','being','to','of','in','on',
  'for','with','as','by','at','from','that','this','it','its','into','about','if','then','than',
  'so','such','can','could','should','would','will','shall','may','might','not','no','do','does',
  'did','have','has','had','you','your','we','our','they','their','he','she','his','her','i','me',
  'my','also','more','most','some','any','all','one','two','use','using','used','how','what','why',
  'when','where','which','who','whom','these','those','there','here','out','up','down','over','under',
]);

const KNOWN_TECH_KEYWORDS = [
  'react', 'node', 'nodejs', 'node.js', 'mongodb', 'docker', 'kubernetes', 'jwt', 'express',
  'graphql', 'typescript', 'javascript', 'python', 'rust', 'golang', 'go', 'aws', 'azure', 'gcp',
  'vue', 'angular', 'svelte', 'next.js', 'nextjs', 'redux', 'tailwind', 'css', 'html', 'sql',
  'postgres', 'postgresql', 'mysql', 'redis', 'kafka', 'rabbitmq', 'ci/cd', 'devops', 'terraform',
  'ansible', 'linux', 'git', 'github', 'gitlab', 'webpack', 'vite', 'jest', 'cypress', 'testing',
  'machine learning', 'deep learning', 'ai', 'llm', 'nlp', 'tensorflow', 'pytorch', 'openai',
  'microservices', 'serverless', 'api', 'rest', 'websocket', 'oauth', 'security', 'blockchain',
];

const CATEGORY_MAP = {
  github: 'Programming', documentation: 'Programming', stackoverflow: 'Programming',
  devto: 'Programming', medium: 'Programming', youtube: 'Learning', reddit: 'Discussion',
  twitter: 'Discussion', linkedin: 'Career', pdf: 'Reference', article: 'Reading', blog: 'Reading',
};

function topKeywords(text, limit = 10) {
  const freq = {};
  const words = (text || '').toLowerCase().match(/[a-z0-9][a-z0-9.+#-]{2,}/g) || [];
  for (const w of words) {
    if (STOPWORDS.has(w)) continue;
    freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function detectTechnologies(text) {
  const lower = (text || '').toLowerCase();
  return KNOWN_TECH_KEYWORDS.filter((tech) => lower.includes(tech)).slice(0, 8);
}

function detectDifficulty(text) {
  const lower = (text || '').toLowerCase();
  if (/(advanced|deep dive|internals|production-grade|expert)/.test(lower)) return 'advanced';
  if (/(beginner|introduction|getting started|basics|101|tutorial for beginners)/.test(lower)) return 'beginner';
  if (/(intermediate|guide|how to|walkthrough)/.test(lower)) return 'intermediate';
  return 'unknown';
}

function heuristicSummarize(title, description, extractedText) {
  const source = extractedText || description || title || '';
  const sentences = source.match(/[^.!?]+[.!?]+/g) || [source];
  const shortSummary = (description || sentences.slice(0, 2).join(' ')).trim().slice(0, 280) ||
    `Saved link: ${title}`;
  const detailedSummary = sentences.slice(0, 6).join(' ').trim().slice(0, 900) || shortSummary;

  const keywords = topKeywords(`${title} ${description} ${extractedText}`, 10);
  const technologies = detectTechnologies(`${title} ${description} ${extractedText}`);
  const tags = Array.from(new Set([...technologies, ...keywords.slice(0, 6)])).slice(0, 10);
  const difficulty = detectDifficulty(`${title} ${description} ${extractedText}`);

  return {
    shortSummary,
    detailedSummary,
    keywords,
    tags,
    technologies,
    difficulty,
    relatedTopics: keywords.slice(0, 5),
    provider: 'heuristic',
  };
}

async function geminiSummarize({ title, description, extractedText, url, contentType }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `You are analyzing a saved web link for a personal knowledge management app.
URL: ${url}
Content type: ${contentType}
Title: ${title}
Description: ${description}
Page text (truncated): ${(extractedText || '').slice(0, 6000)}

Respond with ONLY valid minified JSON, no markdown fences, no preamble, matching exactly this shape:
{"shortSummary":"1-2 sentence summary (max 240 chars)","detailedSummary":"3-6 sentence detailed summary (max 900 chars)","keywords":["up","to","10","lowercase","keywords"],"tags":["up","to","8","short","tags"],"category":"one short category name","technologies":["mentioned","technologies","if","any"],"difficulty":"beginner|intermediate|advanced|unknown","relatedTopics":["up","to","5","related","topic","names"]}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn('[AI] Gemini API error, falling back to heuristic:', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      shortSummary: parsed.shortSummary?.slice(0, 280) || '',
      detailedSummary: parsed.detailedSummary?.slice(0, 1000) || '',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 10) : [],
      category: parsed.category || 'Uncategorized',
      technologies: Array.isArray(parsed.technologies) ? parsed.technologies.slice(0, 8) : [],
      difficulty: ['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty) ? parsed.difficulty : 'unknown',
      relatedTopics: Array.isArray(parsed.relatedTopics) ? parsed.relatedTopics.slice(0, 5) : [],
      provider: 'gemini',
    };
  } catch (err) {
    clearTimeout(timeout);
    console.warn('[AI] Gemini call failed, falling back to heuristic:', err.message);
    return null;
  }
}

/**
 * Main entry point: tries Gemini first (if GEMINI_API_KEY is set), and
 * automatically/silently falls back to the local heuristic engine on any
 * failure (missing key, network error, quota, bad JSON, timeout, etc.)
 * so link-saving NEVER breaks because of the AI provider.
 */
export async function analyzeContent({ title, description, extractedText, url, contentType }) {
  const geminiResult = await geminiSummarize({ title, description, extractedText, url, contentType }).catch(() => null);

  if (geminiResult) {
    const category = geminiResult.category || CATEGORY_MAP[contentType] || 'Uncategorized';
    return { ...geminiResult, category };
  }

  const heuristic = heuristicSummarize(title, description, extractedText);
  const category = CATEGORY_MAP[contentType] || 'Uncategorized';
  return { ...heuristic, category };
}

/**
 * Very small natural-language query parser used by search, e.g.
 * "Show me React authentication articles" -> { keywords: ['react','authentication'], contentType: 'article' }
 * This runs locally (no external AI call needed) so search stays fast and free.
 */
export function parseNaturalLanguageQuery(query) {
  const lower = query.toLowerCase();
  const stripped = lower
    .replace(/\b(show me|find|search for|get|list|give me|please|articles?|tutorials?|guides?|blogs?|posts?)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = stripped.split(' ').filter((w) => w && !STOPWORDS.has(w));
  const technologies = detectTechnologies(lower);

  let contentType = null;
  if (/article/.test(lower)) contentType = 'article';
  else if (/tutorial|guide/.test(lower)) contentType = null; // ambiguous, keep as keyword search
  else if (/video|youtube/.test(lower)) contentType = 'youtube';
  else if (/repo|github/.test(lower)) contentType = 'github';
  else if (/doc(s|umentation)?/.test(lower)) contentType = 'documentation';

  return {
    keywords: Array.from(new Set([...technologies, ...words])).slice(0, 8),
    contentType,
    raw: query,
  };
}

export default { analyzeContent, parseNaturalLanguageQuery };
