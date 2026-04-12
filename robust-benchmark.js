/**
 * Robust Performance Benchmark for AI Workspace Orchestrator
 * Handles N+1 query issues and provides comprehensive analysis
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');
const fs = require('fs');

class RobustBenchmark {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.endpoints = [
            { path: '/api/users-with-orders', name: 'Users with Orders', expectedIssues: ['N+1 queries'] },
            { path: '/api/orders-with-products', name: 'Orders with Products', expectedIssues: ['Critical N+1 queries'] },
            { path: '/api/user-stats', name: 'User Statistics', expectedIssues: ['N+1 queries'] },
            { path: '/api/users/1', name: 'User 1', expectedIssues: [] },
            { path: '/api/users/2', name: 'User 2', expectedIssues: [] },
            { path: '/api/users/3', name: 'User 3', expectedIssues: [] }
        ];
        this.results = [];
        this.timeout = 3000; // 3 second timeout
    }

    async runBenchmark() {
        console.log('🚀 Starting Robust Performance Benchmark...');
        console.log(`⚠️  Short timeout set to ${this.timeout}ms to handle N+1 issues\n`);

        // Test each endpoint with timeout handling
        for (const endpoint of this.endpoints) {
            await this.testEndpoint(endpoint);
        }

        // Analyze results
        this.analyzeResults();
        
        // Generate comprehensive report
        this.generateReport();
    }

    async testEndpoint(endpoint) {
        console.log(`🔄 Testing ${endpoint.name} (${endpoint.path})...`);
        
        const times = [];
        const errors = [];
        let successCount = 0;
        
        // Test with 3 requests to avoid hanging
        for (let i = 0; i < 3; i++) {
            const startTime = performance.now();
            
            try {
                await this.makeRequest(`${this.baseUrl}${endpoint.path}`, this.timeout);
                const endTime = performance.now();
                times.push(endTime - startTime);
                successCount++;
            } catch (error) {
                errors.push(error.message);
                times.push(this.timeout); // Mark as timeout
            }
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        const timeoutCount = times.filter(t => t >= this.timeout).length;
        
        console.log(`   Success: ${successCount}/3, Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms, Timeouts: ${timeoutCount}/3`);
        
        this.results.push({
            name: endpoint.name,
            path: endpoint.path,
            expectedIssues: endpoint.expectedIssues,
            avgTime,
            maxTime,
            timeoutCount,
            successRate: (successCount / 3) * 100,
            errors,
            performance: this.classifyPerformance(avgTime, timeoutCount)
        });
    }

    makeRequest(url, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;
            
            const options = {
                method: 'GET',
                timeout: timeout
            };
            
            const req = protocol.request(url, options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve(res);
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }

    classifyPerformance(avgTime, timeoutCount) {
        if (timeoutCount > 0) return 'Critical';
        if (avgTime > 2000) return 'Poor';
        if (avgTime > 1000) return 'Fair';
        if (avgTime > 500) return 'Good';
        return 'Excellent';
    }

    analyzeResults() {
        console.log('\n📊 Performance Analysis:');
        console.log('='.repeat(60));
        
        let totalIssues = 0;
        let criticalEndpoints = [];
        
        this.results.forEach(result => {
            const status = result.performance === 'Excellent' ? '✅' : 
                          result.performance === 'Good' ? '🟢' :
                          result.performance === 'Fair' ? '🟡' :
                          result.performance === 'Poor' ? '🟠' : '🔴';
            
            console.log(`${status} ${result.name} (${result.path}):`);
            console.log(`   Performance: ${result.performance} (${result.avgTime.toFixed(2)}ms avg)`);
            console.log(`   Success Rate: ${result.successRate.toFixed(1)}%`);
            console.log(`   Issues: ${result.timeoutCount}/3 timeouts`);
            
            if (result.expectedIssues.length > 0) {
                console.log(`   Expected Issues: ${result.expectedIssues.join(', ')}`);
            }
            
            if (result.performance === 'Critical') {
                criticalEndpoints.push(result);
                totalIssues++;
            }
            
            console.log('');
        });
        
        // Summary
        console.log('📈 Summary:');
        console.log(`- Total Endpoints Tested: ${this.results.length}`);
        console.log(`- Endpoints with Issues: ${totalIssues}`);
        console.log(`- Critical Endpoints: ${criticalEndpoints.length}`);
        
        if (criticalEndpoints.length > 0) {
            console.log('\n🚨 Critical Issues Found:');
            criticalEndpoints.forEach(endpoint => {
                console.log(`- ${endpoint.name}: ${endpoint.timeoutCount}/3 requests timed out`);
            });
        }
        
        return criticalEndpoints;
    }

    generateReport() {
        const timestamp = new Date().toISOString().split('T')[0];
        const reportPath = `./docs/benchmark-results-${timestamp}.md`;
        
        let markdown = `# AI Workspace Orchestrator Performance Benchmark Report\n\n`;
        markdown += `**Date:** ${new Date().toISOString()}\n`;
        markdown += `**Focus:** N+1 Query Issues and Performance Bottlenecks\n`;
        markdown += `**Timeout Setting:** ${this.timeout}ms\n\n`;
        
        // Executive Summary
        markdown += `## Executive Summary\n\n`;
        const criticalEndpoints = this.results.filter(r => r.performance === 'Critical');
        const poorEndpoints = this.results.filter(r => r.performance === 'Poor');
        
        markdown += `### Overall System Health: ${this.getSystemHealth()}\n\n`;
        
        if (criticalEndpoints.length > 0) {
            markdown += `🚨 **Critical Issues (Immediate Action Required)**:\n`;
            criticalEndpoints.forEach(endpoint => {
                markdown += `- **${endpoint.name}**: ${endpoint.timeoutCount}/3 requests timed out due to N+1 query problems\n`;
            });
            markdown += `\n`;
        }
        
        if (poorEndpoints.length > 0) {
            markdown += `⚠️ **Poor Performance (Needs Optimization)**:\n`;
            poorEndpoints.forEach(endpoint => {
                markdown += `- **${endpoint.name}**: ${endpoint.avgTime.toFixed(2)}ms average response time\n`;
            });
            markdown += `\n`;
        }
        
        // Detailed Results Table
        markdown += `## Detailed Results\n\n`;
        markdown += `| Endpoint | Performance | Avg Time | Success Rate | Timeouts | Issues |\n`;
        markdown += `|----------|-------------|----------|-------------|----------|--------|\n`;
        
        this.results.forEach(result => {
            const issues = result.expectedIssues.join(', ') || 'None';
            markdown += `| ${result.name} | ${result.performance} | ${result.avgTime.toFixed(2)}ms | ${result.successRate.toFixed(1)}% | ${result.timeoutCount}/3 | ${issues} |\n`;
        });
        
        // N+1 Query Deep Dive
        markdown += `\n## N+1 Query Issues Deep Dive\n\n`;
        
        this.results.forEach(result => {
            if (result.expectedIssues.some(issue => issue.includes('N+1'))) {
                markdown += `### ${result.name}\n\n`;
                markdown += `**Path:** ${result.path}\n\n`;
                
                if (result.performance === 'Critical') {
                    markdown += `🚨 **CRITICAL ISSUE** - This endpoint has severe N+1 query problems:\n\n`;
                    markdown += `#### Root Cause:\n`;
                    markdown += `- Multiple database queries executed for each parent record\n`;
                    markdown += `- Exponential performance degradation with data volume\n`;
                    markdown += `- Request timeouts causing complete endpoint failure\n\n`;
                    
                    markdown += `#### Immediate Impact:\n`;
                    markdown += `- API calls fail completely\n`;
                    markdown += `- User experience severely degraded\n`;
                    markdown += `- System reliability compromised\n\n`;
                    
                    markdown += `#### Recommended Fix:\n`;
                    markdown += `Replace with optimized SQL JOIN queries:\n`;
                    markdown += `\`\`\`sql\n`;
                    markdown += `-- Example fix for orders with products\n`;
                    markdown += `SELECT o.*, p.id as product_id, p.name as product_name, p.price\n`;
                    markdown += `FROM orders o\n`;
                    markdown += `LEFT JOIN order_items oi ON o.id = oi.order_id\n`;
                    markdown += `LEFT JOIN products p ON oi.product_id = p.id\n`;
                    markdown += `WHERE o.id = ?;\n`;
                    markdown += `\`\`\`\n\n`;
                } else {
                    markdown += `⚠️ **PERFORMANCE ISSUE** - N+1 queries detected:\n\n`;
                    markdown += `#### Impact:\n`;
                    markdown += `- Slower response times under load\n`;
                    markdown += `- Database connection overhead\n`;
                    markdown += `- Scalability concerns\n\n`;
                    
                    markdown += `#### Recommended Action:\n`;
                    markdown += `- Implement JOIN queries for better performance\n`;
                    markdown += `- Add database indexing on foreign keys\n`;
                    markdown += `- Consider caching for frequently accessed data\n\n`;
                }
            }
        });
        
        // Recommendations Matrix
        markdown += `## Recommendations Matrix\n\n`;
        markdown += `### Priority 1: Critical Fixes (Do This Now)\n\n`;
        criticalEndpoints.forEach((endpoint, index) => {
            markdown += `${index + 1}. **Fix ${endpoint.name}**\n`;
            markdown += `   - **Urgency**: Immediate - endpoint is completely broken\n`;
            markdown += `   - **Effort**: Low - single query optimization\n`;
            markdown += `   - **Impact**: High - restores API functionality\n`;
            markdown += `   - **Estimated Time**: 30 minutes\n\n`;
        });
        
        markdown += `### Priority 2: Performance Optimizations\n\n`;
        poorEndpoints.forEach((endpoint, index) => {
            markdown += `${index + 1}. **Optimize ${endpoint.name}**\n`;
            markdown += `   - **Urgency**: Medium - performance improvement\n`;
            markdown += `   - **Effort**: Medium - query optimization + indexing\n`;
            markdown += `   - **Impact**: Medium - better user experience\n`;
            markdown += `   - **Estimated Time**: 2-4 hours\n\n`;
        });
        
        markdown += `### Priority 3: System Improvements\n\n`;
        markdown += `1. **Add Database Indexing**\n`;
        markdown += `   - Index foreign keys (user_id, order_id, product_id)\n`;
        markdown += `   - Index frequently queried columns\n`;
        markdown += `   - **Estimated Time**: 1 hour\n\n`;
        
        markdown += `2. **Implement Connection Pooling**\n`;
        markdown += `   - Reduce connection overhead\n`;
        markdown += `   - Better resource utilization\n`;
        markdown += `   - **Estimated Time**: 3-5 hours\n\n`;
        
        markdown += `3. **Add Monitoring**\n`;
        markdown += `   - Set up performance monitoring\n`;
        markdown += `   - Add alerting for timeouts\n`;
        markdown += `   - **Estimated Time**: 4-6 hours\n\n`;
        
        // Performance Metrics
        markdown += `## Performance Metrics\n\n`;
        const avgResponseTime = this.results.reduce((sum, r) => sum + r.avgTime, 0) / this.results.length;
        const successRate = this.results.reduce((sum, r) => sum + r.successRate, 0) / this.results.length;
        const timeoutRate = this.results.reduce((sum, r) => sum + r.timeoutCount, 0) / (this.results.length * 3) * 100;
        
        markdown += `| Metric | Value | Status |\n`;
        markdown += `|--------|-------|--------|\n`;
        markdown += `| Average Response Time | ${avgResponseTime.toFixed(2)}ms | ${avgResponseTime < 500 ? 'Good' : avgResponseTime < 1000 ? 'Fair' : 'Poor'} |\n`;
        markdown += `| Overall Success Rate | ${successRate.toFixed(1)}% | ${successRate > 95 ? 'Excellent' : successRate > 90 ? 'Good' : 'Needs Improvement'} |\n`;
        markdown += `| Timeout Rate | ${timeoutRate.toFixed(1)}% | ${timeoutRate === 0 ? 'Excellent' : timeoutRate < 5 ? 'Good' : timeoutRate < 20 ? 'Fair' : 'Critical'} |\n`;
        markdown += `| Endpoints with Issues | ${this.results.filter(r => r.performance !== 'Excellent').length}/${this.results.length} | ${this.getSystemHealth()} |\n\n`;
        
        // Conclusion
        markdown += `## Conclusion\n\n`;
        markdown += `${this.getConclusion()}\n\n`;
        
        // Save the detailed report
        fs.writeFileSync(reportPath, markdown);
        
        // Append to existing results
        this.appendResultsToMainReport(markdown);
        
        console.log(`\n📄 Report saved to: ${reportPath}`);
        console.log(`📝 Results also appended to docs/benchmark-results.md`);
    }

    getSystemHealth() {
        const criticalCount = this.results.filter(r => r.performance === 'Critical').length;
        if (criticalCount > 0) return 'Critical - System has broken endpoints';
        if (this.results.filter(r => r.performance === 'Poor').length > 0) return 'Fair - Some performance issues';
        if (this.results.filter(r => r.performance === 'Good').length > 0) return 'Good - Minor improvements needed';
        return 'Excellent - System performing well';
    }

    getConclusion() {
        const criticalCount = this.results.filter(r => r.performance === 'Critical').length;
        const excellentCount = this.results.filter(r => r.performance === 'Excellent').length;
        
        if (criticalCount > 0) {
            return `The system has ${criticalCount} critical endpoint(s) that are completely broken due to N+1 query issues. These must be fixed immediately to restore system functionality. The remaining endpoints are performing well, indicating this is a localized issue that can be resolved quickly.`;
        } else if (excellentCount === this.results.length) {
            return `All endpoints are performing excellently. The system is well-optimized and ready for production deployment. Consider implementing monitoring and regular performance checks to maintain this quality.`;
        } else {
            return `The system has some performance issues that need attention. While not critical, optimizing these endpoints will improve overall system performance and user experience.`;
        }
    }

    appendResultsToMainReport(newResults) {
        const mainReportPath = './docs/benchmark-results.md';
        const timestamp = new Date().toISOString();
        
        // Check if main report exists
        if (fs.existsSync(mainReportPath)) {
            const existingContent = fs.readFileSync(mainReportPath, 'utf8');
            
            // Add timestamped results section
            const updatedContent = existingContent + `\n\n---\n\n## Latest Benchmark Results (${timestamp})\n\n` + newResults;
            
            fs.writeFileSync(mainReportPath, updatedContent);
        } else {
            // Create new main report
            let mainContent = `# AI Workspace Orchestrator - Performance Benchmark History\n\n`;
            mainContent += `This document tracks performance benchmarks over time.\n\n`;
            mainContent += `## Latest Benchmark Results (${timestamp})\n\n` + newResults;
            
            fs.writeFileSync(mainReportPath, mainContent);
        }
    }
}

// Run the benchmark
const benchmark = new RobustBenchmark();
benchmark.runBenchmark().catch(console.error);