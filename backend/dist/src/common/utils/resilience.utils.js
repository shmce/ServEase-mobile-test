"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withResilience = withResilience;
const circuits = new Map();
const FAILURE_THRESHOLD = 5;
const RECOVERY_TIMEOUT_MS = 30000;
function getCircuit(name) {
    if (!circuits.has(name)) {
        circuits.set(name, { state: 'CLOSED', failureCount: 0 });
    }
    return circuits.get(name);
}
async function withResilience(name, fn, maxRetries = 3) {
    const circuit = getCircuit(name);
    if (circuit.state === 'OPEN') {
        const elapsed = Date.now() - (circuit.lastFailureTime ?? 0);
        if (elapsed < RECOVERY_TIMEOUT_MS) {
            throw new Error(`Circuit breaker OPEN for service: ${name}`);
        }
        circuit.state = 'HALF_OPEN';
    }
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await fn();
            circuit.state = 'CLOSED';
            circuit.failureCount = 0;
            return result;
        }
        catch (err) {
            lastError = err;
            circuit.failureCount++;
            circuit.lastFailureTime = Date.now();
            if (circuit.failureCount >= FAILURE_THRESHOLD) {
                circuit.state = 'OPEN';
                throw new Error(`Circuit breaker tripped for service: ${name}`);
            }
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 100;
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}
//# sourceMappingURL=resilience.utils.js.map