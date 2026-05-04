function calculateOptimalInventory(demand: number, leadTime: number, safetyStock: number = 0): number {
    return demand * leadTime + safetyStock;
}

export { calculateOptimalInventory };