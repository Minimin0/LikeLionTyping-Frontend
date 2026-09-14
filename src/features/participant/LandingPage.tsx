import { ArrowRight, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonClass, secondaryButtonClass } from '../../shared/components'
import { ROUTES } from '../../shared/constants/routes'
import lpRed from '../../shared/brand/images/LP_red.png'
import radio from '../../shared/brand/images/radio_green_wood_transparent.png'

const steps = [
  ['01', '참가자 확인', '닉네임과 전화번호로 참가를 확인합니다.'],
  ['02', '카테고리 선택', '도전할 라디오 채널을 고릅니다.'],
  ['03', '다섯 문장 완성', '정확하게 입력하고 완료 기록을 남깁니다.'],
]

export function LandingPage() {
  return (
    // 디자인 전용 마크업. 이동 경로와 버튼 동작은 기존 Link를 그대로 사용한다.
    <div className="radio-landing page-enter">
      <section className="landing-hero">
        <img className="landing-lp" src={lpRed} alt="" aria-hidden />
        <img className="landing-radio" src={radio} alt="" aria-hidden />
        <div className="landing-copy">
          <p className="radio-eyebrow">오늘의 방송 · 성결대학교 축제 부스</p>
          <h1>멋쟁이<br />타자처럼</h1>
          <p className="landing-description">
          다섯 문장을 정확하게 완성하고
          <br />
          우리 채널에 당신의 기록을 남겨주세요.
        </p>
        <div className="landing-actions">
          <Link to={ROUTES.PARTICIPATE} className={buttonClass}>
            참가하기
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link to={ROUTES.RANKINGS} className={secondaryButtonClass}>
            <Trophy className="size-4" aria-hidden />
            랭킹 보기
          </Link>
        </div>
        <p className="landing-fee">
          최초 1회 무료 · 재도전 1회 500원
        </p>
        </div>
      </section>

      <section className="landing-guide" aria-labelledby="studio-guide-title">
        <div className="landing-guide-head">
          <h2
            id="studio-guide-title"
            className="text-sm font-black tracking-[0.16em] text-zinc-700"
          >
            STUDIO GUIDE
          </h2>
          <span className="on-air-label">
            ● ON AIR
          </span>
        </div>
        <ol className="landing-steps">
          {steps.map(([step, title, description]) => (
            <li
              key={step}
              className="landing-step"
            >
              <span className="step-number">
                {step}
              </span>
              <div>
                <h3>{title}</h3>
                <p>
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
