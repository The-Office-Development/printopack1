// POST   /api/enquiries/:id  { status }  -> mark an enquiry read or archived
// DELETE /api/enquiries/:id             -> remove it, and the files that came with it
import { json, bad } from '../_shared.js';

const STATUSES = ['new', 'read', 'archived'];

export async function onRequestPost({ env, params, request }) {
  let body = {};
  try { body = await request.json(); } catch (e) { /* an empty body just means "mark read" */ }
  const status = body && body.status ? String(body.status) : 'read';
  if (!STATUSES.includes(status)) return bad('unknown status');
  await env.DB.prepare('UPDATE enquiries SET status=?2 WHERE id=?1').bind(params.id, status).run();
  return json({ ok: true });
}

export async function onRequestDelete({ env, params }) {
  // The attachments go with it. They are only ever reachable through their enquiry, so
  // leaving them behind would mean bytes in the database that nothing can ever open again.
  await env.DB.batch([
    env.DB.prepare('DELETE FROM enquiry_files WHERE enquiry_id=?').bind(params.id),
    env.DB.prepare('DELETE FROM enquiries WHERE id=?').bind(params.id),
  ]);
  return json({ ok: true });
}
