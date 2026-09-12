// 이 브랜치에서만 사용하는 참가 진입 화면. 팀원 A의 기존 랜딩 페이지는 수정하지 않는다.
import { Link } from 'react-router-dom'
export function LandingPage() {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
      <section>
        <p className="eyebrow">YOUR WORDS, ON AIR</p>
        <h1 className="mt-6 text-6xl font-black leading-[1.12] tracking-tight sm:text-7xl">
          멋쟁이
          <br />
          <span className="text-accent">타자처럼.</span>
        </h1>
        <p className="mt-7 max-w-md text-lg leading-relaxed text-ink-muted">
          손끝에서 시작되는 나만의 방송.
          <br />
          다섯 문장을 정확하게 완성하고,
          <br />
          우리 채널에 당신의 기록을 남겨주세요.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link to="/participate" className="primary-button">
            참가하기 <span aria-hidden="true">↗</span>
          </Link>
          <Link to="/ranking" className="secondary-button">
            랭킹 보기
          </Link>
        </div>
        <p className="mt-5 text-sm text-ink-muted">최초 1회 무료 · 재도전 1회 500원</p>
      </section>
      <section
        className="rounded-3xl border border-line bg-surface-soft p-7 sm:p-10"
        aria-label="참여 방법"
      >
        <div className="flex justify-between text-xs tracking-widest text-ink-muted">
          <span>STUDIO GUIDE</span>
          <span>01 — 03</span>
        </div>
        <div aria-hidden="true" className="my-10 flex h-20 items-center justify-center gap-2">
          {[20, 40, 65, 35, 80, 55, 95, 65, 40, 75, 30, 55, 20].map((height, i) => (
            <span
              key={i}
              className="w-2 rounded-full bg-accent"
              style={{ height: `${height}%`, opacity: 0.4 + (i % 3) * 0.2 }}
            />
          ))}
        </div>
        <ol className="space-y-6">
          {[
            ['01', '참가자 확인', '닉네임과 전화번호로 참가를 확인해요.'],
            ['02', '채널 선택', '마음에 드는 라디오 채널을 골라요.'],
            ['03', '다섯 문장 완성', '정확하게 입력하고 완료 시간에 도전해요.'],
          ].map(([step, title, body]) => (
            <li key={step} className="flex gap-4 border-t border-line pt-5">
              <span className="font-mono text-accent">{step}</span>
              <div>
                <h2 className="font-bold">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
