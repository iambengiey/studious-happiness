function page(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>body{font-family:Arial;margin:0;background:#f7f9ff;color:#1e2940}header{background:#112f73;color:#fff;padding:14px 18px}main{padding:20px;max-width:1100px;margin:0 auto}.card{background:#fff;border-radius:10px;padding:16px;box-shadow:0 3px 12px rgba(0,0,0,.07);margin-bottom:14px}code{background:#eef3ff;padding:2px 6px;border-radius:6px}</style></head><body><header><h1 style="margin:0">CampusConnect Africa Admin Console</h1></header><main>${body}</main></body></html>`;
}

function renderDashboard(user) {
  return page('Admin Console', `
    <div class="card"><h2>Authenticated Session</h2><p>User: <strong>${user.user_id}</strong> | Role: <strong>${user.role}</strong> | Institution: <strong>${user.institution_id || 'GLOBAL'}</strong></p></div>
    <div class="card"><h2>Admin Modules</h2><ul>
      <li>Institutions onboarding with country compliance profile</li>
      <li>Hierarchy targeting: Country → Institution → Division → Unit → Group</li>
      <li>Contacts CSV import</li>
      <li>Template management (global/country/institution)</li>
      <li>Send console (create once, render per channel)</li>
      <li>Audit + send logs + delivery status</li>
    </ul></div>
  `);
}

module.exports = { renderDashboard };
