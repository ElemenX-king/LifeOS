import { useState, useEffect } from 'react'
import { RefreshCw, X } from 'lucide-react'

const DISMISS_KEY = 'lifeos_update_dismissed'

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
    // Check if already dismissed for this version
    const stored = localStorage.getItem(DISMISS_KEY)

    fetch('https://api.github.com/repos/ElemenX-king/LifeOS/releases/latest')
      .then(r => r.json())
      .then((data: ReleaseInfo) => {
        if (!data.tag_name) return
        if (compareVersions(APP_VERSION, data.tag_name)) {
          if (stored !== data.tag_name) {
            setRelease(data)
          }
        }
      })
      .catch(() => {}) // network error — just skip
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
