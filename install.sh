#!/usr/bin/env bash
set -e

echo "==================================="
echo "   LifeOS 本地部署 —— 一键安装"
echo "==================================="
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
    echo "[X] 未找到 Node.js —— 请先安装"
    echo "    macOS: brew install node"
    echo "    Linux: https://nodejs.org 或包管理器"
    exit 1
fi
echo "[√] Node.js $(node --version)"

# Check Git
if ! command -v git &>/dev/null; then
    echo "[X] 未找到 Git —— 请先安装"
    echo "    macOS: brew install git"
    echo "    Linux: sudo apt install git / sudo yum install git"
    exit 1
fi
echo "[√] Git $(git --version | cut -d' ' -f3)"

# Clone or update
LIFEOS_DIR="$HOME/LifeOS"
if [ -d "$LIFEOS_DIR/.git" ]; then
    echo ""
    echo "[→] 已有 LifeOS，拉取最新代码..."
    cd "$LIFEOS_DIR"
    git pull
else
    echo ""
    echo "[→] 下载 LifeOS..."
    git clone https://github.com/ElemenX-king/LifeOS.git "$LIFEOS_DIR"
    cd "$LIFEOS_DIR"
fi

# Install & build & start
echo ""
echo "[→] 安装依赖（首次约 2-3 分钟）..."
npm install
echo ""
echo "[→] 构建前端..."
npm run build
echo ""
echo "==================================="
echo "   安装完成！启动服务中..."
echo "   浏览器打开 → http://localhost:3000"
echo "   ★ 不要关闭此终端！"
echo "==================================="
echo ""
npm run start:local
