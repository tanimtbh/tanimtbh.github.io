// Problems array
const problems = [
    {
        title: "Sum of Numbers",
        description: "Write a function that calculates the sum of all numbers from 1 to n (inclusive).",
        example: "Input: n = 5\nOutput: 15 (1+2+3+4+5)",
        starter: `# Write your solution here
def sum_numbers(n):
    return sum(range(1, n + 1))
# Test your function
result = sum_numbers(5)
print(result)`,
        solution: 15,
        testCases: [
            { input: 5, expected: 15 },
            { input: 10, expected: 55 },
            { input: 1, expected: 1 },
        ],
    },
    {
        title: "Factorial Calculator",
        description: "Write a function that calculates the factorial of a given number n.",
        example: "Input: n = 5\nOutput: 120 (5! = 5×4×3×2×1)",
        starter: `# Write your solution here
def factorial(n):
    # Your code here
    pass
# Test your function
result = factorial(5)
print(result)`,
        solution: 120,
        testCases: [
            { input: 5, expected: 120 },
            { input: 4, expected: 24 },
            { input: 0, expected: 1 },
        ],
    },
    {
        title: "Prime Number Check",
        description: "Write a function that checks if a given number is prime.",
        example: "Input: n = 7\nOutput: True (7 is prime)",
        starter: `# Write your solution here
def is_prime(n):
    # Your code here
    pass
# Test your function
result = is_prime(7)
print(result)`,
        solution: true,
        testCases: [
            { input: 7, expected: true },
            { input: 4, expected: false },
            { input: 2, expected: true },
        ],
    },
    {
        title: "Fibonacci Sequence",
        description: "Write a function that returns the nth number in the Fibonacci sequence.",
        example: "Input: n = 6\nOutput: 8 (0,1,1,2,3,5,8...)",
        starter: `# Write your solution here
def fibonacci(n):
    # Your code here
    pass
# Test your function
result = fibonacci(6)
print(result)`,
        solution: 8,
        testCases: [
            { input: 6, expected: 8 },
            { input: 0, expected: 0 },
            { input: 1, expected: 1 },
        ],
    },
    {
        title: "Palindrome Check",
        description: "Write a function that checks if a given string is a palindrome.",
        example: "Input: 'racecar'\nOutput: True",
        starter: `# Write your solution here
def is_palindrome(s):
    # Your code here
    pass
# Test your function
result = is_palindrome('racecar')
print(result)`,
        solution: true,
        testCases: [
            { input: "racecar", expected: true },
            { input: "hello", expected: false },
            { input: "level", expected: true },
        ],
    },
];

let workerManager;
let editor;
let currentProblem = 0;

// DOM
const output = document.getElementById("output");
const status = document.getElementById("status");
const runBtn = document.getElementById("runBtn");
const clearBtn = document.getElementById("clearBtn");
const problemSelect = document.getElementById("problemSelect");
const successMessage = document.getElementById("successMessage");

// Visual output
const visualOutputSection = document.getElementById("visualOutputSection");
const visualPlot = document.getElementById("visualPlot");
const closeVisualPlot = document.getElementById("closeVisualPlot");

// Set up CodeMirror editor
function initEditor() {
    editor = CodeMirror.fromTextArea(document.getElementById("codeEditor"), {
        mode: "python",
        theme: "material-darker",
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        lineWrapping: true,
        extraKeys: {
            "Ctrl-Enter": runCode,
            "Cmd-Enter": runCode,
        },
    });
    editor.setValue(problems[0].starter);
}

