#!/bin/bash

# Twikk 一键部署脚本
# 适用于 hezhili.online:3000

echo "开始部署 Twikk 到 hezhili.online:3000..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装。请先安装 Node.js。"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "错误: npm 未安装。请先安装 npm。"
    exit 1
fi

# 安装依赖
echo "安装依赖..."
npm install

# 检查是否存在 .env 文件
if [ ! -f ".env" ]; then
    echo "创建 .env 文件..."
    cp .env.example .env
    echo "请编辑 .env 文件来配置你的生产环境设置。"
fi

# 检查 MongoDB 连接
echo "检查 MongoDB 状态..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "警告: MongoDB 进程未运行。请确保 MongoDB 已启动。"
    echo "你可以尝试运行: sudo systemctl start mongod"
fi

# 启动应用
echo "启动 Twikk 应用..."
echo "访问地址: http://hezhili.online:3000"
npm run production