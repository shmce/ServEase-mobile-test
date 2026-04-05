/**
 * Resilience utilities: Circuit Breaker + Exponential Backoff
 * Protects against cascading failures across Supabase service clients.
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreaker {
  state: CircuitState;
  failureCount: number;
  lastFailureTime?: number;
}

const circuits = new Map<string, CircuitBreaker>();
const FAILURE_THRESHOLD = 5;
const RECOVERY_TIMEOUT_MS = 30000;

function getCircuit(name: string): CircuitBreaker {
  if (!circuits.has(name)) {
    circuits.set(name, { state: 'CLOSED', failureCount: 0 });
  }
  return circuits.get(name)!;
}

export async function withResilience<T>(
  name: string,
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  const circuit = getCircuit(name);

  if (circuit.state === 'OPEN') {
    const elapsed = Date.now() - (circuit.lastFailureTime ?? 0);
    if (elapsed < RECOVERY_TIMEOUT_MS) {
      throw new Error(`Circuit breaker OPEN for service: ${name}`);
    }
    circuit.state = 'HALF_OPEN';
  }

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      circuit.state = 'CLOSED';
      circuit.failureCount = 0;
      return result;
    } catch (err) {
      lastError = err as Error;
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