// Initialize worker manager
function initWorkerManager() {
    try {
        workerManager = new PyodideWorkerManager();
        
        // Set up event listeners
        workerManager.on('ready', (data) => {
            status.textContent = "Ready!";
            status.className = "status ready";
            output.textContent = data.message;
            runBtn.disabled = false;
        });
        
        workerManager.on('status', (data) => {
            status.textContent = data.message;
            status.className = `status ${data.status}`;
        });
        
        workerManager.on('executionComplete', (data) => {
            // Display output
            output.textContent = data.stdout || "Code executed successfully (no output)";
            
            // Handle matplotlib figures
            if (data.figureData) {
                visualPlot.innerHTML = `<img src="data:image/png;base64,${data.figureData}" alt="Matplotlib plot"/>`;
                visualOutputSection.classList.add("active");
            } else {
                visualOutputSection.classList.remove("active");
                visualPlot.innerHTML = "";
            }
            
            // Check solution
            checkSolution(data.stdout ? data.stdout.trim() : '');
            
            status.textContent = "Ready!";
            status.className = "status ready";
        });
        
        workerManager.on('executionError', (data) => {
            output.textContent = `Error: ${data.message}`;
            status.textContent = "Error";
            status.className = "status error";
            successMessage.style.display = "none";
            visualOutputSection.classList.remove("active");
            visualPlot.innerHTML = "";
        });
        
        workerManager.on('error', (data) => {
            status.textContent = "Error";
            status.className = "status error";
            output.textContent = `Failed to load Python: ${data.message}`;
        });
        
    } catch (error) {
        status.textContent = "Error";
        status.className = "status error";
        output.textContent = `Failed to initialize worker: ${error.message}`;
    }
}

// Problem loader
function loadProblem(index) {
    currentProblem = index;
    const problem = problems[index];
    document.querySelector(".problem-title").textContent = problem.title;
    document.querySelector(".problem-description").textContent = problem.description;
    document.querySelector(".problem-example").innerHTML = `<strong>Example:</strong><br>${problem.example.replace(
        /\n/g,
        "<br>"
    )}`;
    editor.setValue(problem.starter);
    successMessage.style.display = "none";
    visualOutputSection.classList.remove("active");
    visualPlot.innerHTML = "";
}

// Run Python code using web worker
async function runCode() {
    if (!workerManager || !workerManager.isReady) {
        output.textContent = "Python is still loading...";
        return;
    }
    
    const code = editor.getValue();
    
    // Always hide visual output before new run
    visualOutputSection.classList.remove("active");
    visualPlot.innerHTML = "";
    successMessage.style.display = "none";
    
    try {
        await workerManager.runCode(code);
    } catch (error) {
        output.textContent = `Error: ${error.message}`;
        status.textContent = "Error";
        status.className = "status error";
        successMessage.style.display = "none";
        visualOutputSection.classList.remove("active");
        visualPlot.innerHTML = "";
    }
}

// Close visual plot
closeVisualPlot.onclick = function() {
    visualOutputSection.classList.remove("active");
    visualPlot.innerHTML = "";
}

// Solution checker
function checkSolution(output) {
    const problem = problems[currentProblem];
    const outputValue = output.trim();
    let result;
    if (outputValue === "True") result = true;
    else if (outputValue === "False") result = false;
    else if (!isNaN(outputValue)) result = Number(outputValue);
    else result = outputValue;
    if (result === problem.solution) {
        successMessage.innerHTML = `
            🎉 Congratulations! 🎉<br>
            You solved the problem correctly!<br>
            <small>Great work on "${problem.title}"</small>
        `;
        successMessage.className = "success-message";
        successMessage.style.display = "block";
        setTimeout(() => {
            successMessage.style.animation = "success-glow 1s ease-in-out infinite alternate";
        }, 100);
    } else {
        successMessage.style.display = "none";
    }
}

// Clear code
function clearEditor() {
    editor.setValue(problems[currentProblem].starter);
    successMessage.style.display = "none";
    visualOutputSection.classList.remove("active");
    visualPlot.innerHTML = "";
}

// Event listeners
runBtn.addEventListener("click", runCode);
clearBtn.addEventListener("click", clearEditor);
problemSelect.addEventListener("change", (e) => {
    loadProblem(parseInt(e.target.value));
});

document.addEventListener("DOMContentLoaded", () => {
    initEditor();
    initWorkerManager();
    runBtn.disabled = true;
});

document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode();
    }
});
