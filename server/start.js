import { spawn } from 'child_process'

function start() {
  const child = spawn('node', ['--import', 'tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env },
  })
  child.on('exit', () => {
    console.log('\n🔄 服务退出，3 秒后自动重启...\n')
    setTimeout(start, 3000)
  })
}

start()
