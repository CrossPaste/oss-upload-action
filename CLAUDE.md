# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub Action for uploading files to Aliyun OSS (Object Storage Service). The action supports uploading single files or entire directories to OSS buckets.

## Build System

- **Build command**: `npm run build` - Uses @vercel/ncc to compile src/index.js into lib/index.js
- **Development**: `npm run start` - Builds with watch mode (`npm run build -- -w`)
- **Testing**: `npm run test` or `npm run test:shell` - Run integration tests locally
- **Package manager**: Uses pnpm (pnpm-lock.yaml present) but npm commands work

## Architecture

```
src/index.js          # Main source code (GitHub Action entry point)
lib/index.js          # Compiled output (large bundle created by ncc)
action.yml            # GitHub Action configuration
package.json          # Dependencies and build scripts
```

## Key Dependencies

- `@actions/core` - GitHub Actions toolkit for inputs/outputs
- `@actions/github` - GitHub API access
- `ali-oss` - Aliyun OSS SDK
- `fast-glob` - File pattern matching for asset uploads
- `@vercel/ncc` - Build tool for packaging Node.js apps

## Action Configuration

The action expects these inputs:
- `key-id` (required) - OSS AccessKeyId
- `key-secret` (required) - OSS AccessKeySecret  
- `region` or `endpoint` - OSS region or custom endpoint
- `bucket` (required) - OSS bucket name
- `assets` (required) - Upload rules in format `source:destination`

Output: `url` - Comma-separated URLs of uploaded files

## Development Notes

- Source code is in `src/index.js` and must be compiled to `lib/index.js` before the action works
- The `lib/` directory contains the compiled bundle and should not be manually edited
- Always run `npm run build` after making changes to source code
- The action supports glob patterns for batch file uploads
- Handles both single file and directory uploads based on destination path format

## Testing Locally

1. Copy `test-config.example.json` to `test-config.json` and configure your OSS credentials
2. Run tests using command line: `node test.js --key-id=xxx --key-secret=xxx --bucket=xxx --region=xxx --assets="path:remote"`
3. Or use shell script: `./test.sh` (reads from test-config.json)
4. Test script creates temporary files in `test-files/` directory for upload testing