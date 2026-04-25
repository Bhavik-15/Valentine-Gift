// netlify/functions/upload.js
// Netlify serverless function — GitHub token stays safely on the server

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER || 'Bhavik-15';
  const GITHUB_REPO = process.env.GITHUB_REPO || 'Valentine-Gift';
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

  if (!GITHUB_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server not configured — GITHUB_TOKEN missing in Netlify env vars' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  const { action, filePath, fileContent, commitMessage, content, sha } = body;

  // ── Upload a single photo file ──
  if (action === 'upload') {
    if (!filePath || !fileContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'filePath and fileContent required' })
      };
    }
    try {
      // Check if file exists already (need sha to overwrite)
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
        return {
          statusCode: putRes.status,
          body: JSON.stringify({ error: err.message || 'GitHub API error' })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };

    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.message })
      };
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
      if (!r.ok) {
        return {
          statusCode: r.status,
          body: JSON.stringify({ error: 'Could not read data.js' })
        };
      }
      const d = await r.json();
      return {
        statusCode: 200,
        body: JSON.stringify({ content: d.content, sha: d.sha })
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  // ── Update data.js on GitHub ──
  if (action === 'update-data') {
    if (!content) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'content required' })
      };
    }
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
        return {
          statusCode: putRes.status,
          body: JSON.stringify({ error: err.message || 'GitHub API error' })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.message })
      };
    }
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Unknown action' })
  };
}
