#!/usr/bin/env node

/**
 * 本地集成测试脚本
 * 用法: node test.js --key-id=xxx --key-secret=xxx --region=xxx --bucket=xxx --assets="path:remote"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 解析命令行参数
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      args[key] = value;
    }
  });
  return args;
}

// 模拟 GitHub Actions core 模块
function mockGitHubActionsCore(inputs) {
  const mockCore = `
module.exports = {
  getInput: (name) => {
    const inputs = ${JSON.stringify(inputs)};
    return inputs[name] || '';
  },
  setOutput: (name, value) => {
    console.log(\`::set-output name=\${name}::\${value}\`);
  },
  setFailed: (message) => {
    console.error(\`::error::\${message}\`);
    process.exit(1);
  }
};
`;
  
  // 创建临时的 mock 文件
  const mockPath = path.join(__dirname, 'node_modules', '@actions', 'core-mock.js');
  fs.mkdirSync(path.dirname(mockPath), { recursive: true });
  fs.writeFileSync(mockPath, mockCore);
  
  return mockPath;
}

// 创建测试用的临时文件
function createTestFiles() {
  const testDir = path.join(__dirname, 'test-files');
  
  // 清理并创建测试目录
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
  fs.mkdirSync(testDir, { recursive: true });
  
  // 创建单个测试文件
  fs.writeFileSync(path.join(testDir, 'test.txt'), 'Hello OSS Upload Test!');
  
  // 创建子目录和多个文件
  const subDir = path.join(testDir, 'subdir');
  fs.mkdirSync(subDir);
  fs.writeFileSync(path.join(subDir, 'file1.txt'), 'Test file 1');
  fs.writeFileSync(path.join(subDir, 'file2.txt'), 'Test file 2');
  
  // 创建图片测试文件（空文件模拟）
  fs.writeFileSync(path.join(testDir, 'test.png'), Buffer.alloc(100));
  
  console.log('✅ 测试文件已创建在:', testDir);
  return testDir;
}

// 修改源码文件以使用 mock
function createTestVersion(inputs, mockCorePath) {
  const originalSrc = fs.readFileSync(path.join(__dirname, 'src', 'index.js'), 'utf8');
  
  // 替换 @actions/core 为我们的 mock
  const testSrc = originalSrc.replace(
    "const core = require('@actions/core');",
    `const core = require('${mockCorePath.replace(/\\/g, '/')}');`
  );
  
  const testSrcPath = path.join(__dirname, 'test-index.js');
  fs.writeFileSync(testSrcPath, testSrc);
  
  return testSrcPath;
}

// 主测试函数
async function runTest() {
  console.log('🚀 开始OSS上传集成测试\n');
  
  const args = parseArgs();
  
  // 检查必需参数
  const required = ['key-id', 'key-secret', 'bucket'];
  const missing = required.filter(key => !args[key]);
  if (missing.length > 0) {
    console.error('❌ 缺少必需参数:', missing.join(', '));
    console.log('\n用法示例:');
    console.log('node test.js --key-id=YOUR_KEY_ID --key-secret=YOUR_KEY_SECRET --region=oss-cn-shenzhen --bucket=YOUR_BUCKET --assets="test-files/**:test/"');
    process.exit(1);
  }
  
  try {
    // 创建测试文件
    const testDir = createTestFiles();
    
    // 设置默认值
    if (!args.region && !args.endpoint) {
      args.region = 'oss-cn-shenzhen';
    }
    
    if (!args.assets) {
      args.assets = 'test-files/**:test/';
    }
    
    console.log('📋 测试配置:');
    console.log('- Key ID:', args['key-id'].substring(0, 8) + '...');
    console.log('- Region/Endpoint:', args.region || args.endpoint);
    console.log('- Bucket:', args.bucket);
    console.log('- Assets:', args.assets);
    console.log();
    
    // 创建 mock 和测试文件
    const mockCorePath = mockGitHubActionsCore(args);
    const testSrcPath = createTestVersion(args, mockCorePath);
    
    console.log('🔄 开始上传...\n');
    
    // 执行测试
    execSync(`node "${testSrcPath}"`, { stdio: 'inherit' });
    
    console.log('\n✅ 测试完成！');
    
    // 清理临时文件
    fs.unlinkSync(testSrcPath);
    fs.unlinkSync(mockCorePath);
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTest();
}

module.exports = { runTest, createTestFiles, parseArgs };