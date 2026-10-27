import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, CheckCircle2, Clock3, ClipboardList, Plus, Radio, Search, ShieldAlert, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import IssueCard, { StatusPill } from '../components/IssueCard';
import { EmptyState, Notice } from '../components/Feedback';

export default function Dashboard() {
  const { user } = useAuth();
  return user.role === 'STAFF' ? <StaffDashboard /> : <StudentDashboard />;
}

function StudentDashboard() {
  const [mine, setMine] = useState([]);
  const [community, setCommunity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/issues?scope=mine'), api('/issues?scope=community&sort=priority')])
      .then(([own, other]) => { setMine(own.issues); setCommunity(other.issues); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const active = mine.filter(issue => !['RESOLVED', 'REJECTED'].includes(issue.status)).length;
  return <>
    <div className="welcome-row">
      <div><span className="eyebrow">YOUR CAMPUS, YOUR VOICE</span><h1>Good to see you.</h1><p>Here’s what’s happening around campus today.</p></div>
      <Link className="primary-button" to="/report"><Plus size={17}/> Report an issue</Link>
    </div>
    <Notice>{error}</Notice>
    <section className="metric-grid student-metrics">
      <Metric icon={Activity} label="Your reports" value={mine.length} tone="blue"/>
      <Metric icon={Clock3} label="Still in progress" value={active} tone="amber"/>
      <Metric icon={CheckCircle2} label="Resolved" value={mine.filter(issue => issue.status === 'RESOLVED').length} tone="green"/>
      <Metric icon={Users} label="Community reports" value={community.length} tone="violet"/>
    </section>
    <div className="dashboard-columns">
      <section className="content-panel">
        <div className="panel-heading"><div><h2>Your reports</h2><p>Follow updates on the issues you’ve raised.</p></div><Link to="/issues?scope=mine" className="text-link">View all <ArrowUpRight size={15}/></Link></div>
        {loading ? <LoadingRows/> : mine.length ? <div className="issue-list">{mine.slice(0, 4).map(issue => <IssueRow key={issue._id} issue={issue}/>)}</div> : <EmptyState icon={Activity} title="No reports yet" body="Spotted a campus issue? Let your campus team know." action={<Link className="secondary-button" to="/report">Create your first report</Link>}/>}
      </section>
      <section className="content-panel community-panel">
        <div className="panel-heading"><div><h2>Needs attention</h2><p>Community reports with the most support.</p></div><span className="live-pill"><span/> LIVE</span></div>
        {loading ? <LoadingRows/> : community.length ? <div className="compact-list">{community.slice(0, 3).map(issue => <IssueCard key={issue._id} issue={issue} compact/>)}</div> : <EmptyState icon={Users} title="No community reports" body="New campus reports from other students will show up here."/>}
      </section>
    </div>
  </>;
}

function StaffDashboard() {
  const [data, setData] = useState(null);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    Promise.all([api('/dashboard'), api('/issues?sort=priority')])
      .then(([summary, queue]) => { setData(summary); setIssues(queue.issues); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = issues.filter(issue => (!status || issue.status === status) && (!search || `${issue.title} ${issue.location}`.toLowerCase().includes(search.toLowerCase())));
  const maxCategoryCount = Math.max(1, ...Object.values(data?.byCategory || {}));
  return <>
    <div className="welcome-row"><div><span className="eyebrow">CAMPUS OPERATIONS</span><h1>Operations overview</h1><p>Review reports, prioritize the work, and keep students informed.</p></div><span className="live-pill"><span/> LIVE DATA</span></div>
    <Notice>{error}</Notice>
    <section className="metric-grid">
      <Metric icon={ClipboardList} label="Total reports" value={data?.metrics.total ?? '—'} tone="blue"/>
      <Metric icon={Radio} label="Open issues" value={data?.metrics.open ?? '—'} tone="amber"/>
      <Metric icon={Activity} label="In progress" value={data?.metrics.inProgress ?? '—'} tone="violet"/>
      <Metric icon={CheckCircle2} label="Resolved" value={data?.metrics.resolved ?? '—'} tone="green"/>
      <Metric icon={Clock3} label="Avg. resolution" value={data?.metrics.avgResolutionHours == null ? '—' : `${data.metrics.avgResolutionHours}h`} tone="blue"/>
    </section>
    <div className="staff-insights">
      <section className="content-panel category-panel">
        <div className="panel-heading"><div><h2>Reports by category</h2><p>Distribution across issue types.</p></div><TrendingUp size={18} className="muted-icon"/></div>
        {loading ? <LoadingRows/> : !data?.metrics.total ? <EmptyState icon={Activity} title="No reports to chart" body="Submitted campus reports will appear here."/> : <div className="bar-list">{Object.entries(data.byCategory).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]).map(([category, count]) => <div className="bar-row" key={category}><span>{titleCase(category)}</span><div className="bar-track"><i style={{ width: `${Math.max(8, count / maxCategoryCount * 100)}%` }}/></div><b>{count}</b></div>)}</div>}
      </section>
      <section className="content-panel priority-panel">
        <div className="panel-heading"><div><h2>Priority watch</h2><p>Unresolved issues needing attention.</p></div><ShieldAlert size={18} className="muted-icon"/></div>
        {data?.highPriority?.length ? data.highPriority.slice(0, 4).map(issue => <Link to={`/issues/${issue._id}`} className="priority-row" key={issue._id}><span className={`priority-mark ${issue.priorityBand.toLowerCase()}`}/><span className="priority-copy"><b>{issue.title}</b><small>{issue.location} · {issue.supportCount} supporting</small></span><span className="priority-score">{issue.priorityScore}</span></Link>) : <EmptyState icon={CheckCircle2} title="Nothing urgent" body="No high-priority unresolved reports right now."/>}
      </section>
    </div>
    <section className="content-panel recent-panel">
      <div className="panel-heading"><div><h2>Recent activity</h2><p>Latest recorded report updates.</p></div><Activity size={18} className="muted-icon"/></div>
      {loading ? <LoadingRows/> : data?.recentActivity?.length ? <div className="recent-list">{data.recentActivity.map((event, index) => <Link to={`/issues/${event.id}`} className="recent-row" key={`${event.id}-${index}`}><span className="recent-icon"><Activity size={14}/></span><span className="recent-copy"><b>{event.title}</b><small>{event.actor || 'CampusFix'} · {event.message}</small></span><time>{new Date(event.createdAt).toLocaleDateString()}</time></Link>)}</div> : <EmptyState icon={Activity} title="No activity yet" body="Issue submissions and staff updates will appear here."/>}
    </section>
    <section className="content-panel queue-panel">
      <div className="panel-heading queue-heading"><div><h2>Issue queue</h2><p>Ranked by explainable priority score.</p></div><Link to="/issues" className="text-link">Full queue <ArrowUpRight size={15}/></Link></div>
      <div className="filters"><label className="search-field"><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search title or location"/></label><select value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map(value => <option key={value} value={value}>{titleCase(value)}</option>)}</select></div>
      {loading ? <LoadingRows/> : filtered.length ? <div className="queue-table"><div className="queue-head"><span>ISSUE</span><span>LOCATION</span><span>PRIORITY</span><span>STATUS</span></div>{filtered.slice(0, 8).map(issue => <Link to={`/issues/${issue._id}`} className="queue-row" key={issue._id}><span className="queue-title"><b>{issue.title}</b><small>{titleCase(issue.category)} · {titleCase(issue.severity)}</small></span><span>{issue.location}</span><span className={`priority-text ${issue.priorityBand.toLowerCase()}`}>{issue.priorityScore} · {titleCase(issue.priorityBand)}</span><StatusPill status={issue.status}/></Link>)}</div> : <EmptyState icon={Search} title="No matching issues" body="Try adjusting the search or status filter."/>}
    </section>
  </>;
}

function titleCase(value) { return value?.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase()); }
function Metric({ icon: Icon, label, value, tone }) { return <div className="metric-card"><div className={`metric-icon tone-${tone}`}><Icon size={19}/></div><div><span>{label}</span><strong>{value}</strong></div></div>; }
function IssueRow({ issue }) { return <Link to={`/issues/${issue._id}`} className="issue-row"><span className={`category-dot cat-${issue.category.toLowerCase()}`}/><span className="issue-row-main"><b>{issue.title}</b><small>{issue.location} · {titleCase(issue.category)}</small></span><StatusPill status={issue.status}/><ArrowUpRight size={16} className="muted-icon"/></Link>; }
function LoadingRows() { return <div className="loading-rows"><div/><div/><div/></div>; }
