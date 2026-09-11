import './loading.css'

function LoadingScreen() {
  return (
    <div className="loading-shell">
      <div className="loading-content">
        <span className="loading-dot" />
        <span className="loading-text">ON AIR 준비 중...</span>
      </div>
    </div>
  )
}

export default LoadingScreen
