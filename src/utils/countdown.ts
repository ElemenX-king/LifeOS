/**
 * 倒计时辅助函数
 * 对比当前时间与截止日期，返回文本描述与颜色标记
 */
export interface CountdownResult {
  label: string    // 显示文本，如 "已超出 2 天"
  color: string    // Tag 颜色类名
}

export function getCountdown(dueDate?: string): CountdownResult {
  if (!dueDate) {
    return { label: '—', color: 'countdown-none' }
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const due = new Date(dueDate + 'T00:00:00')
  const diffMs = due.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    // 已过期
    return {
      label: `已超出 ${Math.abs(diffDays)} 天`,
      color: 'countdown-overdue',
    }
  }

  if (diffDays === 0) {
    return { label: '今天截止', color: 'countdown-today' }
  }

  if (diffDays === 1) {
    return { label: '明天截止', color: 'countdown-soon' }
  }

  if (diffDays <= 3) {
    return { label: `${diffDays} 天后`, color: 'countdown-soon' }
  }

  return { label: `${diffDays} 天后`, color: 'countdown-normal' }
}
