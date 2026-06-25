import { useState, useEffect } from 'react'
import { RefreshCw, X, Download } from 'lucide-react'

const DISMISS_KEY = 'lifeos_update_dismissed'
const CHECKED_KEY = 'lifeos_update_checked'
const COOLDOWN_MS = 24 * 60 * 60 * 1000

interface ReleaseInfo {
  tag_name: string
  html_url: string
}

function compareVersions(current: string, latest: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number)
  const c = parse(current)
  const l = parse(latest)
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true
    if ((l[i] || 0) < (c[i] || 0)) return false
  }
  return false
}

export function UpdateBanner() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const lastChecked = localStorage.getItem(CHECKED_KEY)
    if (lastChecked) {
      if (Date.now() - parseInt(lastChecked, 10) < COOLDOWN_MS) return
    }

    const storedDismiss = localStorage.getItem(DISMISS_KEY)

    fetch('https://api.github.com/repos/ElemenX-king/LifeOS/releases/latest')
      .then(r => r.json())
      .then((data: ReleaseInfo) => {
        localStorage.setItem(CHECKED_KEY, String(Date.now()))
        if (!data.tag_name) return
        if (compareVersions(APP_VERSION, data.tag_name)) {
          if (storedDismiss !== data.tag_name) {
            setRelease(data)
          }
        }
      })
      .catch(() => {})
  }, [])

  const update = async () => {
    setUpdating(true)
    try {
      await fetch('/api/update', { method: 'POST' })
      setDone(true)
    } catch {
      // Server already restarted — just reload
      setTimeout(() => location.reload(), 2000)
    }
  }

  if (!release || dismissed) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, release.tag_name)
    setDismissed(true)
  }

  if (updating) {
    return (
      <div className="flex items-center justify-center gap-3 bg-green-50 border-b border-green-200 px-4 py-2 text-sm text-green-900">
        <RefreshCw size={14} className="shrink-0 animate-spin" />
        <span>正在更新到 <strong>{release.tag_name}</strong>...</span>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex items-center justify-center gap-3 bg-green-50 border-b border-green-200 px-4 py-2 text-sm text-green-900">
        <span>✅ 更新完成！页面即将刷新...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900">
      <RefreshCw size={14} className="shrink-0" />
      <span>
        新版本 <strong>{release.tag_name}</strong> 可用 · 当前 {APP_VERSION}
      </span>
      <a
        href={release.html_url}
        target="_blank"
        rel="noopener"
        className="underline underline-offset-2 hover:text-amber-700"
      >
        查看
      </a>
      <button
        onClick={update}
        className="flex items-center gap-1 px-2 py-1 bg-amber-200 hover:bg-amber-300 rounded text-amber-900 font-medium"
      >
        <Download size={14} />
        一键更新
      </button>
      <button
        onClick={dismiss}
        className="ml-auto p-1 hover:bg-amber-200 rounded"
        aria-label="关闭"
      >
        <X size={14} />
      </button>
    </div>
  )
}
