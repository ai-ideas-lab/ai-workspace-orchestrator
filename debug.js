const { loadBalancer } = require('./src/services/load-balancer.ts');

// 注册引擎
loadBalancer.registerEngine('web-server-1', 100);
loadBalancer.registerEngine('web-server-2', 300);
loadBalancer.registerEngine('web-server-3', 100);

// 进行初始选择
const selections = [];
for (let i = 0; i < 200; i++) {
  const selected = loadBalancer.selectEngine();
  if (selected) {
    selections.push(selected);
  }
}

// 初始分布
const distribution = {
  'web-server-1': selections.filter(s => s === 'web-server-1').length,
  'web-server-2': selections.filter(s => s === 'web-server-2').length,
  'web-server-3': selections.filter(s => s === 'web-server-3').length,
};

console.log('初始分布:', distribution);

// 更新性能数据
const performanceSnapshots = [
  {
    engineId: 'web-server-1',
    avgResponseMs: 20,
    successRate: 0.98,
    requestsInFlight: 3,
    activeRequests: 3,
  },
  {
    engineId: 'web-server-2',
    avgResponseMs: 200,
    successRate: 0.7,
    requestsInFlight: 15,
    activeRequests: 15,
  },
  {
    engineId: 'web-server-3',
    avgResponseMs: 30,
    successRate: 0.95,
    requestsInFlight: 2,
    activeRequests: 2,
  },
];

loadBalancer.updateWeights(performanceSnapshots);

// 获取更新后的权重信息
const weightInfo = loadBalancer.getWeightInfo();
console.log('更新后的权重信息:', weightInfo);

// 进行新的选择
const newSelections = [];
for (let i = 0; i < 100; i++) {
  const selected = loadBalancer.selectEngine();
  if (selected) {
    newSelections.push(selected);
  }
}

// 新的分布
const newDistribution = {
  'web-server-1': newSelections.filter(s => s === 'web-server-1').length,
  'web-server-2': newSelections.filter(s => s === 'web-server-2').length,
  'web-server-3': newSelections.filter(s => s === 'web-server-3').length,
};

console.log('新分布:', newDistribution);
console.log('web-server-1 > web-server-2:', newDistribution['web-server-1'] > newDistribution['web-server-2']);