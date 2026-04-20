#!/bin/bash

echo "=== PROJECT METRICS COLLECTION ==="
echo "Collection Time: $(date)"
echo ""

# Function to collect metrics for a project
collect_project_metrics() {
    local project_name=$1
    echo "=== $project_name ==="
    
    if [ -d "$project_name" ]; then
        cd "$project_name"
        
        # Check if git repo
        if [ -d ".git" ]; then
            # Code line changes in 24h
            lines_added=$(git log --since="24h ago" --numstat | awk 'NF==3 {added+=$1; deleted+=$2} END {print added+0}')
            lines_deleted=$(git log --since="24h ago" --numstat | awk 'NF==3 {added+=$1; deleted+=$2} END {print deleted+0}')
            
            # Commit frequency in 24h
            commits_24h=$(git log --since="24h ago" --oneline | wc -l)
            
            # Branch count
            branch_count=$(git branch | wc -l)
            
            # Contributor count in 24h
            contributors_24h=$(git log --since="24h ago" --pretty=format:"%ae" | sort | uniq | wc -l)
            
            # Commit count 7 days ago for comparison
            commits_7d=$(git log --since="7 days ago" --oneline | wc -l)
            
            echo "  Code changes: +${lines_added:-0} -${lines_deleted:-0}"
            echo "  24h commits: ${commits_24h:-0}"
            echo "  Branches: ${branch_count:-0}"
            echo "  Contributors 24h: ${contributors_24h:-0}"
            echo "  7d commits: ${commits_7d:-0}"
        else
            echo "  Not a git repository"
        fi
        cd ..
    else
        echo "  Project directory not found"
    fi
    echo ""
}

# Collect metrics for main projects
projects=(
    "ai-career-soft-skills-coach"
    "ai-appointment-manager"
    "ai-contract-reader"
    "ai-error-diagnostician"
    "code-knowledge-map-generator"
    "ai-rental-detective"
    "ai-email-manager"
    "ai-interview-coach"
    "ai-voice-notes-organizer"
    "ai-carbon-footprint-tracker"
    "ai-workspace-orchestrator"
    "ai-gardening-designer"
    "ai-family-health-guardian"
    "ai-dialect-heritage-assistant"
    "ai-safety-guardian"
    "ai-salary-negotiation-coach"
    "ai-icebreaker-coach"
    "ai-emotional-health-companion"
    "ai-music-creation-companion"
    "ai-personal-growth-coach"
    "ai-science-explorer"
    "ai-resume-doctor"
    "ai-nursing-assistant"
    "ai-immersive-language-partner"
)

for project in "${projects[@]}"; do
    collect_project_metrics "$project"
done

echo "=== COLLECTION COMPLETE ==="
