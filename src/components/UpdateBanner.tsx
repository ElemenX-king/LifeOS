import { useState, useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'

const DISMISS_KEY = 'lifeos_update_dismissed'
const CHECKED_KEY = 'lifeos_update_checked'
const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 hours

interface ReleaseInfo {
  tag_name: string
  html_url: string
}

function compareVersions(current: string, latest: string): boolean {
  // Remove 'v' prefix if present, split into parts
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

  useEffect(() => {
    // 24h cooldown — skip fetch if checked recently
    const lastChecked = localStorage.getItem(CHECKED_KEY)
    if (lastChecked) {
      const elapsed = Date.now() - parseInt(lastChecked, 10)
      if (elapsed < COOLDOWN_MS) return
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
      .catch(() => {}) // network error — silently skip
  }, [])

  if (!release || dismissed) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, release.tag_name)
    setDismissed(true)
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
        onClick={dismiss}
        className="ml-auto p-1 hover:bg-amber-200 rounded"
        aria-label="关闭"
      >
        <X size={14} />
      </button>
    </div>
  )
}
