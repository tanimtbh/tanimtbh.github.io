// pyodide-worker.js - Web Worker for Pyodide execution
let pyodide = null;
let isInitialized = false;
let currentExecution = null;

// Message handler
self.onmessage = async function(event) {
    const { type, data } = event.data;
    
    try {
        switch (type) {
            case 'INIT':
                await initializePyodide();
                break;
            case 'RUN_CODE':
                await runPythonCode(data);
                break;
            case 'CANCEL_EXECUTION':
                cancelExecution();
                break;
            case 'LOAD_PACKAGE':
                await loadPackage(data.packageName);
                break;
            default:
                postMessage({
                    type: 'ERROR',
                    data: { message: `Unknown message type: ${type}` }
                });
        }
    } catch (error) {
        postMessage({
            type: 'ERROR',
            data: { 
                message: error.message,
                stack: error.stack 
            }
        });
    }
};

// Initialize Pyodide
async function initializePyodide() {
    try {
        postMessage({ type: 'STATUS', data: { status: 'loading', message: 'Loading Python environment...' } });
        
        // Import Pyodide
        importScripts('https://cdn.jsdelivr.net/pyodide/v0.28.1/full/pyodide.js');
        
        // Load Pyodide
        pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.28.1/full/'
        });
        
        // Set up Python environment
        await setupPythonEnvironment();
        
        isInitialized = true;
        postMessage({ 
            type: 'READY', 
            data: { message: 'Python environment ready!' } 
        });
        
    } catch (error) {
        postMessage({
            type: 'ERROR',
            data: { 
                message: `Failed to initialize Pyodide: ${error.message}`,
                stack: error.stack
            }
        });
    }
}

// Set up Python environment with utilities
async function setupPythonEnvironment() {
    pyodide.runPython(`
import sys
from io import StringIO
import traceback

# Global variables for output capture
_stdout_buffer = None
_stderr_buffer = None
_original_stdout = sys.stdout
_original_stderr = sys.stderr

def capture_output():
    """Start capturing stdout and stderr"""
    global _stdout_buffer, _stderr_buffer
    _stdout_buffer = StringIO()
    _stderr_buffer = StringIO()
    sys.stdout = _stdout_buffer
    sys.stderr = _stderr_buffer

def get_output():
    """Get captured output and reset streams"""
    global _stdout_buffer, _stderr_buffer
    stdout_content = _stdout_buffer.getvalue() if _stdout_buffer else ""
    stderr_content = _stderr_buffer.getvalue() if _stderr_buffer else ""
    
    # Reset streams
    sys.stdout = _original_stdout
    sys.stderr = _original_stderr
    _stdout_buffer = None
    _stderr_buffer = None
    
    return stdout_content, stderr_content

# Matplotlib setup for web worker
def setup_matplotlib():
    """Setup matplotlib for web worker environment"""
    try:
        import matplotlib
        matplotlib.use('Agg')  # Use non-interactive backend
        import matplotlib.pyplot as plt
        
        # Store original show function
        _original_show = plt.show
        
        def web_worker_show(*args, **kwargs):
            """Custom show function that captures figure data"""
            import io
            import base64
            
            # Get current figure
            fig = plt.gcf()
            
            # Save to buffer
            buf = io.BytesIO()
            fig.savefig(buf, format='png', bbox_inches='tight', dpi=100)
            buf.seek(0)
            
            # Convert to base64
            img_data = base64.b64encode(buf.read()).decode('utf-8')
            buf.close()
            
            # Close the figure to free memory
            plt.close(fig)
            
            # Store the image data globally so we can access it
            globals()['__matplotlib_figure_data'] = img_data
        
        # Replace plt.show with our custom function
        plt.show = web_worker_show
        
        return True
    except ImportError:
        return False

# Global flag for matplotlib
_matplotlib_available = False
    `);
}

