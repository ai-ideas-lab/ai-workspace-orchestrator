#!/bin/bash

# Script to automatically merge PRs for awesome-ai-ideas repository
# Designed to run as a cron job

# Repository details
REPO="ava-agent/awesome-ai-ideas"
MAX_PRS=3
LOG_FILE="/tmp/awesome_ai_ideas_merges.log"

# Create log file if it doesn't exist
touch "$LOG_FILE"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_message "Starting PR merge process for $REPO"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    log_message "ERROR: GitHub CLI (gh) not found. Please install it first."
    exit 1
fi

# List open PRs
PR_LIST=$(gh pr list --repo $REPO --state open --limit $MAX_PRS --json number,title,author,createdAt)

# Check if JSON output is empty (no PRs found)
if [[ -z "$PR_LIST" || "$PR_LIST" == "[]" ]]; then
    log_message "No open PRs found in $REPO. Exiting."
    exit 0
fi

# Extract PR number from the first PR in the list
PR_NUMBER=$(echo "$PR_LIST" | jq -r '.[0].number')

if [[ -z "$PR_NUMBER" || "$PR_NUMBER" == "null" ]]; then
    log_message "Could not extract PR number. Exiting."
    exit 1
fi

# Get PR details for logging
PR_TITLE=$(echo "$PR_LIST" | jq -r '.[0].title')
PR_AUTHOR=$(echo "$PR_LIST" | jq -r '.[0].author.login')
PR_CREATED=$(echo "$PR_LIST" | jq -r '.[0].createdAt')

log_message "Found PR #$PR_NUMBER - Merging..."
log_message "PR Title: $PR_TITLE"
log_message "Author: $PR_AUTHOR"
log_message "Created: $PR_CREATED"

# Check if PR can be merged
log_message "Checking if PR #$PR_NUMBER can be merged..."
if ! gh pr view $PR_NUMBER --repo $REPO --json mergeable --jq '.mergeable' | grep -q "true"; then
    log_message "WARNING: PR #$PR_NUMBER is not mergeable (may have conflicts or reviews pending). Skipping."
    exit 0
fi

# Try to merge the PR
log_message "Attempting to merge PR #$PR_NUMBER..."
if gh pr merge $PR_NUMBER --repo $REPO --merge --delete-branch; then
    log_message "✅ Successfully merged PR #$PR_NUMBER: $PR_TITLE"
    exit 0
else
    log_message "❌ Failed to merge PR #$PR_NUMBER"
    # Check if it's a merge conflict issue
    if gh pr view $PR_NUMBER --repo $REPO --json mergeable --jq '.mergeable' 2>/dev/null | grep -q "false"; then
        log_message "Reason: PR has merge conflicts and cannot be auto-merged"
    else
        log_message "Reason: Unknown merge failure"
    fi
    exit 1
fi