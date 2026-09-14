import { ArrowRight, Radio, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonClass, secondaryButtonClass } from '../../shared/components'
import { ROUTES } from '../../shared/constants/routes'

const steps = [
  ['01', '참가자 확인', '닉네임과 전화번호로 참가를 확인합니다.'],
  ['02', '카테고리 선택', '도전할 라디오 채널을 고릅니다.'],
  ['03', '다섯 문장 완성', '정확하게 입력하고 완료 기록을 남깁니다.'],
]

export function LandingPage() {
  return (
    <div className="page-enter grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
      <section className="py-4">
        <p className="flex items-center gap-2 text-sm font-bold tracking-[0.18em] text-emerald-700">
          <Radio className="size-4" aria-hidden />
          YOUR WORDS, ON AIR
        </p>
        <h1 className="mt-5 text-5xl font-black leading-[1.08] tracking-tight text-zinc-950 sm:text-7xl">
          멋쟁이
          <br />
          <span className="text-emerald-700">타자처럼.</span>
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-600">
          다섯 문장을 정확하게 완성하고
          <br />
          우리 채널에 당신의 기록을 남겨주세요.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={ROUTES.PARTICIPATE} className={buttonClass}>
            참가하기
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link to={ROUTES.RANKINGS} className={secondaryButtonClass}>
            <Trophy className="size-4" aria-hidden />
            랭킹 보기
          </Link>
        </div>
        <p className="mt-4 text-sm text-zinc-500">
          최초 1회 무료 · 재도전 1회 500원
        </p>
      </section>

      <section
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
        aria-labelledby="studio-guide-title"
      >
        <div className="flex items-center justify-between">
          <h2
            id="studio-guide-title"
            className="text-sm font-black tracking-[0.16em] text-zinc-700"
          >
            STUDIO GUIDE
          </h2>
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
            ● ON AIR
          </span>
        </div>
        <div
          className="my-8 flex h-16 items-center justify-center gap-2"
          aria-hidden="true"
        >
          {[22, 42, 68, 36, 82, 56, 96, 64, 38, 74, 30, 52, 20].map(
            (height, index) => (
              <span
                key={index}
                className="w-2 rounded-full bg-emerald-600"
                style={{
                  height: `${height}%`,
                  opacity: 0.45 + (index % 3) * 0.2,
                }}
              />
            ),
          )}
        </div>
        <ol className="space-y-5">
          {steps.map(([step, title, description]) => (
            <li
              key={step}
              className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-zinc-200 pt-4"
            >
              <span className="font-mono font-bold text-emerald-700">
                {step}
              </span>
              <div>
                <h3 className="font-black text-zinc-900">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
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
