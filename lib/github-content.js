// Reads/writes a single file in the site's own GitHub repo via the REST
// Contents API. Used to update public/media.json so a normal `git push`
// triggers the existing Vercel GitHub integration to rebuild and
// redeploy the static site — no separate deploy mechanism needed.

const API_BASE = 'https://api.github.com';

function env() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // "owner/name"
  if (!token || !repo) throw new Error('GITHUB_TOKEN / GITHUB_REPO env vars are not set');
  return { token, repo };
}

async function githubRequest(path, options = {}) {
  const { token } = env();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`GitHub API ${options.method || 'GET'} ${path} -> ${res.status}: ${detail}`);
  }
  return res.json();
}

/** Returns { content: object, sha: string } for a JSON file in the repo. */
export async function readJsonFile(filePath) {
  const { repo } = env();
  const data = await githubRequest(`/repos/${repo}/contents/${filePath}`);
  const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
  return { content, sha: data.sha };
}

/** Commits new JSON content to a file, given the sha readJsonFile returned. */
export async function writeJsonFile(filePath, content, sha, commitMessage) {
  const { repo } = env();
  const body = Buffer.from(JSON.stringify(content, null, 2) + '\n').toString('base64');
  return githubRequest(`/repos/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: commitMessage,
      content: body,
      sha,
      branch: 'main',
    }),
  });
}
