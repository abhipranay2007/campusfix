export function Notice({children,type='error'}){if(!children)return null;return <div className={`notice notice-${type}`} role="status">{children}</div>}
export function EmptyState({icon:Icon,title,body,action}){return <div className="empty-state"><div className="empty-icon">{Icon&&<Icon size={22}/>}</div><h3>{title}</h3><p>{body}</p>{action}</div>}
