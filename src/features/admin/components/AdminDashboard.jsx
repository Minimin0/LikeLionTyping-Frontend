import { useState } from 'react'
import ParticipantLookupPanel from './ParticipantLookupPanel'
import RankingPanel from './RankingPanel'
import OperationsPanel from './OperationsPanel'

// Three tabs = the three operator jobs from the Notion 운영진 화면 spec:
// 참가자 조회(+결제 확인/이용권 발급/무효 처리), 랭킹 확인, 마감 관리.
const TABS = [
  { id: 'participants', label: '참가자 조회' },
  { id: 'ranking', label: '랭킹 확인' },
  { id: 'operations', label: '운영 관리' },
]

// Shell shown after login: header + tab nav + the active tab's panel.
function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('participants')

  return (
    <div>
      <header className="admin-header">
        <div className="admin-header__brand">
          <div className="admin-header__logo">멋</div>
          <div>
            <div className="admin-header__title">멋쟁이 타자처럼</div>
            <div className="admin-header__subtitle">운영진 콘솔 · STAFF CONSOLE</div>
          </div>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onLogout}>
          로그아웃
        </button>
      </header>

      <div className="admin-body">
        <nav className="admin-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-tab ${activeTab === tab.id ? 'admin-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'participants' && <ParticipantLookupPanel />}
        {activeTab === 'ranking' && <RankingPanel />}
        {activeTab === 'operations' && <OperationsPanel />}
      </div>
    </div>
  )
}

export default AdminDashboard
