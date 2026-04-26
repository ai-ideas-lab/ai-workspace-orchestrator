# Awesome AI Ideas PR Auto-Merge Setup

## Overview
This setup automatically merges the first available PR from the `ava-agent/awesome-ai-ideas` repository every hour using a cron job.

## Components

### 1. Merge Script (`merge_prs_awesome.sh`)
- Lists open PRs from the repository (max 3)
- If no PRs exist, exits gracefully
- Merges the first available PR automatically
- Includes proper error handling and logging
- Checks if PR is mergeable before attempting merge

### 2. Cron Job
- **Name**: `awesome-ai-ideas PR合并 每小时`
- **Schedule**: Every hour (3600000ms)
- **Target**: Main session
- **Enabled**: ✅ Active

## Features
- ✅ Automatic PR discovery
- ✅ Merge conflict detection
- ✅ Detailed logging to `/tmp/awesome_ai_ideas_merges.log`
- ✅ Graceful handling of empty PR list
- ✅ Auto-deletes merged branches

## Usage
The cron job runs automatically every hour. No manual intervention required.

## Logs
Check the merge log:
```bash
tail -f /tmp/awesome_ai_ideas_merges.log
```

## Manual Testing
Test the script manually:
```bash
./merge_prs_awesome.sh
```

## Requirements
- GitHub CLI (`gh`) must be installed and authenticated
- Repository must be accessible
- PRs must be mergeable (no conflicts, reviews satisfied)