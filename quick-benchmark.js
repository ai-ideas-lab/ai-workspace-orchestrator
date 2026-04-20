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
                const response = await this.makeRequest(this.baseUrl + endpoint);
                const endTime = performance.now();
                times.push(endTime - startTime);
            } catch (error) {
                errors.push(error.message);
            }
        }

        const result = {
            endpoint,
            successRate: ((5 - errors.length) / 5) * 100,
            avgTime: times.reduce((a, b) => a + b, 0) / times.length,
            maxTime: Math.max(...times),
            minTime: Math.min(...times),
            timeouts: errors.length,
            errors: errors
        };

        this.results.push(result);

        console.log(`   Average: ${result.avgTime.toFixed(2)}ms, Max: ${result.maxTime.toFixed(2)}ms, Timeouts: ${result.timeouts}/5`);
    }

    makeRequest(url) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            
            const req = client.get(url, (res) => {
                if (res.statusCode === 200) {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve(data));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });

            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.on('error', reject);
        });
    }

    analyzeResults() {
        this.functionalEndpoints = this.results.filter(r => r.successRate > 0);
        this.failedEndpoints = this.results.filter(r => r.successRate === 0);
        
        this.totalAvgTime = this.functionalEndpoints.reduce((sum, r) => sum + r.avgTime, 0) / this.functionalEndpoints.length;
        this.overallSuccessRate = this.results.reduce((sum, r) => sum + r.successRate, 0) / this.results.length;
    }

    generateReport() {
        console.log('\n📊 Performance Analysis:');
        
        this.results.forEach(result => {
            if (result.successRate === 0) {
                console.log(`❌ ${result.endpoint}:`);
                console.log(`   Success Rate: ${result.successRate}%`);
                console.log(`   Errors: ${result.errors.join(', ')}`);
            } else {
                console.log(`✅ ${result.endpoint}:`);
                console.log(`   Success Rate: ${result.successRate.toFixed(1)}%`);
                console.log(`   Average Time: ${result.avgTime.toFixed(2)}ms`);
                console.log(`   Max Time: ${result.maxTime.toFixed(2)}ms`);
                console.log(`   Timeouts: ${result.timeouts}/5`);
            }
        });

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalEndpoints: this.results.length,
                functionalEndpoints: this.functionalEndpoints.length,
                failedEndpoints: this.failedEndpoints.length,
                overallSuccessRate: this.overallSuccessRate,
                avgResponseTime: this.totalAvgTime
            },
            detailedResults: this.results
        };

        // Save report to file
        const reportPath = './docs/benchmark-results.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Report saved to: ${reportPath}`);
    }
}

// Run benchmark
const benchmark = new SimpleBenchmark();
benchmark.runBenchmark().catch(console.error);