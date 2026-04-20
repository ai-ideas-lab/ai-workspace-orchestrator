import request from 'supertest';
import app from '../src/index';
describe('API Health Checks', () => {
    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('version');
            expect(response.body.message).toBe('AI Workspace Orchestrator is running');
        });
        it('should return correct timestamp format', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);
            expect(response.body.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
        });
    });
    describe('GET /', () => {
        it('should return basic info', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('endpoints');
            expect(response.body.message).toBe('AI Workspace Orchestrator API');
            expect(response.body.version).toBe('1.0.0');
        });
        it('should include correct endpoints', async () => {
            const response = await request(app)
                .get('/')
                .expect(200);
            expect(response.body.endpoints).toHaveProperty('health');
            expect(response.body.endpoints).toHaveProperty('status');
            expect(response.body.endpoints.health).toBe('/health');
            expect(response.body.endpoints.status).toBe('/status');
        });
    });
    describe('GET /status', () => {
        it('should return system status', async () => {
            const response = await request(app)
                .get('/status')
                .expect(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('status', 'operational');
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('memoryUsage');
            expect(typeof response.body.uptime).toBe('number');
            expect(response.body.memoryUsage).toHaveProperty('rss');
            expect(response.body.memoryUsage).toHaveProperty('heapTotal');
            expect(response.body.memoryUsage).toHaveProperty('heapUsed');
            expect(response.body.memoryUsage).toHaveProperty('external');
        });
        it('should have valid timestamp format', async () => {
            const response = await request(app)
                .get('/status')
                .expect(200);
            expect(response.body.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/);
        });
    });
});
describe('Error Handling', () => {
    describe('GET /nonexistent', () => {
        it('should return 404 for unknown endpoints', async () => {
            const response = await request(app)
                .get('/nonexistent')
                .expect(404);
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', '端点未找到');
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('/nonexistent');
        });
    });
});
describe('Server Response Headers', () => {
    it('should include proper CORS headers', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);
        expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
    it('should include JSON content type', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);
        expect(response.headers).toHaveProperty('content-type');
        expect(response.headers['content-type']).toMatch(/application\/json/);
    });
});
//# sourceMappingURL=api.test.js.map