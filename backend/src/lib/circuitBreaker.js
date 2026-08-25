/**
 * Circuit Breaker Pattern
 * Prevents cascading failures when external services (NVIDIA API) are down.
 * 
 * States:
 * - CLOSED: Normal operation, requests flow through
 * - OPEN: Service is down, requests fail immediately without calling service
 * - HALF_OPEN: Testing if service recovered, allows limited requests through
 */

const STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
};

export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeoutMs = options.resetTimeoutMs || 60_000; // 1 minute
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3;
    this.monitorWindowMs = options.monitorWindowMs || 10_000; // 10 seconds
    
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.halfOpenCalls = 0;
    this.name = options.name || 'circuit';
    
    // Metrics
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      rejectedCalls: 0,
      stateChanges: [],
    };
  }

  getState() {
    return this.state;
  }

  getMetrics() {
    return {
      ...this.metrics,
      currentState: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  recordStateChange(newState, reason) {
    this.metrics.stateChanges.push({
      from: this.state,
      to: newState,
      reason,
      timestamp: Date.now(),
    });
    
    // Keep only last 20 state changes
    if (this.metrics.stateChanges.length > 20) {
      this.metrics.stateChanges.shift();
    }
  }

  canExecute() {
    const now = Date.now();

    switch (this.state) {
      case STATES.CLOSED:
        return true;

      case STATES.OPEN:
        // Check if reset timeout has elapsed
        if (now - this.lastFailureTime >= this.resetTimeoutMs) {
          console.log(`[${this.name}] Circuit half-open, allowing test requests`);
          this.state = STATES.HALF_OPEN;
          this.halfOpenCalls = 0;
          this.recordStateChange(STATES.HALF_OPEN, 'Reset timeout elapsed');
          return true;
        }
        return false;

      case STATES.HALF_OPEN:
        // Allow limited requests through
        return this.halfOpenCalls < this.halfOpenMaxCalls;

      default:
        return false;
    }
  }

  async execute(fn) {
    this.metrics.totalCalls++;

    if (!this.canExecute()) {
      this.metrics.rejectedCalls++;
      const retryAfter = this.state === STATES.OPEN
        ? Math.ceil((this.resetTimeoutMs - (Date.now() - this.lastFailureTime)) / 1000)
        : 10;
      
      throw new CircuitBreakerError(
        `Service temporarily unavailable. Please try again in ${retryAfter} seconds.`,
        this.state,
        retryAfter
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  onSuccess() {
    this.metrics.successfulCalls++;

    switch (this.state) {
      case STATES.HALF_OPEN:
        this.successCount++;
        if (this.successCount >= this.halfOpenMaxCalls) {
          console.log(`[${this.name}] Circuit closed - service recovered`);
          this.state = STATES.CLOSED;
          this.failureCount = 0;
          this.successCount = 0;
          this.recordStateChange(STATES.CLOSED, 'Service recovered');
        }
        break;

      case STATES.CLOSED:
        // Reset failure count on success
        this.failureCount = Math.max(0, this.failureCount - 1);
        break;
    }
  }

  onFailure(error) {
    this.metrics.failedCalls++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    switch (this.state) {
      case STATES.CLOSED:
        if (this.failureCount >= this.failureThreshold) {
          console.error(`[${this.name}] Circuit opened after ${this.failureCount} failures:`, error.message);
          this.state = STATES.OPEN;
          this.recordStateChange(STATES.OPEN, `${this.failureThreshold} consecutive failures`);
        }
        break;

      case STATES.HALF_OPEN:
        // Any failure in half-open goes back to open
        console.error(`[${this.name}] Circuit opened again - recovery failed:`, error.message);
        this.state = STATES.OPEN;
        this.successCount = 0;
        this.recordStateChange(STATES.OPEN, 'Recovery failed');
        break;
    }
  }

  // Manual reset for admin use
  reset() {
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenCalls = 0;
    this.recordStateChange(STATES.CLOSED, 'Manual reset');
    console.log(`[${this.name}] Circuit manually reset`);
  }
}

// Custom error class for circuit breaker rejections
export class CircuitBreakerError extends Error {
  constructor(message, circuitState, retryAfter) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.circuitState = circuitState;
    this.retryAfter = retryAfter;
    this.isCircuitBreakerError = true;
  }
}

// Create a singleton circuit breaker for NVIDIA API
export const nvidiaCircuitBreaker = new CircuitBreaker({
  name: 'nvidia-api',
  failureThreshold: 5,        // Open after 5 consecutive failures
  resetTimeoutMs: 60_000,     // Try again after 1 minute
  halfOpenMaxCalls: 3,        // Allow 3 test calls in half-open
  monitorWindowMs: 10_000,    // 10 second window
});
