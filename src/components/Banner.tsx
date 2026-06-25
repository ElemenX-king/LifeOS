import { useState, useEffect } from 'react'
import { Settings, X } from 'lucide-react'

interface UserSettings {
  bannerImage: string
  bannerScale: number
  bannerOffsetY: number
  avatarImage: string
  avatarScale: number
  nickname: string
}

const DEFAULT_SETTINGS: UserSettings = {
  bannerImage: '/img003.jpg',
  bannerScale: 100,
  bannerOffsetY: 77,
  avatarImage: '/img002.png',
  avatarScale: 100,
  nickname: 'Yearly Planner',
}

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem('lifeos_settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      // 兼容旧数据：偏移值超出 0-100 范围则重置为默认
      if (typeof parsed.bannerOffsetY === 'number' && (parsed.bannerOffsetY < 0 || parsed.bannerOffsetY > 100)) {
        parsed.bannerOffsetY = DEFAULT_SETTINGS.bannerOffsetY
      }
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch {}
  return DEFAULT_SETTINGS
}

function saveSettings(s: UserSettings) {
  localStorage.setItem('lifeos_settings', JSON.stringify(s))
}

export function Banner() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings)
  const [showSettings, setShowSettings] = useState(false)

  // 表单临时状态
  const [formBanner, setFormBanner] = useState(settings.bannerImage)
  const [formBannerScale, setFormBannerScale] = useState(settings.bannerScale)
  const [formBannerOffsetY, setFormBannerOffsetY] = useState(settings.bannerOffsetY)
  const [formAvatar, setFormAvatar] = useState(settings.avatarImage)
  const [formAvatarScale, setFormAvatarScale] = useState(settings.avatarScale)
  const [formNickname, setFormNickname] = useState(settings.nickname)

  useEffect(() => {
    setFormBanner(settings.bannerImage)
    setFormBannerScale(settings.bannerScale)
    setFormBannerOffsetY(settings.bannerOffsetY)
    setFormAvatar(settings.avatarImage)
    setFormAvatarScale(settings.avatarScale)
    setFormNickname(settings.nickname)
  }, [settings, showSettings])

  const handleSave = () => {
    const next: UserSettings = {
      bannerImage: formBanner.trim() || DEFAULT_SETTINGS.bannerImage,
      bannerScale: formBannerScale,
      bannerOffsetY: formBannerOffsetY,
      avatarImage: formAvatar.trim() || DEFAULT_SETTINGS.avatarImage,
      avatarScale: formAvatarScale,
      nickname: formNickname.trim() || DEFAULT_SETTINGS.nickname,
    }
    saveSettings(next)
    setSettings(next)
    setShowSettings(false)
  }

  const handleReset = () => {
    setFormBanner(DEFAULT_SETTINGS.bannerImage)
    setFormBannerScale(DEFAULT_SETTINGS.bannerScale)
    setFormBannerOffsetY(DEFAULT_SETTINGS.bannerOffsetY)
    setFormAvatar(DEFAULT_SETTINGS.avatarImage)
    setFormAvatarScale(DEFAULT_SETTINGS.avatarScale)
    setFormNickname(DEFAULT_SETTINGS.nickname)
  }
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
      <img
        src={settings.bannerImage}
        alt=""
        className="banner-cover"
        style={{
          transform: `scale(${settings.bannerScale / 100})`,
          objectPosition: `50% ${settings.bannerOffsetY}%`,
        }}
      />

      {/* 设置按钮 — 右上角 */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute right-4 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/70 text-gray-500 backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-700"
        title="设置"
      >
        <Settings className="h-4 w-4" />
      </button>

      {/* 标题区域 */}
      <div className="banner-title-area">
        <div className="banner-title-plate">
          <div className="banner-icon-wrapper">
            <img
              src={settings.avatarImage}
              alt=""
              className="banner-icon"
              style={{ transform: `scale(${settings.avatarScale / 100})` }}
            />
          </div>
          <div className="banner-text">
            <h1 className="banner-title">{settings.nickname}</h1>
            <p className="banner-subtitle">
              {getSeasonEmoji()} {year} 年度计划 · {month}月{day}日 {wd}
            </p>
          </div>
        </div>
      </div>

      {/* ===== 设置弹窗 ===== */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowSettings(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">个性化设置</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 昵称 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">昵称</label>
                <input
                  type="text"
                  value={formNickname}
                  onChange={(e) => setFormNickname(e.target.value)}
                  placeholder="输入昵称…"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#D97D48]/30"
                />
              </div>

              {/* 头像图片 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">头像图片 URL</label>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-[#F2BF80]">
                    <img
                      src={formAvatar || DEFAULT_SETTINGS.avatarImage}
                      alt=""
                      className="h-full w-full object-contain"
                      style={{ transform: `scale(${formAvatarScale / 100})` }}
                    />
                  </div>
                  <input
                    type="text"
                    value={formAvatar}
                    onChange={(e) => setFormAvatar(e.target.value)}
                    placeholder="如 /img002.png"
                    className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#D97D48]/30"
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">将图片放入 public 文件夹，填写如 /xxx.png</p>
                <div className="mt-2">
                  <label className="block text-[11px] text-gray-400 mb-1">缩放（%）</label>
                  <input
                    type="number"
                    min={50}
                    max={200}
                    value={formAvatarScale}
                    onChange={(e) => setFormAvatarScale(Number(e.target.value))}
                    className="w-24 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none focus:ring-1 focus:ring-[#D97D48]/30"
                  />
                </div>
              </div>

              {/* 背景图片 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">页面背景图片 URL</label>
                <div className="mb-2 w-full overflow-hidden rounded-lg" style={{ aspectRatio: '48 / 7' }}>
                  <img
                    src={formBanner || DEFAULT_SETTINGS.bannerImage}
                    alt=""
                    className="h-full w-full"
                    style={{
                      objectFit: 'cover',
                      transform: `scale(${formBannerScale / 100})`,
                      objectPosition: `50% ${formBannerOffsetY}%`,
                    }}
                  />
                </div>
                <input
                  type="text"
                  value={formBanner}
                  onChange={(e) => setFormBanner(e.target.value)}
                  placeholder="如 /img003.jpg"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#D97D48]/30"
                />
                <p className="mt-1 text-[11px] text-gray-400">将图片放入 public 文件夹，填写如 /xxx.jpg</p>
                <div className="mt-3 flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] text-gray-400 mb-1">缩放（%）</label>
                    <input
                      type="number"
                      min={50}
                      max={200}
                      value={formBannerScale}
                      onChange={(e) => setFormBannerScale(Number(e.target.value))}
                      className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none focus:ring-1 focus:ring-[#D97D48]/30"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] text-gray-400 mb-1">上下位移（%）</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formBannerOffsetY}
                      onChange={(e) => setFormBannerOffsetY(Number(e.target.value))}
                      className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none focus:ring-1 focus:ring-[#D97D48]/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleReset}
                className="rounded-md px-3 py-2 text-xs text-gray-400 transition-colors hover:text-gray-600"
              >
                恢复默认
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="rounded-md px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formNickname.trim()}
                  className="rounded-md bg-[#D97D48] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C06A3A] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

