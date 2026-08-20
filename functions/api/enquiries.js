// GET /api/enquiries -> the enquiry inbox for the dashboard.
//
// A static path segment wins over the dynamic /api/[collection] route, so this is not
// confused with a content collection. Gated by the middleware like everything else here.
//
// Enquiries are content the client receives rather than content they write, so they live
// outside the publish flow entirely: reading one changes nothing on the public website.
import { json } from './_shared.js';

const PAGE = 50;

export async function onRequestGet({ env, request }) {
  const u = new URL(request.url);
  const status = u.searchParams.get('status') || 'open';   // open | archived | all
  const limit = Math.min(200, Math.max(1, parseInt(u.searchParams.get('limit') || PAGE, 10) || PAGE));
  const offset = Math.max(0, parseInt(u.searchParams.get('offset') || '0', 10) || 0);

  const where = status === 'all' ? '1=1'
    : status === 'archived' ? "status='archived'"
    : "status<>'archived'";

  const rows = await env.DB.prepare(
    `SELECT e.id,e.kind,e.name,e.email,e.phone,e.company,e.subject,e.message,e.reason,
            e.market,e.position,e.route_email,e.lang,e.status,e.notified,e.notify_error,
            e.created_at,
            (SELECT COUNT(*) FROM enquiry_files f WHERE f.enquiry_id=e.id) AS files
       FROM enquiries e
      WHERE ${where}
      ORDER BY e.created_at DESC
      LIMIT ?1 OFFSET ?2`
  ).bind(limit, offset).all();

  // The counts the dashboard shows without asking a second time.
  const counts = await env.DB.prepare(
    `SELECT
       SUM(CASE WHEN status='new' THEN 1 ELSE 0 END)      AS unread,
       SUM(CASE WHEN status<>'archived' THEN 1 ELSE 0 END) AS open,
       COUNT(*)                                            AS total,
       SUM(CASE WHEN notified=0 AND status<>'archived' THEN 1 ELSE 0 END) AS unnotified
     FROM enquiries`
  ).first();

  return json({
    items: rows.results || [],
    counts: {
      unread: (counts && counts.unread) || 0,
      open: (counts && counts.open) || 0,
      total: (counts && counts.total) || 0,
      unnotified: (counts && counts.unnotified) || 0,
    },
  });
}
