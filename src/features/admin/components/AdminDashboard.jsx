import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ParticipantLookupPanel from './ParticipantLookupPanel'
import RankingPanel from './RankingPanel'
import lpRed from '../assets/images/LP_red.png'

// Two tabs = the locked admin scope (2026-09-13): 참가자 조회(read-only +
// PAID 발급 + 경기 무효화/복구), 랭킹 확인. 등록 마감 on/off is explicitly
// out of scope — see [[project-typing-admin-page]].
const TABS = [
  { id: 'participants', label: '참가자 조회' },
  { id: 'ranking', label: '랭킹 확인' },
]

// Shell shown after login: header + tab nav + the active tab's panel.
function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('participants')
  const navigate = useNavigate()

  return (
    <div>
      <header className="admin-header">
        <div className="admin-header__brand">
          <div className="admin-header__logo-wrap">
            <img className="admin-header__lp" src={lpRed} alt="" aria-hidden="true" />
            <div className="admin-header__logo">멋</div>
          </div>
          <div>
            <div className="admin-header__title">멋쟁이 타자처럼</div>
            <div className="admin-header__subtitle">
              <span className="admin-header__onair-dot" aria-hidden="true" />
              운영진 콘솔 · STAFF CONSOLE
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/play')}>
            참가자 화면으로
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onLogout}>
            로그아웃
          </button>
        </div>
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
      </div>
    </div>
  )
}

export default AdminDashboard
