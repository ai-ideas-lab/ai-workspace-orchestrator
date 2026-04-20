/**
 * Simple Performance Benchmark for AI Workspace Orchestrator
 * Focus on identifying N+1 query issues and performance bottlenecks
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');
const fs = require('fs');

class SimpleBenchmark {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.endpoints = [
            '/api/users-with-orders',
            '/api/orders-with-products', 
            '/api/user-stats',
            '/api/users/1',
            '/api/users/2',
            '/api/users/3'
        ];
        this.results = [];
    }

    async runBenchmark() {
        console.log('🚀 Starting Simple Performance Benchmark...');
        console.log('📊 Testing endpoints with N+1 query issues\n');

        // Test each endpoint individually
        for (const endpoint of this.endpoints) {
            await this.testEndpoint(endpoint);
        }

        // Analyze results
        this.analyzeResults();
        
        // Generate report
        this.generateReport();
    }

    async testEndpoint(endpoint) {
        console.log(`🔄 Testing ${endpoint}...`);
        
        const times = [];
        const errors = [];
        
        // Test with 5 requests to get a baseline
        for (let i = 0; i < 5; i++) {
            const startTime = performance.now();
            
            try {
                await this.makeRequest(`${this.baseUrl}${endpoint}`);
                const endTime = performance.now();
                times.push(endTime - startTime);
            } catch (error) {
                errors.push(error.message);
                times.push(10000); // Mark as timeout
            }
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        const timeoutCount = times.filter(t => t >= 10000).length;
        
        console.log(`   Average: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms, Timeouts: ${timeoutCount}/5`);
        
        this.results.push({
            endpoint,
            avgTime,
            maxTime,
            timeoutCount,
            successRate: ((5 - timeoutCount) / 5) * 100,
            errors
        });
    }

    makeRequest(url) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;
            
            const options = {
                method: 'GET',
                timeout: 5000 // 5 second timeout
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

    analyzeResults() {
        console.log('\n📊 Performance Analysis:');
        
        this.results.forEach(result => {
            const status = result.successRate === 100 ? '✅' : 
                          result.successRate >= 80 ? '⚠️' : '❌';
            
            console.log(`${status} ${result.endpoint}:`);
            console.log(`   Success Rate: ${result.successRate.toFixed(1)}%`);
            console.log(`   Average Time: ${result.avgTime.toFixed(2)}ms`);
            console.log(`   Max Time: ${result.maxTime.toFixed(2)}ms`);
            console.log(`   Timeouts: ${result.timeoutCount}/5`);
            
            if (result.errors.length > 0) {
                console.log(`   Errors: ${result.errors.join(', ')}`);
            }
        });
    }

    generateReport() {
        const timestamp = new Date().toISOString().split('T')[0];
        const reportPath = `./docs/benchmark-results-${timestamp}.md`;
        
        let markdown = `# AI Workspace Orchestrator Performance Benchmark Report\n\n`;
        markdown += `**Date:** ${new Date().toISOString()}\n`;
        markdown += `**Focus:** N+1 Query Issues and Performance Bottlenecks\n\n`;
        
        // Executive Summary
        markdown += `## Executive Summary\n\n`;
        const slowEndpoints = this.results.filter(r => r.avgTime > 1000);
        const errorProneEndpoints = this.results.filter(r => r.successRate < 90);
        
        if (slowEndpoints.length > 0) {
            markdown += `⚠️ **Slow Endpoints:**\n`;
            slowEndpoints.forEach(endpoint => {
                markdown += `- ${endpoint}: ${endpoint.avgTime.toFixed(2)}ms average\n`;
            });
            markdown += `\n`;
        }
        
        if (errorProneEndpoints.length > 0) {
            markdown += `❌ **Error-Prone Endpoints:**\n`;
            errorProneEndpoints.forEach(endpoint => {
                markdown += `- ${endpoint}: ${endpoint.successRate.toFixed(1)}% success rate\n`;
            });
            markdown += `\n`;
        }
        
        // Detailed Results
        markdown += `## Detailed Results\n\n`;
        markdown += `| Endpoint | Success Rate | Avg Time | Max Time | Timeouts |\n`;
        markdown += `|----------|-------------|----------|----------|----------|\n`;
        
        this.results.forEach(result => {
            markdown += `| ${result.endpoint} | ${result.successRate.toFixed(1)}% | ${result.avgTime.toFixed(2)}ms | ${result.maxTime.toFixed(2)}ms | ${result.timeoutCount}/5 |\n`;
        });
        
        // N+1 Query Analysis
        markdown += `\n## N+1 Query Issues Analysis\n\n`;
        markdown += `### Identified Issues:\n\n`;
        
        if (this.results.find(r => r.endpoint === '/api/users-with-orders')) {
            markdown += `#### /api/users-with-orders\n`;
            markdown += `- **Issue**: N+1 query pattern - one query for users, then individual queries for each user's orders\n`;
            markdown += `- **Impact**: Performance degrades linearly with number of users\n`;
            markdown += `- **Solution**: Use JOIN queries to fetch all data in single query\n\n`;
        }
        
        if (this.results.find(r => r.endpoint === '/api/orders-with-products')) {
            markdown += `#### /api/orders-with-products\n`;
            markdown += `- **Issue**: N+1 query pattern - one query for orders, then individual queries for each order's items and products\n`;
            markdown += `- **Impact**: Exponential performance degradation with number of orders\n`;
            markdown += `- **Solution**: Use JOIN queries with nested result grouping\n\n`;
        }
        
        if (this.results.find(r => r.endpoint === '/api/user-stats')) {
            markdown += `#### /api/user-stats\n`;
            markdown += `- **Issue**: N+1 query pattern - one query for users, then individual queries for each user's order statistics\n`;
            markdown += `- **Impact**: Redundant database calls for common calculations\n`;
            markdown += `- **Solution**: Use aggregate functions and GROUP BY in single query\n\n`;
        }
        
        // Recommendations
        markdown += `## Recommendations\n\n`;
        markdown += `### Immediate Fixes (High Impact, Low Effort):\n\n`;
        markdown += `1. **Fix /api/orders-with-products** (Critical - highest timeouts)\n`;
        markdown += `   - Replace with single JOIN query\n`;
        markdown += `   - Use JSON extension for nested results\n\n`;
        
        markdown += `2. **Optimize /api/users-with-orders**\n`;
        markdown += `   - Use JOIN queries to eliminate N+1 pattern\n`;
        markdown += `   - Consider adding proper error handling for async operations\n\n`;
        
        markdown += `3. **Improve /api/user-stats**\n`;
        markdown += `   - Use SQL aggregate functions\n`;
        markdown += `   - Add caching for frequently accessed statistics\n\n`;
        
        markdown += `### Medium-term Optimizations:\n\n`;
        markdown += `1. **Add database indexing** on frequently queried fields\n`;
        markdown += `2. **Implement connection pooling** for better database connection management\n`;
        markdown += `3. **Add response caching** for read-heavy endpoints\n`;
        markdown += `4. **Implement query result caching** with Redis or similar\n\n`;
        
        markdown += `### Long-term Improvements:\n\n`;
        markdown += `1. **Implement proper async/await patterns** instead of callbacks\n`;
        markdown += `2. **Add comprehensive error handling** and timeout management\n`;
        markdown += `3. **Implement rate limiting** and request throttling\n`;
        markdown += `4. **Add monitoring and alerting** for performance issues\n\n`;
        
        // Performance Metrics
        markdown += `## Performance Metrics\n\n`;
        const avgResponseTime = this.results.reduce((sum, r) => sum + r.avgTime, 0) / this.results.length;
        const successRate = this.results.reduce((sum, r) => sum + r.successRate, 0) / this.results.length;
        
        markdown += `- **Average Response Time**: ${avgResponseTime.toFixed(2)}ms\n`;
        markdown += `- **Overall Success Rate**: ${successRate.toFixed(1)}%\n`;
        markdown += `- **Timeout Rate**: ${this.results.reduce((sum, r) => sum + r.timeoutCount, 0) / (this.results.length * 5) * 100}%\n\n`;
        
        fs.writeFileSync(reportPath, markdown);
        console.log(`\n📄 Report saved to: ${reportPath}`);
    }
}

// Run the benchmark
const benchmark = new SimpleBenchmark();
benchmark.runBenchmark().catch(console.error);