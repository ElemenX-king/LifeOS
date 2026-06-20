import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 清理旧 IndexedDB 数据（已迁移到 SQLite）
const req = indexedDB.deleteDatabase('LifeOSDatabase')
req.onsuccess = () => console.log('🧹 旧 IndexedDB 已清理')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
