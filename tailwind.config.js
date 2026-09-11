/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      // 디자인 시스템 확정 전까지 쓰는 임시 색상 토큰.
      // 컴포넌트에서 slate-400 / blue-500 같은 원색 유틸리티를 직접 쓰지 않고
      // 아래 토큰만 사용해야 나중에 이 파일 하나만 고쳐서 테마를 교체할 수 있다.
      colors: {
        // `base`라는 이름은 Tailwind 기본 폰트 크기 유틸리티(text-base)와 충돌하므로
        // 배경 계열 토큰은 surface로 부른다.
        surface: {
          DEFAULT: '#0b1020', // 페이지 배경
          soft: '#131a2e', // 섹션 배경
          card: '#182136', // 카드 배경
        },
        line: {
          DEFAULT: '#2a3654', // 기본 테두리
          strong: '#3c4b73', // 강조 테두리
        },
        ink: {
          DEFAULT: '#e8edf7', // 본문 텍스트
          muted: '#9aa7c2', // 보조 텍스트
          dim: '#6b7896', // 비활성 텍스트
        },
        // 타이핑 문장 글자 상태 전용 토큰
        typing: {
          pending: '#6b7896', // 아직 입력하지 않은 글자
          correct: '#4f8dff', // 정타
          typo: '#ff5c6b', // 오타
          composing: '#8fb6ff', // 한글 조합 중(판정 보류)
        },
        accent: {
          DEFAULT: '#4f8dff',
          soft: '#2a4a86',
        },
        onair: '#ff3b5c', // 라디오 ON AIR 시그널
      },
      keyframes: {
        caret: {
          '0%, 45%': { opacity: '1' },
          '55%, 100%': { opacity: '0' },
        },
        pulseAir: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
      animation: {
        caret: 'caret 1s step-end infinite',
        'pulse-air': 'pulseAir 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
