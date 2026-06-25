' LifeOS 启动脚本 — 双击后台运行，不弹窗口
Set objShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' 获取脚本所在目录（LifeOS 文件夹）
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

' 后台启动服务
objShell.Run "powershell -WindowStyle Hidden -Command cd '" & strDir & "'; npm run start:local", 0

' 等 2 秒后打开浏览器
WScript.Sleep 2000
objShell.Run "http://localhost:3000"
