import { Link } from 'react-router-dom'
import { ROUTES } from '../../shared/constants/routes'
import { useQuery } from '@tanstack/react-query'
import { getCategories, getRankings } from '../../shared/api/endpoints'
import cassetteOlive from '../../shared/brand/images/cassette-olive.png'
import cassetteOrange from '../../shared/brand/images/cassette-orange.png'
import cassetteRed from '../../shared/brand/images/cassette-red.png'
import lpGreen from '../../shared/brand/images/LP_green.png'
import lpOrange from '../../shared/brand/images/LP_orange.png'
import lpRed from '../../shared/brand/images/LP_red.png'
import radioGreenWood from '../../shared/brand/images/radio_green_wood_transparent.png'
import onAirOff from '../../shared/brand/images/on-air-off.png'

// 기획팀 홈 화면의 정보 구조를 그대로 사용한다.
// 이 배열은 화면 표시용이며 카테고리 API, 참가자 세션, 게임 상태를 변경하지 않는다.
const channels = [
  {
    code: 'CH.01',
    title: '성결 멋사 ON AIR',
    color: '#730c02',
    cassette: cassetteRed,
  },
  {
    code: 'CH.02',
    title: '멋쟁이사자처럼',
    color: '#7b8055',
    cassette: cassetteOlive,
  },
  {
    code: 'CH.03',
    title: '페스티벌 라디오',
    color: '#e77b49',
    cassette: cassetteOrange,
  },
]

const participationSteps = [
  ['01', '참가자 확인', '닉네임과 전화번호로\n참가를 확인합니다.'],
  ['02', '채널 선택', '도전할 방송 테마를 고릅니다.'],
  ['03', '다섯 문장 완성', '정확하게 입력하고 기록을 남깁니다.'],
]

export function LandingPage() {
  const topRanking = useQuery({
    queryKey: ['home-top-ranking'],
    queryFn: async () => {
      const categories = await getCategories()
      const rows = await Promise.all(
        categories.map((category) =>
          getRankings(category.id).then((rankings) =>
            rankings.map((entry) => ({
              ...entry,
              categoryCode: category.code,
            })),
          ),
        ),
      )
      return rows
        .flat()
        .sort((left, right) => left.elapsedMs - right.elapsedMs)
        .slice(0, 3)
    },
  })
  const topRows = topRanking.data ?? []

  return (
    // 디자인만 담당하는 홈 전용 컨테이너다. 버튼은 실제 확정 라우트로 이동한다.
    <main className="home-page">
      {/* 좌우 필름 스트립: 화면 장식 전용이며 클릭·라우팅과 무관하다. */}
      <div className="home-film-strip home-film-left" aria-hidden />
      <div className="home-film-strip home-film-right" aria-hidden />
      <div className="home-hero-viewport">
        {/* 홈에서만 보이는 ON AIR. 다른 라우트의 헤더에는 나타나지 않는다. */}
        <img className="home-on-air-stage on-air-light-off" src={onAirOff} alt="" aria-hidden />
        <section className="home-hero" aria-labelledby="home-title">
          <img className="home-lp home-lp-red" src={lpRed} alt="" aria-hidden />
          <img
            className="home-lp home-lp-green"
            src={lpGreen}
            alt=""
            aria-hidden
          />
          <img
            className="home-lp home-lp-orange"
            src={lpOrange}
            alt=""
            aria-hidden
          />
          <img className="home-radio" src={radioGreenWood} alt="" aria-hidden />
          <div className="home-hero-copy">
            <h1 id="home-title">멋쟁이 타자처럼</h1>
            <p>당신의 타자로 완성하는 오늘의 방송</p>
          </div>
        </section>
      </div>

      <section className="home-content" aria-label="방송 정보">
        <div className="home-bottom-grid">
          <section aria-labelledby="channel-title">
            <h2 id="channel-title" className="home-section-title">
              오늘의 방송 편성표
            </h2>
            {/* 제목 주변의 빈 공간을 채우는 방송 정보 라벨. 카테고리·게임 데이터는 사용하지 않는다. */}
            <p className="home-section-meta">TODAY'S PROGRAM · 3 CHANNELS · 5 SENTENCES</p>
            <div className="home-channel-grid">
              {channels.map((channel) => (
                <article
                  className="home-channel-card"
                  key={channel.code}
                  style={
                    { '--channel-color': channel.color } as React.CSSProperties
                  }
                >
                  <img
                    className="home-cassette"
                    src={channel.cassette}
                    alt=""
                    aria-hidden
                  />
                  <div className="home-channel-label">
                    {/* 번호와 제목을 같은 줄에 두어 카세트 라벨 밖으로 잘리지 않게 한다. */}
                    <span>{channel.code}</span>
                    <h3>{channel.title}</h3>
                  </div>
                </article>
              ))}
            </div>
            <div className="home-actions">
              {/* 화면 문구는 시안의 '게임 시작'을 유지하고, 기존 참가자 입력 링크의 접근성 이름도 보존한다. */}
              <Link
                aria-label="참가하기"
                className="home-primary-action"
                to={ROUTES.PARTICIPATE}
              >
                게임 시작
              </Link>
              <Link className="home-secondary-action" to={ROUTES.RANKINGS}>
                랭킹 보기
              </Link>
            </div>
          </section>
          <aside className="home-ranking-panel" aria-labelledby="home-ranking-title">
            <h2 id="home-ranking-title">실시간 TOP 3</h2>
            <ol>
              {topRows.length > 0
                ? topRows.map((entry, index) => (
                    <li className="home-ranking-row" key={`${entry.categoryCode}-${entry.rank}-${entry.nickname}`}>
                      <span className="home-rank-number">0{index + 1}</span>
                      <div>
                        <strong>{entry.nickname}</strong>
                        <p>{entry.categoryCode}</p>
                      </div>
                      <time>{(entry.elapsedMs / 1_000).toFixed(3)}초</time>
                    </li>
                  ))
                : [1, 2, 3].map((rank) => (
                    <li className="home-ranking-row" key={rank}>
                      <span className="home-rank-number">0{rank}</span>
                      <div>
                        <strong>기록 대기</strong>
                        <p>방송 전</p>
                      </div>
                      <time>--.--초</time>
                    </li>
                  ))}
            </ol>
            <div className="home-ranking-note">
              <strong>랭킹 안내</strong>
              <p>참가자별·채널별 최고 기록만 반영됩니다.</p>
              <Link to={ROUTES.RANKINGS}>전체 랭킹 보기</Link>
            </div>
          </aside>
          {/* 오른쪽 참여 방법 패널은 안내만 보여준다. 실제 참가 이동은 게임 시작 링크가 맡는다. */}
          <aside
            className="home-participation-panel"
            aria-labelledby="participation-title"
          >
            <div className="home-participation-head">
              <h2 id="participation-title">참여 방법</h2>
              <span>● ON AIR</span>
            </div>
            <ol>
              {participationSteps.map(([number, title, description]) => (
                <li key={number}>
                  <span>{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>
    </main>
  )
}
