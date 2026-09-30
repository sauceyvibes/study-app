import type { AdditionCollection } from '@/atlas/data/additions';
import type { Entry } from './form';

/**
 * Reading and committing the additions files through the GitHub contents API.
 *
 * The repository is the database. Each save is a commit to the target branch
 * (main, by default), which is what redeploys the public site — so an addition
 * has a diff, an author and a history, and can be reverted like any other change.
 * Writes carry the blob sha they were based on, so two saves racing each other
 * fail loudly instead of one silently erasing the other.
 */

export function githubConfig() {
  return {
    token: process.env.GITHUB_TOKEN ?? '',
    repo: process.env.GITHUB_REPO ?? 'sauceyvibes/study-app',
    branch: process.env.GITHUB_TARGET_BRANCH ?? 'main',
    api: process.env.GITHUB_API_URL ?? 'https://api.github.com',
  };
}

export function additionsPath(collection: AdditionCollection): string {
  return `src/atlas/data/additions/${collection}.json`;
}

export class GitHubError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function github(path: string, init: RequestInit = {}): Promise<Response> {
  const { token, api } = githubConfig();
  if (!token) throw new GitHubError('GITHUB_TOKEN is not set on this deployment', 500);
  return fetch(`${api}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
}

export interface CollectionFile {
  entries: Entry[];
  /** Blob sha of the file as read, or null when it does not exist yet. */
  sha: string | null;
}

export async function readCollection(collection: AdditionCollection): Promise<CollectionFile> {
  const { repo, branch } = githubConfig();
  const response = await github(
    `/repos/${repo}/contents/${additionsPath(collection)}?ref=${encodeURIComponent(branch)}`,
  );
  if (response.status === 404) return { entries: [], sha: null };
  if (!response.ok) throw new GitHubError(`GitHub read failed (${response.status}): ${await response.text()}`, 502);

  const body = (await response.json()) as { content?: string; encoding?: string; sha: string };
  if (body.encoding !== 'base64' || body.content === undefined) {
    throw new GitHubError(`${additionsPath(collection)} is too large for the contents API`, 502);
  }
  const text = Buffer.from(body.content, 'base64').toString('utf8');
  const entries = JSON.parse(text) as unknown;
  if (!Array.isArray(entries)) throw new GitHubError(`${additionsPath(collection)} is not a JSON array`, 502);
  return { entries: entries as Entry[], sha: body.sha };
}

export async function writeCollection(
  collection: AdditionCollection,
  entries: Entry[],
  sha: string | null,
  message: string,
): Promise<{ commitUrl: string }> {
  const { repo, branch } = githubConfig();
  const content = Buffer.from(`${JSON.stringify(entries, null, 2)}\n`, 'utf8').toString('base64');
  const response = await github(`/repos/${repo}/contents/${additionsPath(collection)}`, {
    method: 'PUT',
    body: JSON.stringify({ message, content, branch, ...(sha ? { sha } : {}) }),
  });
  if (response.status === 409 || response.status === 422) {
    throw new GitHubError('The file changed on GitHub since it was read', 409);
  }
  if (!response.ok) throw new GitHubError(`GitHub write failed (${response.status}): ${await response.text()}`, 502);
  const body = (await response.json()) as { commit: { html_url: string } };
  return { commitUrl: body.commit.html_url };
}
