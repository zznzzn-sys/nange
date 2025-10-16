@echo off
echo 正在启动恐怖校园游戏开发服务器...
cd /d "%~dp0"
npm install
if %errorlevel% neq 0 (
    echo 依赖安装失败，请检查网络连接
    pause
    exit /b 1
)
echo 依赖安装成功，启动开发服务器...
npm run dev
pause