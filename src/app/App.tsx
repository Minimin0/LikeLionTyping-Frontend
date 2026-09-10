import { Keyboard, Shield, Trophy } from 'lucide-react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { AdminPage } from '../features/admin/AdminPage'
import { CategoriesPage } from '../features/category/CategoriesPage'
import { GamePage } from '../features/game/GamePage'
import { ResultPage } from '../features/game/ResultPage'
import { ParticipantPage } from '../features/participant/ParticipantPage'
import { RankingPage } from '../features/ranking/RankingPage'

export default function App() {
  return (
    <div className="min-h-screen bg-[#f4f6f2]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between px-4">
          <Link
            to="/"
            className="flex items-center gap-2 font-black text-zinc-900"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-yellow-300">
              <Keyboard className="size-5" aria-hidden />
            </span>
            멋쟁이 타자처럼
          </Link>
          <nav aria-label="주요 메뉴" className="flex items-center gap-1">
            <Link
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"
              to="/rankings"
              title="랭킹"
            >
              <Trophy className="size-5" />
            </Link>
            <Link
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"
              to="/admin"
              title="운영자"
            >
              <Shield className="size-5" />
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <Routes>
          <Route path="/" element={<ParticipantPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/game/:categoryId" element={<GamePage />} />
          <Route path="/result/:gameSessionId" element={<ResultPage />} />
          <Route path="/rankings" element={<RankingPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
