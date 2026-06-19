interface BannerProps {
  title?: string
}

export function Banner({ title = 'Yearly Planner' }: BannerProps) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const day = today.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const wd = weekdays[today.getDay()]

  const getSeasonEmoji = () => {
    if (month >= 3 && month <= 5) return '🌸'
    if (month >= 6 && month <= 8) return '🌻'
    if (month >= 9 && month <= 11) return '🍁'
    return '❄️'
  }

  return (
    <div className="banner-container animate-fade-in">
      <img src="/img003.jpg" alt="" className="banner-cover" />

      {/* [改动 5] 标题区域 + 半透明遮罩底板，分隔背景与文字 */}
      <div className="banner-title-area">
        <div className="banner-title-plate">
          <div className="banner-icon-wrapper">
            <img src="/img002.png" alt="" className="banner-icon" />
          </div>
          <div className="banner-text">
            <h1 className="banner-title">{title}</h1>
            <p className="banner-subtitle">
              {getSeasonEmoji()} {year} 年度计划 · {month}月{day}日 {wd}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

