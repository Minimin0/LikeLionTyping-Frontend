import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useSession } from '../../app/session'
import { errorMessage } from '../../shared/api/client'
import { getCategories } from '../../shared/api/endpoints'
import lpRed from '../../shared/brand/images/LP_red_hq.png'
import lpGreen from '../../shared/brand/images/LP_green_hq.png'
import lpOrange from '../../shared/brand/images/LP_orange_hq.png'
import micRed from '../../shared/brand/images/mic_red.png'
import headsetOrange from '../../shared/brand/images/headset_orange.png'
import radioGreen from '../../shared/brand/images/radio_green.png'
import selectionArrow from '../../shared/brand/images/selection-arrow.png'
import { Alert, Busy, buttonClass } from '../../shared/components'
import { ROUTES } from '../../shared/constants/routes'

// API가 주는 카테고리 이름은 그대로 사용하고, 화면 설명만 채널 순서에 맞게 보완한다.
const channelDetails = [
  {
    description: '성결대학교 · 멋쟁이사자처럼 · 캠퍼스 스토리',
    exampleLines: ['오늘의 성결대학교 축제 방송을', '시작합니다.'],
    color: '#850e04',
    lp: lpRed,
    icon: micRed,
  },
  {
    description: '다른 대학 · 캠퍼스 · 청춘 · 교류',
    exampleLines: ['서로 다른 캠퍼스의 이야기가', '하나의 주파수로 이어집니다.'],
    color: '#7b8055',
    lp: lpGreen,
    icon: headsetOrange,
  },
  {
    description: 'Festival · Music · Radio · Night',
    exampleLines: ['음악이 흐르는 축제의 밤을', '함께 기록 해 보세요.'],
    color: '#ef7940',
    lp: lpOrange,
    icon: radioGreen,
  },
]

// 서버 값이 CH01처럼 오더라도, 기획 시안의 CH.01 표기로만 보여 준다.
const displayCode = (code: string) => code.replace(/^CH\.?(\d+)$/i, 'CH.$1')

export function CategoriesPage() {
  const navigate = useNavigate()
  const { participant } = useSession()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  // 응답이 배열이 아닐 수 있다. 그대로 map을 돌리면 화면 전체가 죽는다.
  const rows = Array.isArray(categories.data) ? categories.data : []
  // 선택 전에는 첫 채널을 보여 주되, 실제 시작 버튼은 해당 채널 id로 이동한다.
  const selected =
    rows.find((category) => category.id === selectedId) ?? rows[0]
  const selectedIndex = Math.max(
    0,
    rows.findIndex((category) => category.id === selected?.id),
  )
  const selectedDetail = channelDetails[selectedIndex] ?? channelDetails[0]
  const isEmpty =
    !categories.isLoading && !categories.error && rows.length === 0

  // 참가자 정보가 없으면 참가자 확인 화면으로 보낸다. (팀 확정: 목적지만 /participate)
  if (!participant) return <Navigate to={ROUTES.PARTICIPATE} replace />

  return (
    // 디자인 className만 새로 두고, 카테고리 조회와 게임 이동은 기존 함수를 그대로 쓴다.
    <section
      className={`radio-category-stage category-theme-${selectedIndex}`}
      style={
        { '--channel-accent': selectedDetail.color } as React.CSSProperties
      }
      >
      <header className="category-studio-header">
        <Link className="category-home-link" to={ROUTES.LANDING}>
          LIKELION TYPING
        </Link>
        <span>/</span>
        <span>성결대학교 축제 부스</span>
        <strong>02 / 03</strong>
      </header>
      <div className="category-studio-title">
        <p>오늘의 방송</p>
        <h1>게임 테마를 선택하세요</h1>
      </div>
      <img
        className="category-studio-lp"
        src={selectedDetail.lp}
        alt=""
        aria-hidden
      />

      {categories.isLoading && (
        <div className="category-loading">
          <Busy label="불러오는 중" />
        </div>
      )}
      {categories.error && <Alert>{errorMessage(categories.error)}</Alert>}

      {!categories.isLoading && !categories.error && selected && (
        <div className="category-studio-layout">
          <article className="category-selected-card" aria-live="polite">
            <p className="category-selected-code">
              {displayCode(selected.code)} <span>/ 선택됨</span>
            </p>
            <h2>{selected.name}</h2>
            <p className="category-selected-description">
              {selectedDetail.description}
            </p>
            <div className="category-example">
              <span>문장 예시</span>
              <p>
                “ {selectedDetail.exampleLines[0]}
                <br />
                <span className="category-example-indent">
                  {selectedDetail.exampleLines[1]}
                </span>{' '}
                ”
              </p>
            </div>
            <div className="category-record-guide">
              <span>5문장</span>
              <i />
              <span>약 1분</span>
              <i />
              <span>기록 경쟁</span>
              <img
                className="category-record-icon"
                src={selectedDetail.icon}
                alt=""
                aria-hidden
              />
            </div>
          </article>
          {/* 종이 화살표는 상세 카드에서 오른쪽 채널 목록으로 시선을 안내한다. */}
          <img
            className="category-selection-arrow"
            src={selectionArrow}
            alt=""
            aria-hidden
            style={{ '--arrow-row': selectedIndex } as React.CSSProperties}
          />
          <div className="category-choice-area">
            <p className="category-choice-label">채널 선택</p>
            <div className="category-choice-list" aria-label="채널 목록">
              {rows.map((category, index) => {
                const active = category.id === selected.id
                const detail = channelDetails[index] ?? channelDetails[0]
                return (
                  <button
                    key={category.id}
                    type="button"
                    className={`category-choice-card ${active ? 'is-selected' : ''}`}
                    style={
                      { '--card-color': detail.color } as React.CSSProperties
                    }
                    aria-pressed={active}
                    onClick={() => setSelectedId(category.id)}
                  >
                    <span className="category-choice-top">
                      <small>{displayCode(category.code)}</small>
                      {active && <em>✓ 선택됨</em>}
                    </span>
                    <strong>
                      {category.name}
                      <img
                        className="category-choice-icon"
                        src={detail.icon}
                        alt=""
                        aria-hidden
                      />
                    </strong>
                    <span>{detail.description}</span>
                  </button>
                )
              })}
            </div>
            <div className="category-studio-actions">
              <button
                type="button"
                onClick={() => navigate(ROUTES.PARTICIPATE)}
              >
                이전
              </button>
              <button
                type="button"
                onClick={() => navigate(ROUTES.GAME(selected.id))}
              >
                이 테마로 시작 <ArrowRight aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="category-empty">
          <p>카테고리를 불러오지 못했습니다</p>
          <button
            type="button"
            className={buttonClass}
            onClick={() => categories.refetch()}
          >
            다시 시도
          </button>
        </div>
      )}
    </section>
  )
}
