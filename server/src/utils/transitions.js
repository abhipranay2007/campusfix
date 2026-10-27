const transitions = {
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: [], REJECTED: [],
};
function canTransition(from, to) { return (transitions[from] || []).includes(to); }
module.exports = { transitions, canTransition };
