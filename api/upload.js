// api/upload.js (Vercel Serverless Function)
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GITHUB_TOKEN  = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER  = process.env.GITHUB_OWNER  || 'Bhavik-15';
  const GITHUB_REPO   = process.env.GITHUB_REPO   || 'Valentine-Gift';
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'Server not configured — GITHUB_TOKEN missing in Vercel env vars' });
  }

  const { action, filePath, fileContent, commitMessage, content, sha } = req.body;

  // ── Upload a single photo file ──
  if (action === 'upload') {
    if (!filePath || !fileContent) {
      return res.status(400).json({ error: 'filePath and fileContent required' });
    }
    try {
      let existingSha;
      const checkRes = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(filePath)}`,
        { 
          headers: { 
            Authorization: `token ${GITHUB_TOKEN}`, 
            Accept: 'application/vnd.github.v3+json' 
          } 
        }
      );
      if (checkRes.ok) {
        const existing = await checkRes.json();
        existingSha = existing.sha;
      }

      const putBody = {
        message: commitMessage || `Upload: ${filePath}`,
        content: fileContent,
        branch: GITHUB_BRANCH,
        ...(existingSha && { sha: existingSha })
      };

      const putRes = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(filePath)}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json'
          },
          body: JSON.stringify(putBody)
        }
      );

      if (!putRes.ok) {
        const err = await putRes.json();
        return res.status(putRes.status).json({ error: err.message || 'GitHub API error' });
      }

      return res.status(200).json({ success: true });

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── Read data.js from GitHub ──
  if (action === 'read-data') {
    try {
      const r = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data.js`,
        { 
          headers: { 
            Authorization: `token ${GITHUB_TOKEN}`, 
            Accept: 'application/vnd.github.v3+json' 
          } 
        }
      );
      if (!r.ok) return res.status(r.status).json({ error: 'Could not read data.js' });
      const d = await r.json();
      return res.status(200).json({ content: d.content, sha: d.sha });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── Update data.js on GitHub ──
  if (action === 'update-data') {
    if (!content) return res.status(400).json({ error: 'content required' });
    try {
      const putBody = {
        message: 'Update data.js photo list',
        content,
        branch: GITHUB_BRANCH,
        ...(sha && { sha })
      };

      const putRes = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data.js`,
        {
          method: 'PUT',
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github.v3+json'
          },
          body: JSON.stringify(putBody)
        }
      );

      if (!putRes.ok) {
        const err = await putRes.json();
        return res.status(putRes.status).json({ error: err.message || 'GitHub API error' });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
