// worker-manager.js - Communication layer for Pyodide Web Worker
class PyodideWorkerManager {
    constructor() {
        this.worker = null;
        this.isReady = false;
        this.messageId = 0;
        this.pendingMessages = new Map();
        this.eventListeners = new Map();
        
        // Initialize worker
        this.initWorker();
    }
    
    // Initialize the web worker
    initWorker() {
        try {
            this.worker = new Worker('pyodide-worker.js');
            this.worker.onmessage = this.handleWorkerMessage.bind(this);
            this.worker.onerror = this.handleWorkerError.bind(this);
            
            // Start initialization
            this.sendMessage('INIT');
            
        } catch (error) {
            this.emit('error', { 
                message: `Failed to create worker: ${error.message}` 
            });
        }
    }
    
    // Handle messages from worker
    handleWorkerMessage(event) {
        const { type, data, messageId } = event.data;
        
        // Handle responses to specific messages
        if (messageId && this.pendingMessages.has(messageId)) {
            const { resolve, reject } = this.pendingMessages.get(messageId);
            this.pendingMessages.delete(messageId);
            
            if (type === 'ERROR') {
                reject(new Error(data.message));
            } else {
                resolve(data);
            }
            return;
        }
        
        // Handle broadcast messages
        switch (type) {
            case 'READY':
                this.isReady = true;
                this.emit('ready', data);
                break;
                
            case 'STATUS':
                this.emit('status', data);
                break;
                
            case 'EXECUTION_COMPLETE':
                this.emit('executionComplete', data);
                break;
                
            case 'EXECUTION_ERROR':
                this.emit('executionError', data);
                break;
                
            case 'CANCELLED':
                this.emit('cancelled', data);
                break;
                
            case 'PACKAGE_LOADED':
                this.emit('packageLoaded', data);
                break;
                
            case 'ERROR':
                this.emit('error', data);
                break;
                
            default:
                console.warn('Unknown message type from worker:', type);
        }
    }
    
    // Handle worker errors
    handleWorkerError(error) {
        this.emit('error', { 
            message: `Worker error: ${error.message}`,
            filename: error.filename,
            lineno: error.lineno
        });
    }
    
    // Send message to worker
    sendMessage(type, data = null, expectResponse = false) {
        if (!this.worker) {
            throw new Error('Worker not initialized');
        }
        
        const messageId = expectResponse ? ++this.messageId : null;
        
        this.worker.postMessage({
            type,
            data,
            messageId
        });
        
        if (expectResponse) {
            return new Promise((resolve, reject) => {
                this.pendingMessages.set(messageId, { resolve, reject });
                
                // Set timeout for response
                setTimeout(() => {
                    if (this.pendingMessages.has(messageId)) {
                        this.pendingMessages.delete(messageId);
                        reject(new Error(`Message timeout: ${type}`));
                    }
                }, 30000); // 30 second timeout
            });
        }
    }
    
    // Public API methods
    
    // Run Python code
    async runCode(code) {
        if (!this.isReady) {
            throw new Error('Pyodide worker not ready');
        }
        
        const needsMatplotlib = code.includes('matplotlib') || code.includes('pyplot');
        
        this.sendMessage('RUN_CODE', { 
            code, 
            needsMatplotlib 
        });
    }
    
    // Cancel current execution
    cancelExecution() {
        this.sendMessage('CANCEL_EXECUTION');
    }
    
    // Load a Python package
    async loadPackage(packageName) {
        if (!this.isReady) {
            throw new Error('Pyodide worker not ready');
        }
        
        return this.sendMessage('LOAD_PACKAGE', { packageName }, true);
    }
    
    // Event system
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    
    // Cleanup
    destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.isReady = false;
        this.pendingMessages.clear();
        this.eventListeners.clear();
    }
    
    // Utility methods
    getStatus() {
        return {
            isReady: this.isReady,
            hasWorker: !!this.worker,
            pendingMessages: this.pendingMessages.size
        };
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PyodideWorkerManager;
} else {
    window.PyodideWorkerManager = PyodideWorkerManager;
}
