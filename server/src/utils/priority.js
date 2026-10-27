const severityPoints = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
function scorePriority(issue, now = new Date()) {
  const severity = severityPoints[issue.severity] || 0;
  const supporters = Math.min(Math.max(Number(issue.supporters?.length ?? issue.supportCount ?? 0), 0), 10);
  const createdAt = new Date(issue.createdAt || now);
  const unresolvedDays = issue.status === 'RESOLVED' || issue.status === 'REJECTED'
    ? 0 : Math.min(Math.max((now.getTime() - createdAt.getTime()) / 86400000, 0), 30);
  return Math.round((severity * 10 + supporters * 2 + unresolvedDays * 0.5) * 100) / 100;
}
function priorityBand(score) { return score >= 50 ? 'URGENT' : score >= 35 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW'; }
module.exports = { scorePriority, priorityBand };