// Run Python code
async function runPythonCode(data) {
    if (!isInitialized) {
        throw new Error('Pyodide not initialized');
    }
    
    const { code, needsMatplotlib = false } = data;
    
    try {
        postMessage({ 
            type: 'STATUS', 
            data: { status: 'running', message: 'Executing code...' } 
        });
        
        // Load matplotlib if needed
        if (needsMatplotlib && code.includes('matplotlib')) {
            await ensureMatplotlibLoaded();
        }
        
        // Create execution context
        currentExecution = { cancelled: false };
        
        // Capture output
        pyodide.runPython('capture_output()');
        
        // Clear any previous matplotlib data
        pyodide.runPython(`
if '__matplotlib_figure_data' in globals():
    del __matplotlib_figure_data
        `);
        
        // Execute user code
        let result = null;
        try {
            result = pyodide.runPython(code);
        } catch (pythonError) {
            // Get Python traceback
            const traceback = pyodide.runPython(`
import traceback
traceback.format_exc()
            `);
            throw new Error(`Python Error: ${traceback}`);
        }
        
        // Check if execution was cancelled
        if (currentExecution && currentExecution.cancelled) {
            postMessage({ 
                type: 'CANCELLED', 
                data: { message: 'Execution cancelled' } 
            });
            return;
        }
        
        // Get captured output
        const [stdout, stderr] = pyodide.runPython('get_output()');
        
        // Check for matplotlib figure
        let figureData = null;
        try {
            figureData = pyodide.runPython(`
globals().get('__matplotlib_figure_data', None)
            `);
        } catch (e) {
            // No figure data available
        }
        
        // Send results back to main thread
        postMessage({
            type: 'EXECUTION_COMPLETE',
            data: {
                stdout: stdout || '',
                stderr: stderr || '',
                result: result,
                figureData: figureData,
                hasOutput: !!(stdout || stderr || figureData)
            }
        });
        
        postMessage({ 
            type: 'STATUS', 
            data: { status: 'ready', message: 'Ready!' } 
        });
        
    } catch (error) {
        postMessage({
            type: 'EXECUTION_ERROR',
            data: { 
                message: error.message,
                stack: error.stack
            }
        });
        
        postMessage({ 
            type: 'STATUS', 
            data: { status: 'error', message: 'Error' } 
        });
    } finally {
        currentExecution = null;
    }
}

// Ensure matplotlib is loaded
async function ensureMatplotlibLoaded() {
    const matplotlibLoaded = pyodide.runPython('_matplotlib_available');
    
    if (!matplotlibLoaded) {
        postMessage({ 
            type: 'STATUS', 
            data: { status: 'loading', message: 'Loading matplotlib...' } 
        });
        
        try {
            await pyodide.loadPackage(['matplotlib', 'numpy']);
            
            // Setup matplotlib in Python
            pyodide.runPython(`
_matplotlib_available = setup_matplotlib()
if not _matplotlib_available:
    raise ImportError("Failed to setup matplotlib")
            `);
            
            postMessage({ 
                type: 'PACKAGE_LOADED', 
                data: { packageName: 'matplotlib' } 
            });
            
        } catch (error) {
            throw new Error(`Failed to load matplotlib: ${error.message}`);
        }
    }
}

// Load a specific package
async function loadPackage(packageName) {
    if (!isInitialized) {
        throw new Error('Pyodide not initialized');
    }
    
    try {
        postMessage({ 
            type: 'STATUS', 
            data: { status: 'loading', message: `Loading ${packageName}...` } 
        });
        
        await pyodide.loadPackage(packageName);
        
        postMessage({ 
            type: 'PACKAGE_LOADED', 
            data: { packageName } 
        });
        
        postMessage({ 
            type: 'STATUS', 
            data: { status: 'ready', message: 'Ready!' } 
        });
        
    } catch (error) {
        throw new Error(`Failed to load package ${packageName}: ${error.message}`);
    }
}

// Cancel current execution
function cancelExecution() {
    if (currentExecution) {
        currentExecution.cancelled = true;
        postMessage({ 
            type: 'CANCELLED', 
            data: { message: 'Execution cancelled' } 
        });
    }
}

// Error handler for unhandled errors
self.onerror = function(error) {
    postMessage({
        type: 'ERROR',
        data: { 
            message: `Worker error: ${error.message}`,
            filename: error.filename,
            lineno: error.lineno
        }
    });
};
