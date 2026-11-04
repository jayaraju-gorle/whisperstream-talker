// Publishes the Lovable-hosted production site.
// Pushing this repo to the synced branch updates the Lovable editor only.
// Production (the custom domain) changes when this publish call succeeds.
//
// Setup (Business plan or higher, projects:write):
//   https://lovable.dev/settings/api-keys
//   LOVABLE_WORKSPACE_API_KEY=lov_...
//   LOVABLE_PROJECT_ID=prj_...   optional when the workspace has one project
//
//   node scripts/publish-lovable.mjs

const key = process.env.LOVABLE_WORKSPACE_API_KEY;
const version = "2026-09-11";

if (!key) {
  console.error("Set LOVABLE_WORKSPACE_API_KEY from https://lovable.dev/settings/api-keys");
  process.exit(1);
}

const headers = {
  "Lovable-API-Key": key,
  "Lovable-Version": version,
  Accept: "application/json",
  "Content-Type": "application/json",
};

async function api(path, init) {
  const response = await fetch(`https://api.lovable.dev${path}`, { ...init, headers });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const detail = body?.detail || body?.title || response.statusText;
    throw new Error(`${response.status} ${detail}`);
  }
  return { response, body };
}

async function projectId() {
  if (process.env.LOVABLE_PROJECT_ID) return process.env.LOVABLE_PROJECT_ID;
  const { body } = await api("/v1/projects?limit=50");
  const projects = body.data ?? [];
  if (projects.length === 1) return projects[0].id;
  console.error("Set LOVABLE_PROJECT_ID to one of:");
  for (const project of projects) {
    console.error(`  ${project.id}  ${project.name ?? "(unnamed)"}  published=${project.is_published}`);
  }
  process.exit(1);
}

const id = await projectId();
const started = await api(`/v1/projects/${id}/publish`, { method: "POST", body: "{}" });
const deploymentId = started.body.id;
const location = started.response.headers.get("location");
console.log(`Publishing ${id} (${deploymentId ?? location})`);

const statusPath = deploymentId ? `/v1/projects/${id}/publish/${deploymentId}` : location?.replace("https://api.lovable.dev", "");
if (!statusPath) throw new Error("Publish response did not include a deployment id");

for (let attempt = 0; attempt < 60; attempt++) {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const { body } = await api(statusPath);
  if (body.url) {
    console.log(`Live: ${body.url}`);
    process.exit(0);
  }
  if (body.error_message) {
    console.error(body.error_class ? `${body.error_class}: ${body.error_message}` : body.error_message);
    process.exit(1);
  }
  console.log(body.status ?? "running");
}

console.error("Publish is still running. Check the Lovable project.");
process.exit(1);
