/**
 * AI Workspace Orchestrator Performance Benchmark
 * 
 * This script benchmarks the performance of the AI Workspace Orchestrator project
 * and the ecommerce performance demo (which contains intentional N+1 query problems).
 * 
 * Usage:
 * node benchmark.js --mode ecommerce
 * node benchmark.js --mode orchestrator
 * node benchmark.js --mode comprehensive
 * node benchmark.js --mode stress-test
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Configuration
const BENCHMARK_CONFIG = {
    ecommerce: {
        baseUrl: 'http://localhost:3000',
        endpoints: [
            '/api/users-with-orders',
            '/api/orders-with-products',
            '/api/user-stats',
            '/api/users/1',
            '/api/users/2',
            '/api/users/3'
        ],
        concurrentRequests: [1, 5, 10, 20, 50],
        requestCount: 100,
        expectedResponseTime: 500 // ms
    },
    orchestrator: {
        baseUrl: 'http://localhost:3000',
        endpoints: [
            '/api/health',
            '/api/workflows',
            '/api/templates',
            '/api/engines',
            '/api/dashboard/summary'
        ],
        concurrentRequests: [1, 5, 10, 20, 50],
        requestCount: 100,
        expectedResponseTime: 300 // ms
    }
};

class PerformanceBenchmark {
    constructor(config) {
        this.config = config;
        this.results = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: [],
            errors: [],
            endpointStats: {},
            memoryUsage: [],
            cpuUsage: []
        };
    }

    async runBenchmark() {
        console.log('🚀 Starting Performance Benchmark...');
        console.log(`📊 Mode: ${this.config.mode}`);
        console.log(`🎯 Base URL: ${this.config.baseUrl}`);
        console.log(`📈 Concurrent levels: ${this.config.concurrentRequests.join(', ')}`);
        console.log(`🔢 Total requests: ${this.config.requestCount}`);
        console.log('');

        // Record initial system metrics
        this.recordSystemMetrics();

        // Run benchmarks for different concurrent levels
        for (const concurrent of this.config.concurrentRequests) {
            console.log(`🔄 Testing with ${concurrent} concurrent requests...`);
            await this.runConcurrentTest(concurrent);
        }

        // Analyze results
        this.analyzeResults();
        
        // Generate report
        this.generateReport();
    }

    async runConcurrentTest(concurrentLevel) {
        const promises = [];
        const concurrencyResults = {
            level: concurrentLevel,
            startTime: performance.now(),
            endTime: 0,
            responseTimes: [],
            errors: []
        };

        for (let i = 0; i < concurrentLevel; i++) {
            promises.push(this.makeRequest(i, concurrencyResults));
        }

        // Wait for all requests to complete
        await Promise.all(promises);
        
        concurrencyResults.endTime = performance.now();
        concurrencyResults.duration = concurrencyResults.endTime - concurrencyResults.startTime;
        
        // Store results
        this.results.endpointStats[concurrentLevel] = concurrencyResults;
        
        console.log(`✅ ${concurrentLevel} concurrent requests completed in ${concurrencyResults.duration.toFixed(2)}ms`);
        console.log(`   Success rate: ${((concurrencyResults.responseTimes.filter(r => r.success).length / (concurrentLevel * this.config.requestCount)) * 100).toFixed(1)}%`);
        console.log('');
    }

    async makeRequest(requestIndex, concurrencyResults) {
        for (let i = 0; i < this.config.requestCount; i++) {
            const endpoint = this.config.endpoints[Math.floor(Math.random() * this.config.endpoints.length)];
            const url = `${this.config.baseUrl}${endpoint}`;
            
            const startTime = performance.now();
            
            try {
                const response = await this.makeHttpRequest(url);
                const endTime = performance.now();
                const responseTime = endTime - startTime;
                
                const result = {
                    endpoint,
                    success: response.statusCode < 400,
                    responseTime,
                    requestIndex,
                    iteration: i,
                    timestamp: new Date().toISOString()
                };
                
                this.results.responseTimes.push(result);
                concurrencyResults.responseTimes.push(result);
                this.results.totalRequests++;
                
                if (result.success) {
                    this.results.successfulRequests++;
                } else {
                    this.results.failedRequests++;
                    this.results.errors.push(result);
                }
                
                // Update endpoint stats
                if (!this.results.endpointStats[endpoint]) {
                    this.results.endpointStats[endpoint] = {
                        totalRequests: 0,
                        successfulRequests: 0,
                        totalResponseTime: 0,
                        minResponseTime: Infinity,
                        maxResponseTime: 0
                    };
                }
                
                const endpointStats = this.results.endpointStats[endpoint];
                endpointStats.totalRequests++;
                endpointStats.totalResponseTime += responseTime;
                endpointStats.minResponseTime = Math.min(endpointStats.minResponseTime, responseTime);
                endpointStats.maxResponseTime = Math.max(endpointStats.maxResponseTime, responseTime);
                
                if (result.success) {
                    endpointStats.successfulRequests++;
                }
                
            } catch (error) {
                const result = {
                    endpoint,
                    success: false,
                    responseTime: performance.now() - startTime,
                    requestIndex,
                    iteration: i,
                    timestamp: new Date().toISOString(),
                    error: error.message
                };
                
                this.results.responseTimes.push(result);
                concurrencyResults.responseTimes.push(result);
                this.results.totalRequests++;
                this.results.failedRequests++;
                this.results.errors.push(result);
                concurrencyResults.errors.push(error);
            }
        }
    }

    makeHttpRequest(url) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;
            
            const options = {
                method: 'GET',
                timeout: 10000 // 10 second timeout
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

    recordSystemMetrics() {
        const usage = process.memoryUsage();
        this.results.memoryUsage.push({
            timestamp: new Date().toISOString(),
            rss: usage.rss,
            heapTotal: usage.heapTotal,
            heapUsed: usage.heapUsed,
            external: usage.external
        });
        
        const cpus = require('os').cpus();
        this.results.cpuUsage.push({
            timestamp: new Date().toISOString(),
            cpuCount: cpus.length,
            cpuUsage: cpus.map(cpu => cpu.times)
        });
    }

    analyzeResults() {
        console.log('📊 Analyzing Results...');
        
        // Calculate overall statistics
        const successfulResponses = this.results.responseTimes.filter(r => r.success);
        const failedResponses = this.results.responseTimes.filter(r => !r.success);
        
        this.results.statistics = {
            totalRequests: this.results.totalRequests,
            successfulRequests: this.results.successfulRequests,
            failedRequests: this.results.failedRequests,
            successRate: (this.results.successfulRequests / this.results.totalRequests) * 100,
            averageResponseTime: this.calculateAverage(successfulResponses.map(r => r.responseTime)),
            minResponseTime: Math.min(...successfulResponses.map(r => r.responseTime)),
            maxResponseTime: Math.max(...successfulResponses.map(r => r.responseTime)),
            p95ResponseTime: this.calculatePercentile(successfulResponses.map(r => r.responseTime), 95),
            p99ResponseTime: this.calculatePercentile(successfulResponses.map(r => r.responseTime), 99)
        };
        
        // Analyze endpoint performance
        this.results.endpointAnalysis = {};
        for (const [endpoint, stats] of Object.entries(this.results.endpointStats)) {
            if (typeof stats === 'object' && stats.totalRequests > 0) {
                this.results.endpointAnalysis[endpoint] = {
                    totalRequests: stats.totalRequests,
                    successfulRequests: stats.successfulRequests || 0,
                    successRate: (stats.successfulRequests / stats.totalRequests) * 100,
                    averageResponseTime: stats.totalResponseTime / stats.totalRequests,
                    minResponseTime: stats.minResponseTime,
                    maxResponseTime: stats.maxResponseTime
                };
            }
        }
        
        // Performance scoring
        this.results.performanceScore = this.calculatePerformanceScore();
        
        console.log(`📈 Overall Statistics:`);
        console.log(`   Total Requests: ${this.results.totalRequests}`);
        console.log(`   Success Rate: ${this.results.statistics.successRate.toFixed(2)}%`);
        console.log(`   Average Response Time: ${this.results.statistics.averageResponseTime.toFixed(2)}ms`);
        console.log(`   P95 Response Time: ${this.results.statistics.p95ResponseTime.toFixed(2)}ms`);
        console.log(`   P99 Response Time: ${this.results.statistics.p99ResponseTime.toFixed(2)}ms`);
        console.log(`   Performance Score: ${this.results.performanceScore}/100`);
        console.log('');
    }

    calculateAverage(arr) {
        return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    }

    calculatePercentile(arr, percentile) {
        const sorted = arr.sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }

    calculatePerformanceScore() {
        const stats = this.results.statistics;
        const score = 100;
        
        // Deduct points for poor performance
        let deduction = 0;
        
        // Success rate (40% of score)
        deduction += (100 - stats.successRate) * 0.4;
        
        // Response time (60% of score)
        const expectedTime = this.config.expectedResponseTime;
        const avgResponseRatio = stats.averageResponseTime / expectedTime;
        deduction += Math.max(0, (avgResponseRatio - 1) * 30);
        
        // P95 response time (additional penalty)
        const p95Ratio = stats.p95ResponseTime / expectedTime;
        deduction += Math.max(0, (p95Ratio - 1) * 20);
        
        return Math.max(0, score - deduction);
    }

    generateReport() {
        const report = {
            ...this.results,
            summary: {
                mode: this.config.mode,
                performanceGrade: this.getPerformanceGrade(),
                bottlenecks: this.identifyBottlenecks(),
                recommendations: this.generateRecommendations()
            }
        };
        
        // Save report to file
        const reportPath = path.join(__dirname, 'docs', 'benchmark-results.md');
        this.saveMarkdownReport(report);
        
        console.log('📄 Benchmark Report Generated: docs/benchmark-results.md');
        console.log(`🏆 Performance Grade: ${report.summary.performanceGrade}`);
        console.log(`⚠️  Bottlenecks: ${report.summary.bottlenecks.join(', ')}`);
        console.log(`💡 Recommendations: ${report.summary.recommendations.join(', ')}`);
        console.log('');
        console.log('🎉 Benchmark completed successfully!');
    }

    saveMarkdownReport(report) {
        const timestamp = new Date().toISOString().split('T')[0];
        const reportPath = path.join(__dirname, 'docs', `benchmark-results-${timestamp}.md`);
        
        let markdown = `# AI Workspace Orchestrator Performance Benchmark Report\n\n`;
        markdown += `**Date:** ${new Date().toISOString()}\n`;
        markdown += `**Mode:** ${report.summary.mode}\n`;
        markdown += `**Performance Grade:** ${report.summary.performanceGrade}\n\n`;
        
        // Overall Statistics
        markdown += `## Overall Statistics\n\n`;
        markdown += `| Metric | Value |\n`;
        markdown += `|--------|-------|\n`;
        markdown += `| Total Requests | ${report.statistics.totalRequests} |\n`;
        markdown += `| Successful Requests | ${report.statistics.successfulRequests} |\n`;
        markdown += `| Failed Requests | ${report.statistics.failedRequests} |\n`;
        markdown += `| Success Rate | ${report.statistics.successRate.toFixed(2)}% |\n`;
        markdown += `| Average Response Time | ${report.statistics.averageResponseTime.toFixed(2)}ms |\n`;
        markdown += `| Min Response Time | ${report.statistics.minResponseTime.toFixed(2)}ms |\n`;
        markdown += `| Max Response Time | ${report.statistics.maxResponseTime.toFixed(2)}ms |\n`;
        markdown += `| P95 Response Time | ${report.statistics.p95ResponseTime.toFixed(2)}ms |\n`;
        markdown += `| P99 Response Time | ${report.statistics.p99ResponseTime.toFixed(2)}ms |\n\n`;
        
        // Endpoint Analysis
        markdown += `## Endpoint Analysis\n\n`;
        for (const [endpoint, stats] of Object.entries(report.endpointAnalysis)) {
            markdown += `### ${endpoint}\n`;
            markdown += `- Success Rate: ${stats.successRate.toFixed(2)}%\n`;
            markdown += `- Average Response Time: ${stats.averageResponseTime.toFixed(2)}ms\n`;
            markdown += `- Min Response Time: ${stats.minResponseTime.toFixed(2)}ms\n`;
            markdown += `- Max Response Time: ${stats.maxResponseTime.toFixed(2)}ms\n\n`;
        }
        
        // Performance Analysis
        markdown += `## Performance Analysis\n\n`;
        markdown += `### Bottlenecks Identified:\n`;
        report.summary.bottlenecks.forEach(bottleneck => {
            markdown += `- ${bottleneck}\n`;
        });
        markdown += `\n`;
        
        markdown += `### Recommendations:\n`;
        report.summary.recommendations.forEach(recommendation => {
            markdown += `- ${recommendation}\n`;
        });
        markdown += `\n`;
        
        // Error Analysis
        if (report.errors.length > 0) {
            markdown += `## Error Analysis\n\n`;
            markdown += `### Recent Errors:\n`;
            report.errors.slice(0, 10).forEach(error => {
                markdown += `- ${error.endpoint}: ${error.error || 'HTTP Error'} (${error.responseTime.toFixed(2)}ms)\n`;
            });
            markdown += `\n`;
        }
        
        // System Metrics
        if (report.memoryUsage.length > 0) {
            const finalMemory = report.memoryUsage[report.memoryUsage.length - 1];
            markdown += `## System Metrics\n\n`;
            markdown += `### Final Memory Usage:\n`;
            markdown += `- RSS: ${(finalMemory.rss / 1024 / 1024).toFixed(2)} MB\n`;
            markdown += `- Heap Used: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
            markdown += `- Heap Total: ${(finalMemory.heapTotal / 1024 / 1024).toFixed(2)} MB\n\n`;
        }
        
        fs.writeFileSync(reportPath, markdown);
    }

    getPerformanceGrade() {
        const score = this.results.performanceScore;
        if (score >= 90) return 'A+ (Excellent)';
        if (score >= 80) return 'A (Very Good)';
        if (score >= 70) return 'B (Good)';
        if (score >= 60) return 'C (Fair)';
        if (score >= 50) return 'D (Poor)';
        return 'F (Critical)';
    }

    identifyBottlenecks() {
        const bottlenecks = [];
        
        // Check overall performance
        if (this.results.statistics.successRate < 95) {
            bottlenecks.push('Low success rate - check server configuration and error handling');
        }
        
        // Check response times
        if (this.results.statistics.averageResponseTime > this.config.expectedResponseTime * 1.5) {
            bottlenecks.push('High response times - consider database optimization or caching');
        }
        
        // Check P95 response times
        if (this.results.statistics.p95ResponseTime > this.config.expectedResponseTime * 2) {
            bottlenecks.push('High P95 response times - inconsistent performance detected');
        }
        
        // Check specific endpoints
        for (const [endpoint, stats] of Object.entries(this.results.endpointAnalysis)) {
            if (stats.successRate < 90) {
                bottlenecks.push(`${endpoint} has low success rate - investigate endpoint issues`);
            }
            if (stats.averageResponseTime > this.config.expectedResponseTime * 2) {
                bottlenecks.push(`${endpoint} is slow - optimize this endpoint`);
            }
        }
        
        // Check error patterns
        if (this.results.errors.length > this.results.totalRequests * 0.05) {
            bottlenecks.push('High error rate - investigate error patterns');
        }
        
        return bottlenecks.length > 0 ? bottlenecks : ['No major bottlenecks detected'];
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Performance optimization
        if (this.results.statistics.averageResponseTime > this.config.expectedResponseTime) {
            recommendations.push('Implement database indexing for frequently queried fields');
            recommendations.push('Consider implementing response caching');
            recommendations.push('Optimize slow queries and reduce N+1 query problems');
        }
        
        // Error handling
        if (this.results.errors.length > 0) {
            recommendations.push('Implement better error handling and retry mechanisms');
            recommendations.push('Add request timeouts and proper error responses');
        }
        
        // Scalability
        if (this.results.statistics.p95ResponseTime > this.config.expectedResponseTime * 1.5) {
            recommendations.push('Consider implementing load balancing or horizontal scaling');
            recommendations.push('Optimize for concurrent request handling');
        }
        
        // Monitoring
        recommendations.push('Set up real-time performance monitoring and alerting');
        recommendations.push('Implement comprehensive logging for debugging');
        recommendations.push('Consider implementing A/B testing for performance optimizations');
        
        return recommendations;
    }
}

// CLI Argument Handling
function parseArgs() {
    const args = process.argv.slice(2);
    const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'ecommerce';
    return { mode };
}

// Main execution
async function main() {
    try {
        const { mode } = parseArgs();
        
        let config;
        if (mode === 'ecommerce') {
            config = BENCHMARK_CONFIG.ecommerce;
        } else if (mode === 'orchestrator') {
            config = BENCHMARK_CONFIG.orchestrator;
        } else if (mode === 'comprehensive') {
            config = { ...BENCHMARK_CONFIG.ecommerce, mode: 'comprehensive' };
        } else if (mode === 'stress-test') {
            config = { 
                ...BENCHMARK_CONFIG.ecommerce, 
                mode: 'stress-test',
                concurrentRequests: [10, 20, 50, 100, 200],
                requestCount: 200
            };
        } else {
            console.error('Invalid mode. Use: ecommerce, orchestrator, comprehensive, or stress-test');
            process.exit(1);
        }
        
        config.mode = mode;
        
        const benchmark = new PerformanceBenchmark(config);
        await benchmark.runBenchmark();
        
    } catch (error) {
        console.error('Benchmark failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { PerformanceBenchmark, BENCHMARK_CONFIG };