#!/bin/bash

# OSS上传集成测试脚本
# 使用方法: ./test.sh [config_file]

set -e

# 默认配置文件
CONFIG_FILE="${1:-test-config.json}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 OSS Upload Action 集成测试${NC}"
echo "================================="

# 检查配置文件
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ 配置文件不存在: $CONFIG_FILE${NC}"
    echo -e "${YELLOW}请复制 test-config.example.json 到 test-config.json 并填写配置${NC}"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    exit 1
fi

# 检查是否已构建
if [ ! -f "lib/index.js" ]; then
    echo -e "${YELLOW}⚠️  lib/index.js 不存在，正在构建...${NC}"
    npm run build
fi

# 读取配置
KEY_ID=$(node -e "console.log(require('./$CONFIG_FILE').configs.development['key-id'])")
KEY_SECRET=$(node -e "console.log(require('./$CONFIG_FILE').configs.development['key-secret'])")
REGION=$(node -e "console.log(require('./$CONFIG_FILE').configs.development.region || '')")
ENDPOINT=$(node -e "console.log(require('./$CONFIG_FILE').configs.development.endpoint || '')")
BUCKET=$(node -e "console.log(require('./$CONFIG_FILE').configs.development.bucket)")
ASSETS=$(node -e "console.log(require('./$CONFIG_FILE').configs.development.assets)")

# 验证配置
if [ "$KEY_ID" = "YOUR_OSS_ACCESS_KEY_ID" ] || [ -z "$KEY_ID" ]; then
    echo -e "${RED}❌ 请在 $CONFIG_FILE 中配置正确的 OSS key-id${NC}"
    exit 1
fi

if [ "$KEY_SECRET" = "YOUR_OSS_ACCESS_KEY_SECRET" ] || [ -z "$KEY_SECRET" ]; then
    echo -e "${RED}❌ 请在 $CONFIG_FILE 中配置正确的 OSS key-secret${NC}"
    exit 1
fi

# 构建测试命令
CMD="node test.js --key-id=\"$KEY_ID\" --key-secret=\"$KEY_SECRET\" --bucket=\"$BUCKET\" --assets=\"$ASSETS\""

if [ -n "$REGION" ]; then
    CMD="$CMD --region=\"$REGION\""
fi

if [ -n "$ENDPOINT" ]; then
    CMD="$CMD --endpoint=\"$ENDPOINT\""
fi

echo -e "${GREEN}📋 使用配置:${NC}"
echo "- Bucket: $BUCKET"
echo "- Region: $REGION"
echo "- Endpoint: $ENDPOINT"
echo "- Assets: $ASSETS"
echo ""

# 执行测试
echo -e "${BLUE}🔄 开始执行测试...${NC}"
eval $CMD

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 测试成功完成！${NC}"
else
    echo -e "${RED}❌ 测试失败${NC}"
    exit 1
fi