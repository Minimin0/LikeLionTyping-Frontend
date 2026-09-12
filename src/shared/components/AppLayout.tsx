// 참가자 영역의 내비게이션과 공통 프레임. 게임·운영자 내부 화면에는 개입하지 않는다.
import { Link, Outlet } from 'react-router-dom'
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a className="skip-link" href="#main-content">
        본문 바로가기
      </a>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6 sm:px-10">
          <Link to="/" className="font-bold tracking-tight">
            멋쟁이 타자처럼
            <span className="ml-3 hidden text-xs font-normal tracking-widest text-ink-muted sm:inline">
              RADIO TYPING CLUB
            </span>
          </Link>
          <nav aria-label="주 메뉴" className="flex items-center gap-5 text-sm">
            <Link to="/ranking" className="text-ink-muted hover:text-ink">
              공개 랭킹
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs font-bold tracking-widest">
              <span className="h-2 w-2 rounded-full bg-onair" />
              ON AIR
            </span>
          </nav>
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-10 sm:py-16"
      >
        <Outlet />
      </main>
      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-ink-muted sm:px-10">
        <span>LIKELION · 한 문장씩, 나만의 기록을.</span>
        <div className="flex items-center gap-4">
          <span>3 CHANNELS / 5 SENTENCES</span>
          {/* TODO: 병합 시 팀원 A의 AdminPage를 /admin 경로에 연결한다. */}
          <Link
            to="/admin"
            className="rounded-md border border-line px-2.5 py-1.5 text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            운영진 화면
          </Link>
        </div>
      </footer>
    </div>
  )
}
