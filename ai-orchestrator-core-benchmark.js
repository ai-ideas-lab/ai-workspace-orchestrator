/**
 * AI Workspace Orchestrator - Core Function Performance Benchmark
 * 
 * Benchmarks the performance of core utility functions, algorithms, and
 * data processing operations in the AI Workspace Orchestrator project.
 * This helps identify bottlenecks in the core functionality that might
 * affect overall system performance.
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Import utility functions from the project
const projectUtils = {
    // Common utilities from the project
    formatDate: (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    generateSimpleId: (length = 8) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    isValidUrl: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    // Array processing functions
    processArray: (data, operation) => {
        switch (operation) {
            case 'sort':
                return [...data].sort((a, b) => a - b);
            case 'filter':
                return data.filter(item => item > 50);
            case 'map':
                return data.map(item => item * 2);
            case 'reduce':
                return data.reduce((sum, item) => sum + item, 0);
            default:
                return data;
        }
    },

    // Object processing functions
    processObject: (obj, operation) => {
        switch (operation) {
            case 'keys':
                return Object.keys(obj);
            case 'values':
                return Object.values(obj);
            case 'entries':
                return Object.entries(obj);
            case 'clone':
                return JSON.parse(JSON.stringify(obj));
            default:
                return obj;
        }
    },

    // String processing functions
    processString: (str, operation) => {
        switch (operation) {
            case 'uppercase':
                return str.toUpperCase();
            case 'lowercase':
                return str.toLowerCase();
            case 'reverse':
                return str.split('').reverse().join('');
            case 'length':
                return str.length;
            case 'wordCount':
                return str.split(/\s+/).length;
            default:
                return str;
        }
    }
};

class AIOrchestratorBenchmark {
    constructor() {
        this.results = [];
        this.testData = {
            smallArray: Array.from({ length: 100 }, (_, i) => i + 1),
            mediumArray: Array.from({ length: 1000 }, (_, i) => i + 1),
            largeArray: Array.from({ length: 10000 }, (_, i) => i + 1),
            testObject: {
                id: 1,
                name: 'Test Object',
                data: Array.from({ length: 50 }, (_, i) => ({ id: i, value: Math.random() * 100 }))
            },
            testString: 'This is a test string for performance benchmarking. It contains multiple words and characters to process.'
        };
    }

    async runBenchmark() {
        console.log('🚀 Starting AI Workspace Orchestrator Core Function Benchmark...');
        console.log('📊 Testing utility functions, array processing, and algorithms\n');

        // Test utility functions
        await this.testUtilityFunctions();
        
        // Test array processing
        await this.testArrayProcessing();
        
        // Test object processing
        await this.testObjectProcessing();
        
        // Test string processing
        await this.testStringProcessing();
        
        // Test file operations
        await this.testFileOperations();
        
        // Analyze results
        this.analyzeResults();
        
        // Generate report
        this.generateReport();
    }

    async testUtilityFunctions() {
        console.log('🔧 Testing Utility Functions...');
        
        const tests = [
            { name: 'formatDate', fn: () => projectUtils.formatDate(new Date()), iterations: 1000 },
            { name: 'isValidEmail', fn: () => projectUtils.isValidEmail('test@example.com'), iterations: 1000 },
            { name: 'generateSimpleId', fn: () => projectUtils.generateSimpleId(), iterations: 1000 },
            { name: 'isValidUrl', fn: () => projectUtils.isValidUrl('https://example.com'), iterations: 1000 }
        ];

        for (const test of tests) {
            const times = [];
            
            for (let i = 0; i < test.iterations; i++) {
                const startTime = performance.now();
                test.fn();
                times.push(performance.now() - startTime);
            }

            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxTime = Math.max(...times);
            const minTime = Math.min(...times);

            this.results.push({
                category: 'Utility Functions',
                name: test.name,
                avgTime: avgTime.toFixed(4),
                maxTime: maxTime.toFixed(4),
                minTime: minTime.toFixed(4),
                iterations: test.iterations,
                performance: avgTime < 0.1 ? 'Excellent' : avgTime < 1 ? 'Good' : 'Fair'
            });
        }
    }

    async testArrayProcessing() {
        console.log('📊 Testing Array Processing...');
        
        const tests = [
            { name: 'Small Array Sort', data: this.testData.smallArray, operation: 'sort' },
            { name: 'Small Array Filter', data: this.testData.smallArray, operation: 'filter' },
            { name: 'Small Array Map', data: this.testData.smallArray, operation: 'map' },
            { name: 'Small Array Reduce', data: this.testData.smallArray, operation: 'reduce' },
            { name: 'Medium Array Sort', data: this.testData.mediumArray, operation: 'sort' },
            { name: 'Medium Array Filter', data: this.testData.mediumArray, operation: 'filter' },
            { name: 'Medium Array Map', data: this.testData.mediumArray, operation: 'map' },
            { name: 'Medium Array Reduce', data: this.testData.mediumArray, operation: 'reduce' },
            { name: 'Large Array Sort', data: this.testData.largeArray, operation: 'sort' },
            { name: 'Large Array Filter', data: this.testData.largeArray, operation: 'filter' },
            { name: 'Large Array Map', data: this.testData.largeArray, operation: 'map' },
            { name: 'Large Array Reduce', data: this.testData.largeArray, operation: 'reduce' }
        ];

        for (const test of tests) {
            const times = [];
            
            // Test multiple iterations for consistency
            for (let i = 0; i < 5; i++) {
                const startTime = performance.now();
                projectUtils.processArray(test.data, test.operation);
                times.push(performance.now() - startTime);
            }

            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            
            this.results.push({
                category: 'Array Processing',
                name: test.name,
                avgTime: avgTime.toFixed(4),
                maxTime: Math.max(...times).toFixed(4),
                minTime: Math.min(...times).toFixed(4),
                dataPoints: test.data.length,
                performance: avgTime < 10 ? 'Excellent' : avgTime < 100 ? 'Good' : 'Fair'
            });
        }
    }

    async testObjectProcessing() {
        console.log('🔍 Testing Object Processing...');
        
        const tests = [
            { name: 'Get Keys', obj: this.testData.testObject, operation: 'keys' },
            { name: 'Get Values', obj: this.testData.testObject, operation: 'values' },
            { name: 'Get Entries', obj: this.testData.testObject, operation: 'entries' },
            { name: 'Deep Clone', obj: this.testData.testObject, operation: 'clone' }
        ];

        for (const test of tests) {
            const times = [];
            
            for (let i = 0; i < 100; i++) {
                const startTime = performance.now();
                projectUtils.processObject(test.obj, test.operation);
                times.push(performance.now() - startTime);
            }

            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            
            this.results.push({
                category: 'Object Processing',
                name: test.name,
                avgTime: avgTime.toFixed(4),
                maxTime: Math.max(...times).toFixed(4),
                minTime: Math.min(...times).toFixed(4),
                performance: avgTime < 1 ? 'Excellent' : avgTime < 5 ? 'Good' : 'Fair'
            });
        }
    }

    async testStringProcessing() {
        console.log('📝 Testing String Processing...');
        
        const tests = [
            { name: 'Uppercase', str: this.testData.testString, operation: 'uppercase' },
            { name: 'Lowercase', str: this.testData.testString, operation: 'lowercase' },
            { name: 'Reverse', str: this.testData.testString, operation: 'reverse' },
            { name: 'Length', str: this.testData.testString, operation: 'length' },
            { name: 'Word Count', str: this.testData.testString, operation: 'wordCount' }
        ];

        for (const test of tests) {
            const times = [];
            
            for (let i = 0; i < 100; i++) {
                const startTime = performance.now();
                projectUtils.processString(test.str, test.operation);
                times.push(performance.now() - startTime);
            }

            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            
            this.results.push({
                category: 'String Processing',
                name: test.name,
                avgTime: avgTime.toFixed(4),
                maxTime: Math.max(...times).toFixed(4),
                minTime: Math.min(...times).toFixed(4),
                stringLength: test.str.length,
                performance: avgTime < 0.1 ? 'Excellent' : avgTime < 1 ? 'Good' : 'Fair'
            });
        }
    }

    async testFileOperations() {
        console.log('📁 Testing File Operations...');
        
        const testFile = '/tmp/benchmark-test-file.json';
        const testData = { test: 'data', timestamp: Date.now() };
        
        try {
            // Test file write
            const writeTimes = [];
            for (let i = 0; i < 10; i++) {
                const startTime = performance.now();
                fs.writeFileSync(testFile, JSON.stringify(testData));
                writeTimes.push(performance.now() - startTime);
            }
            
            const avgWriteTime = writeTimes.reduce((a, b) => a + b, 0) / writeTimes.length;
            
            // Test file read
            const readTimes = [];
            for (let i = 0; i < 10; i++) {
                const startTime = performance.now();
                fs.readFileSync(testFile, 'utf8');
                readTimes.push(performance.now() - startTime);
            }
            
            const avgReadTime = readTimes.reduce((a, b) => a + b, 0) / readTimes.length;
            
            // Clean up
            if (fs.existsSync(testFile)) {
                fs.unlinkSync(testFile);
            }
            
            this.results.push({
                category: 'File Operations',
                name: 'File Write',
                avgTime: avgWriteTime.toFixed(4),
                maxTime: Math.max(...writeTimes).toFixed(4),
                minTime: Math.min(...writeTimes).toFixed(4),
                performance: avgWriteTime < 1 ? 'Excellent' : avgWriteTime < 5 ? 'Good' : 'Fair'
            });
            
            this.results.push({
                category: 'File Operations',
                name: 'File Read',
                avgTime: avgReadTime.toFixed(4),
                maxTime: Math.max(...readTimes).toFixed(4),
                minTime: Math.min(...readTimes).toFixed(4),
                performance: avgReadTime < 1 ? 'Excellent' : avgReadTime < 5 ? 'Good' : 'Fair'
            });
            
        } catch (error) {
            console.warn('⚠️ File operations test skipped:', error.message);
        }
    }

    analyzeResults() {
        console.log('\n📊 Performance Analysis...');
        
        const categories = {};
        let totalTests = 0;
        let excellentTests = 0;
        let goodTests = 0;
        let fairTests = 0;
        
        for (const result of this.results) {
            if (!categories[result.category]) {
                categories[result.category] = [];
            }
            categories[result.category].push(result);
            totalTests++;
            
            switch (result.performance) {
                case 'Excellent':
                    excellentTests++;
                    break;
                case 'Good':
                    goodTests++;
                    break;
                case 'Fair':
                    fairTests++;
                    break;
            }
        }
        
        this.analysis = {
            totalTests,
            excellentTests,
            goodTests,
            fairTests,
            excellentPercentage: (excellentTests / totalTests * 100).toFixed(1),
            goodPercentage: (goodTests / totalTests * 100).toFixed(1),
            fairPercentage: (fairTests / totalTests * 100).toFixed(1),
            categories
        };
    }

    generateReport() {
        console.log('\n📄 AI Workspace Orchestrator Core Function Benchmark Report');
        console.log('=' * 60);
        
        console.log(`📊 Total Tests: ${this.analysis.totalTests}`);
        console.log(`✅ Excellent Performance: ${this.analysis.excellentTests} (${this.analysis.excellentPercentage}%)`);
        console.log(`👍 Good Performance: ${this.analysis.goodTests} (${this.analysis.goodPercentage}%)`);
        console.log(`⚠️ Fair Performance: ${this.analysis.fairTests} (${this.analysis.fairPercentage}%)`);
        
        console.log('\n📈 Detailed Results by Category:');
        
        for (const [category, results] of Object.entries(this.analysis.categories)) {
            console.log(`\n${category}:`);
            console.log('-' * 30);
            
            for (const result of results) {
                console.log(`  ${result.name}: ${result.performance} (${result.avgTime}ms avg)`);
            }
        }
        
        // Find the slowest operation
        const slowest = this.results.reduce((prev, current) => 
            parseFloat(current.avgTime) > parseFloat(prev.avgTime) ? current : prev
        );
        
        console.log(`\n🐌 Slowest Operation: ${slowest.name} (${slowest.avgTime}ms avg)`);
        
        // Generate performance recommendations
        this.generateRecommendations();
        
        // Save report
        this.saveReport();
    }

    generateRecommendations() {
        console.log('\n💡 Performance Recommendations:');
        
        const slowOperations = this.results.filter(r => r.performance === 'Fair');
        
        if (slowOperations.length > 0) {
            console.log('🔧 Optimize the following operations:');
            for (const op of slowOperations) {
                console.log(`  - ${op.name}: Consider caching or algorithm optimization`);
            }
        } else {
            console.log('🎉 All operations are performing well! No optimization needed.');
        }
        
        console.log('\n📊 General Recommendations:');
        console.log('  - Monitor memory usage in array operations');
        console.log('  - Consider memoization for frequently called utility functions');
        console.log('  - Implement async file operations for better performance');
        console.log('  - Add rate limiting for intensive operations');
    }

    saveReport() {
        const slowOperations = this.results.filter(r => r.performance === 'Fair');
        
        const report = {
            timestamp: new Date().toISOString(),
            project: 'AI Workspace Orchestrator',
            benchmarkType: 'Core Function Performance',
            analysis: this.analysis,
            results: this.results
        };
        
        const reportPath = path.join(__dirname, 'docs', 'ai-orchestrator-core-benchmark-results.json');
        const mdReportPath = path.join(__dirname, 'docs', 'ai-orchestrator-core-benchmark-results.md');
        
        // Save JSON report
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Save MD report
        const mdReport = `# AI Workspace Orchestrator - Core Function Performance Benchmark

**Date:** ${report.timestamp}
**Project:** AI Workspace Orchestrator
**Benchmark Type:** Core Function Performance

## Summary

- Total Tests: ${this.analysis.totalTests}
- Excellent Performance: ${this.analysis.excellentTests} (${this.analysis.excellentPercentage}%)
- Good Performance: ${this.analysis.goodTests} (${this.analysis.goodPercentage}%)
- Fair Performance: ${this.analysis.fairTests} (${this.analysis.fairPercentage}%)

## Results

${this.results.map(r => 
    `- **${r.category} - ${r.name}**: ${r.performance} (${r.avgTime}ms average)`
).join('\n')}

## Recommendations

${slowOperations.length > 0 ? 
    `### Optimization Needed:
${slowOperations.map(op => `- **${op.name}**: Consider caching or algorithm optimization`).join('\n')}` : 
    '### All operations are performing well! No optimization needed.'
}

### General Recommendations:

${slowOperations.length > 0 ? 
    `### Optimization Needed:
${slowOperations.map(op => `- **${op.name}**: Consider caching or algorithm optimization`).join('\n')}` : 
    '### All operations are performing well! No optimization needed.'
}

### General Recommendations:
- Monitor memory usage in array operations
- Consider memoization for frequently called utility functions
- Implement async file operations for better performance
- Add rate limiting for intensive operations

---
*Generated by AI Workspace Orchestrator Benchmark Tool*
`;
        
        fs.writeFileSync(mdReportPath, mdReport);
        
        console.log(`📄 Reports saved:`);
        console.log(`  - ${reportPath}`);
        console.log(`  - ${mdReportPath}`);
        
        // Append to main benchmark results
        this.appendToMainBenchmark(mdReport);
    }

    appendToMainBenchmark(reportContent) {
        const mainReportPath = path.join(__dirname, 'docs', 'benchmark-results.md');
        
        try {
            const existingContent = fs.readFileSync(mainReportPath, 'utf8');
            
            // Find where to insert the new benchmark
            const insertPosition = existingContent.indexOf('## Conclusion');
            
            if (insertPosition !== -1) {
                const beforeInsert = existingContent.substring(0, insertPosition);
                const afterInsert = existingContent.substring(insertPosition);
                
                const newContent = beforeInsert + reportContent + '\n\n' + afterInsert;
                fs.writeFileSync(mainReportPath, newContent);
            } else {
                // If no conclusion section found, append at the end
                fs.appendFileSync(mainReportPath, '\n\n' + reportContent);
            }
            
            console.log(`📝 Results appended to ${mainReportPath}`);
        } catch (error) {
            console.warn('⚠️ Could not append to main benchmark results:', error.message);
        }
    }
}

// Run the benchmark
if (require.main === module) {
    const benchmark = new AIOrchestratorBenchmark();
    benchmark.runBenchmark().catch(console.error);
}

module.exports = { AIOrchestratorBenchmark, projectUtils };