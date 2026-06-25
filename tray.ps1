using namespace System.Windows.Forms
using namespace System.Drawing

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 获取脚本所在目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 创建托盘图标
$icon = [Icon]::ExtractAssociatedIcon((Get-Command powershell).Source)
$tray = New-Object NotifyIcon
$tray.Icon = $icon
$tray.Text = "LifeOS — 人生管理系统"
$tray.Visible = $true

# 右键菜单
$menu = New-Object ContextMenuStrip

$open = New-Object ToolStripMenuItem
$open.Text = "打开 LifeOS"
$open.Add_Click({ Start-Process "http://localhost:3000" })
$menu.Items.Add($open) | Out-Null

$menu.Items.Add((New-Object ToolStripSeparator)) | Out-Null

$quit = New-Object ToolStripMenuItem
$quit.Text = "退出"
$quit.Add_Click({
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    $tray.Visible = $false
    [Application]::Exit()
})
$menu.Items.Add($quit) | Out-Null

$tray.ContextMenuStrip = $menu

# 启动服务
$null = Start-Process powershell -WindowStyle Hidden -ArgumentList "-Command cd '$scriptDir'; npm run start:local"

# 打开浏览器
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

# 保持托盘运行
[Application]::Run()
