import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, MapPin, MessageSquare, ThumbsUp, UserRound, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusPill } from '../components/IssueCard';
import { Notice } from '../components/Feedback';

const transitions = {
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED'],
};
const titleCase = value => value?.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [nextStatus, setNextStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [comment, setComment] = useState('');

  async function refresh() {
    try {
      const result = await api(`/issues/${id}`);
      setIssue(result.issue);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }
  useEffect(() => { refresh(); }, [id]);

  async function act(action) {
    setBusy(true);
    setError('');
    try {
      await action();
      await refresh();
      setNextStatus('');
      setStatusComment('');
      setComment('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!issue) return <>
    <div className="back-link"><Link to="/issues"><ArrowLeft size={15}/> Back to issues</Link></div>
    <Notice>{error || 'Loading issue…'}</Notice>
  </>;

  const own = String(issue.creator?._id || issue.creator) === String(user.id || user._id);
  const staff = user.role === 'STAFF';
  const closed = ['RESOLVED', 'REJECTED'].includes(issue.status);
  const availableTransitions = transitions[issue.status] || [];
  const supportAction = () => api(`/issues/${id}/support`, { method: issue.supportedByMe ? 'DELETE' : 'POST' });

  return <>
    <div className="back-link"><Link to="/issues"><ArrowLeft size={15}/> Back to issues</Link></div>
    <Notice>{error}</Notice>
    <div className="detail-layout">
      <main>
        <div className="detail-heading">
          <div className="issue-card-top"><span className={`category-dot cat-${issue.category.toLowerCase()}`}/><span className="category-label">{titleCase(issue.category)}</span><StatusPill status={issue.status}/></div>
          <h1>{issue.title}</h1>
          <div className="detail-meta"><span><MapPin size={15}/>{issue.location}</span><span><CalendarDays size={15}/>{new Date(issue.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span><span className={`severity severity-${issue.severity.toLowerCase()}`}>{titleCase(issue.severity)} severity</span></div>
        </div>
        <section className="content-panel detail-description"><h2>Issue description</h2><p>{issue.description}</p></section>
        <section className="content-panel activity-panel">
          <div className="panel-heading"><div><h2>Activity & updates</h2><p>Progress recorded by students and campus staff.</p></div></div>
          <div className="timeline">{[...issue.activity].reverse().map((entry, index) => <div className="timeline-item" key={entry._id || index}>
            <span className={`timeline-icon ${entry.type === 'STATUS_CHANGED' ? 'timeline-status' : ''}`}>{entry.type === 'COMMENT' ? <MessageSquare size={15}/> : entry.type === 'SUPPORT_ADDED' ? <ThumbsUp size={15}/> : <CalendarDays size={15}/>}</span>
            <div className="timeline-copy"><div className="timeline-title"><b>{entry.actor?.name || 'CampusFix'}</b><span>{new Date(entry.createdAt).toLocaleString()}</span></div><p>{entry.message}</p>{entry.fromStatus && <small>{titleCase(entry.fromStatus)} → {titleCase(entry.toStatus)}</small>}</div>
          </div>)}</div>
        </section>
      </main>
      <aside className="detail-sidebar">
        <section className="content-panel support-box">
          <div className="support-big"><Users size={18}/><strong>{issue.supportCount}</strong><span>students support this</span></div>
          {staff ? <p className="side-help">Priority score <b>{issue.priorityScore}</b> · {titleCase(issue.priorityBand)}</p> : own ? <p className="side-help">You reported this issue. Community members can add support.</p> : closed && !issue.supportedByMe ? <p className="side-help">This issue is closed and can no longer receive support.</p> : <button disabled={busy} className={`support-button ${issue.supportedByMe ? 'supported' : ''}`} onClick={() => act(supportAction)}><ThumbsUp size={16}/>{issue.supportedByMe ? 'Remove my support' : 'I have this issue too'}</button>}
        </section>
        <section className="content-panel reporter-box"><h3>Report details</h3><div><span>Reported by</span><b><UserRound size={14}/>{own ? 'You' : issue.creator?.name || 'Campus student'}</b></div><div><span>Category</span><b>{titleCase(issue.category)}</b></div><div><span>Severity</span><b>{titleCase(issue.severity)}</b></div></section>
        {staff && !closed && <section className="content-panel staff-actions">
          <h3>Update report</h3>
          <label>Status<select value={nextStatus} onChange={event => setNextStatus(event.target.value)}><option value="">Choose next status</option>{availableTransitions.map(status => <option value={status} key={status}>{titleCase(status)}</option>)}</select></label>
          <label>Update note{nextStatus === 'REJECTED' ? ' · required' : ''}<textarea rows="3" maxLength="500" value={statusComment} onChange={event => setStatusComment(event.target.value)} placeholder="Share what changed or why…"/></label>
          <button className="primary-button full-button" disabled={!nextStatus || busy || (nextStatus === 'REJECTED' && statusComment.trim().length < 5)} onClick={() => act(() => api(`/issues/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, comment: statusComment.trim() || undefined }) }))}>{busy ? 'Saving…' : 'Save update'}</button>
          <div className="staff-comment"><label>Staff comment<textarea rows="2" maxLength="500" value={comment} onChange={event => setComment(event.target.value)} placeholder="Add a note to the activity history"/></label><button className="secondary-button full-button" disabled={busy || comment.trim().length < 2} onClick={() => act(() => api(`/issues/${id}/comments`, { method: 'POST', body: JSON.stringify({ comment: comment.trim() }) }))}>Add comment</button></div>
        </section>}
        {staff && closed && <section className="content-panel staff-actions"><h3>Report closed</h3><p className="side-help">This issue is {titleCase(issue.status).toLowerCase()}. The status workflow is complete.</p></section>}
      </aside>
    </div>
  </>;
}
