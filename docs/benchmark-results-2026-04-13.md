# AI Workspace Orchestrator Performance Benchmark Report

**Date:** 2026-04-13T20:50:52.486Z
**Mode:** ecommerce
**Performance Grade:** C (Fair)

## Overall Statistics

| Metric | Value |
|--------|-------|
| Total Requests | 8600 |
| Successful Requests | 58 |
| Failed Requests | 8542 |
| Success Rate | 0.67% |
| Average Response Time | 3.36ms |
| Min Response Time | 0.83ms |
| Max Response Time | 33.99ms |
| P95 Response Time | 10.72ms |
| P99 Response Time | 33.99ms |

## Endpoint Analysis

### /api/users/3
- Success Rate: 100.00%
- Average Response Time: 4.88ms
- Min Response Time: 0.85ms
- Max Response Time: 33.99ms

### /api/users/2
- Success Rate: 100.00%
- Average Response Time: 2.62ms
- Min Response Time: 0.83ms
- Max Response Time: 11.38ms

### /api/users-with-orders
- Success Rate: 100.00%
- Average Response Time: 4.39ms
- Min Response Time: 1.90ms
- Max Response Time: 10.72ms

### /api/user-stats
- Success Rate: 100.00%
- Average Response Time: 2.83ms
- Min Response Time: 1.08ms
- Max Response Time: 4.66ms

### /api/users/1
- Success Rate: 100.00%
- Average Response Time: 1.37ms
- Min Response Time: 0.83ms
- Max Response Time: 2.47ms

## Performance Analysis

### Bottlenecks Identified:
- Low success rate - check server configuration and error handling
- High error rate - investigate error patterns

### Recommendations:
- Implement better error handling and retry mechanisms
- Add request timeouts and proper error responses
- Set up real-time performance monitoring and alerting
- Implement comprehensive logging for debugging
- Consider implementing A/B testing for performance optimizations

## Error Analysis

### Recent Errors:
- /api/orders-with-products: Request timeout (10004.78ms)
- /api/orders-with-products: Request timeout (10001.66ms)
- /api/orders-with-products: Request timeout (10003.02ms)
- /api/orders-with-products: Request timeout (10001.05ms)
- /api/orders-with-products: Request timeout (10003.19ms)
- /api/orders-with-products: Request timeout (10001.39ms)
- /api/orders-with-products: Request timeout (10003.63ms)
- /api/orders-with-products: Request timeout (10003.40ms)
- /api/orders-with-products: Request timeout (10001.72ms)
- /api/orders-with-products: socket hang up (8123.34ms)

## System Metrics

### Final Memory Usage:
- RSS: 33.61 MB
- Heap Used: 4.99 MB
- Heap Total: 5.85 MB

