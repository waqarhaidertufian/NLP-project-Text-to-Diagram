// Main Application Controller
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    const app = {
        textInput: document.getElementById('text-input'),
        generateBtn: document.getElementById('generate-btn'),
        diagramContainer: document.getElementById('diagram-container'),
        charCount: document.getElementById('char-count'),
        statusDot: document.getElementById('status-dot'),
        statusText: document.getElementById('status-text'),
        detectedType: document.getElementById('detected-type'),
        elementCount: document.getElementById('element-count'),
        lastGenerated: document.getElementById('last-generated'),
        diagramTypeSelect: document.getElementById('diagram-type'),
        themeToggle: document.getElementById('theme-toggle'),
        clearBtn: document.getElementById('clear-btn'),
        formatBtn: document.getElementById('format-btn'),
        loadExampleBtn: document.getElementById('load-example'),
        exportBtn: document.getElementById('export-btn'),
        copyBtn: document.getElementById('copy-btn'),
        saveBtn: document.getElementById('save-btn'),
        fullscreenBtn: document.getElementById('fullscreen-btn'),
        toggleHelpBtn: document.getElementById('toggle-help'),
        helpContent: document.getElementById('help-content'),
        exportModal: document.getElementById('export-modal'),
        closeModalBtns: document.querySelectorAll('.close-modal'),
        exportConfirmBtn: document.getElementById('export-confirm'),
        vscodeInfoBtn: document.getElementById('vscode-info'),
        currentDate: document.getElementById('current-date')
    };

    // State
    let isDarkMode = false;
    let isHelpExpanded = true;
    let lastGeneratedTime = null;

    // Initialize the app
    function init() {
        // Set current date
        const now = new Date();
        app.currentDate.textContent = now.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        // Load saved text if available
        const savedText = localStorage.getItem('textToDiagram_lastText');
        if (savedText) {
            app.textInput.value = savedText;
            updateCharCount();
        }

        // Load saved theme
        const savedTheme = localStorage.getItem('textToDiagram_theme');
        if (savedTheme === 'dark') {
            toggleDarkMode(true);
        }

        // Set up event listeners
        setupEventListeners();

        // Update UI
        updateStatus('ready', 'Ready to generate diagram');
        
        console.log('Text to Diagram App initialized successfully');
        console.log('Running in Visual Studio Code environment');
    }

    // Set up all event listeners
    function setupEventListeners() {
        // Text input events
        app.textInput.addEventListener('input', updateCharCount);
        app.textInput.addEventListener('input', debounce(autoDetectDiagramType, 500));
        
        // Button events
        app.generateBtn.addEventListener('click', generateDiagram);
        app.clearBtn.addEventListener('click', clearText);
        app.formatBtn.addEventListener('click', formatText);
        app.loadExampleBtn.addEventListener('click', loadExample);
        app.copyBtn.addEventListener('click', copyCode);
        app.saveBtn.addEventListener('click', openExportModal);
        app.exportBtn.addEventListener('click', openExportModal);
        app.fullscreenBtn.addEventListener('click', toggleFullscreen);
        app.themeToggle.addEventListener('click', toggleDarkMode);
        app.toggleHelpBtn.addEventListener('click', toggleHelp);
        app.vscodeInfoBtn.addEventListener('click', showVSCodeInfo);
        
        // Diagram type selection
        app.diagramTypeSelect.addEventListener('change', handleDiagramTypeChange);
        
        // Template buttons
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                insertTemplate(this.dataset.insert);
            });
        });
        
        // Modal events
        app.closeModalBtns.forEach(btn => {
            btn.addEventListener('click', closeExportModal);
        });
        
        app.exportConfirmBtn.addEventListener('click', exportDiagram);
        
        // Close modal on outside click
        app.exportModal.addEventListener('click', function(e) {
            if (e.target === this) closeExportModal();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    // Update character count
    function updateCharCount() {
        const count = app.textInput.value.length;
        app.charCount.textContent = count;
        
        // Save text to localStorage
        localStorage.setItem('textToDiagram_lastText', app.textInput.value);
    }

    // Auto-detect diagram type
    function autoDetectDiagramType() {
        const text = app.textInput.value;
        if (!text.trim()) {
            app.detectedType.textContent = 'Not detected';
            return;
        }
        
        const type = window.diagramGenerator.detectDiagramType(text);
        const typeNames = {
            flowchart: 'Flowchart',
            sequence: 'Sequence Diagram',
            class: 'Class Diagram',
            state: 'State Diagram',
            pie: 'Pie Chart',
            gantt: 'Gantt Chart',
            entityRelationship: 'Entity Relationship',
            userJourney: 'User Journey',
            unknown: 'Unknown'
        };
        
        app.detectedType.textContent = typeNames[type] || 'Unknown';
        
        // Update select if auto detect is selected
        if (app.diagramTypeSelect.value === 'auto') {
            app.elementCount.textContent = window.diagramGenerator.countDiagramElements(text);
        }
    }

    // Generate diagram from text
    async function generateDiagram() {
        const text = app.textInput.value.trim();
        
        if (!text) {
            showNotification('Please enter some text to generate a diagram', 'warning');
            return;
        }
        
        updateStatus('processing', 'Generating diagram...');
        
        try {
            const diagramType = app.diagramTypeSelect.value;
            const result = await window.diagramGenerator.generateDiagram(
                text, 
                'diagram-container',
                diagramType
            );
            
            if (result.success) {
                updateStatus('success', 'Diagram generated successfully');
                
                // Update diagram info
                app.detectedType.textContent = result.type.charAt(0).toUpperCase() + result.type.slice(1);
                app.elementCount.textContent = result.elementCount;
                
                // Update last generated time
                lastGeneratedTime = new Date();
                app.lastGenerated.textContent = lastGeneratedTime.toLocaleTimeString();
                
                // Show success notification
                showNotification('Diagram generated successfully!', 'success');
            } else {
                updateStatus('error', 'Error generating diagram');
                showNotification(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            updateStatus('error', 'Error generating diagram');
            console.error('Generation error:', error);
            showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // Clear text input
    function clearText() {
        if (app.textInput.value.trim() && !confirm('Are you sure you want to clear all text?')) {
            return;
        }
        
        app.textInput.value = '';
        updateCharCount();
        autoDetectDiagramType();
        
        // Clear diagram container
        app.diagramContainer.innerHTML = `
            <div class="diagram-placeholder">
                <i class="fas fa-project-diagram"></i>
                <h3>Your diagram will appear here</h3>
                <p>Enter text in the left panel and click "Generate Diagram"</p>
            </div>
        `;
        
        showNotification('Text cleared', 'info');
    }

    // Format text (basic indentation)
    function formatText() {
        const text = app.textInput.value;
        if (!text.trim()) return;
        
        const lines = text.split('\n');
        let indentLevel = 0;
        const formattedLines = [];
        
        for (let line of lines) {
            const trimmedLine = line.trim();
            
            if (!trimmedLine) {
                formattedLines.push('');
                continue;
            }
            
            // Decrease indent for certain lines
            if (trimmedLine.startsWith('end') || trimmedLine.includes('-->')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            // Add indentation
            const indent = '  '.repeat(indentLevel);
            formattedLines.push(indent + trimmedLine);
            
            // Increase indent for certain lines
            if (trimmedLine.includes('{') || trimmedLine.endsWith('-->') || 
                trimmedLine.startsWith('participant') || trimmedLine.startsWith('class')) {
                indentLevel++;
            }
        }
        
        app.textInput.value = formattedLines.join('\n');
        updateCharCount();
        showNotification('Text formatted', 'success');
    }

    // Load example diagram
    function loadExample() {
        const examples = {
            flowchart: `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Process Successfully]
    B -->|No| D[Debug Issue]
    C --> E[End]
    D --> F[Fix Problem]
    F --> B`,
            
            sequence: `sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    
    User->>Frontend: Submit Request
    Frontend->>Backend: API Call
    Backend->>Database: Query Data
    Database-->>Backend: Return Data
    Backend-->>Frontend: JSON Response
    Frontend-->>User: Display Results`,
            
            class: `classDiagram
    class Animal {
        +String name
        +int age
        +void eat()
        +void sleep()
    }
    
    class Dog {
        +String breed
        +void bark()
    }
    
    class Cat {
        +String color
        +void meow()
    }
    
    Animal <|-- Dog
    Animal <|-- Cat`,
            
            pie: `pie title Programming Languages Used
    "JavaScript" : 40
    "Python" : 25
    "Java" : 15
    "C++" : 10
    "Other" : 10`,
            
            gantt: `gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Design
    Research     :active, 2024-01-01, 30d
    Mockups      :2024-01-15, 20d
    section Development
    Frontend     :2024-02-01, 45d
    Backend      :2024-02-10, 40d
    section Testing
    Unit Tests   :2024-03-15, 20d
    Integration  :2024-03-25, 15d`
        };
        
        // Pick a random example
        const types = Object.keys(examples);
        const randomType = types[Math.floor(Math.random() * types.length)];
        const example = examples[randomType];
        
        app.textInput.value = example;
        updateCharCount();
        autoDetectDiagramType();
        
        // Set diagram type select
        app.diagramTypeSelect.value = randomType;
        
        showNotification(`Loaded ${randomType} example`, 'success');
    }

    // Insert template based on type
    function insertTemplate(type) {
        const templates = {
            flowchart: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
            
            sequence: `sequenceDiagram
    participant A as Client
    participant B as Server
    A->>B: Request
    B-->>A: Response`,
            
            class: `classDiagram
    class ClassName {
        +attribute: type
        +method(): returnType
    }`,
            
            pie: `pie title Title
    "Label 1" : 30
    "Label 2" : 20
    "Label 3" : 50`,
            
            gantt: `gantt
    title Title
    dateFormat  YYYY-MM-DD
    section Section
    Task :a1, 2024-01-01, 30d`
        };
        
        if (templates[type]) {
            app.textInput.value = templates[type];
            updateCharCount();
            autoDetectDiagramType();
            app.diagramTypeSelect.value = type;
            showNotification(`Inserted ${type} template`, 'info');
        }
    }

    // Copy code to clipboard
    async function copyCode() {
        const text = app.textInput.value;
        
        if (!text.trim()) {
            showNotification('No text to copy', 'warning');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(text);
            showNotification('Code copied to clipboard', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            showNotification('Failed to copy to clipboard', 'error');
        }
    }

    // Open export modal
    function openExportModal() {
        const diagramElement = document.querySelector('.mermaid');
        if (!diagramElement) {
            showNotification('No diagram to export', 'warning');
            return;
        }
        
        app.exportModal.classList.add('active');
    }

    // Close export modal
    function closeExportModal() {
        app.exportModal.classList.remove('active');
    }

    // Export diagram
    async function exportDiagram() {
        const format = document.querySelector('input[name="export-format"]:checked').value;
        
        updateStatus('processing', `Exporting as ${format.toUpperCase()}...`);
        closeExportModal();
        
        try {
            const result = await window.diagramGenerator.exportDiagram(format);
            
            // Create download link
            const a = document.createElement('a');
            a.href = result.url;
            a.download = result.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Revoke URL
            setTimeout(() => URL.revokeObjectURL(result.url), 100);
            
            updateStatus('success', `Exported as ${format.toUpperCase()}`);
            showNotification(`Diagram exported as ${format.toUpperCase()}`, 'success');
            
        } catch (error) {
            updateStatus('error', 'Export failed');
            console.error('Export error:', error);
            showNotification(`Export failed: ${error.message}`, 'error');
        }
    }

    // Toggle fullscreen for diagram
    function toggleFullscreen() {
        const container = app.diagramContainer;
        
        if (!document.fullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            }
            
            showNotification('Entered fullscreen mode', 'info');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            
            showNotification('Exited fullscreen mode', 'info');
        }
    }

    // Toggle dark/light mode
    function toggleDarkMode(force = null) {
        if (force !== null) {
            isDarkMode = force;
        } else {
            isDarkMode = !isDarkMode;
        }
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            app.themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
            localStorage.setItem('textToDiagram_theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            app.themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
            localStorage.setItem('textToDiagram_theme', 'light');
        }
        
        // Update mermaid theme
        if (window.diagramGenerator) {
            window.diagramGenerator.updateTheme();
        }
        
        // Regenerate diagram if exists
        const diagramElement = document.querySelector('.mermaid');
        if (diagramElement && app.textInput.value.trim()) {
            generateDiagram();
        }
    }

    // Toggle help section
    function toggleHelp() {
        isHelpExpanded = !isHelpExpanded;
        
        if (isHelpExpanded) {
            app.helpContent.classList.remove('collapsed');
            app.toggleHelpBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        } else {
            app.helpContent.classList.add('collapsed');
            app.toggleHelpBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
    }

    // Handle diagram type change
    function handleDiagramTypeChange() {
        autoDetectDiagramType();
    }

    // Show VS Code info
    function showVSCodeInfo() {
        showNotification('This application is designed to run in Visual Studio Code. Open with Live Server extension for best experience.', 'info');
    }

    // Update status indicator
    function updateStatus(type, message) {
        // Reset all classes
        app.statusDot.className = 'status-dot';
        app.statusDot.classList.add(type);
        app.statusText.textContent = message;
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${getNotificationColor(type)};
            color: white;
            border-radius: var(--border-radius);
            display: flex;
            align-items: center;
            gap: 0.8rem;
            box-shadow: var(--shadow);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Helper: Get notification icon
    function getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    // Helper: Get notification color
    function getNotificationColor(type) {
        switch(type) {
            case 'success': return 'var(--success-color)';
            case 'error': return 'var(--danger-color)';
            case 'warning': return 'var(--warning-color)';
            default: return 'var(--primary-color)';
        }
    }

    // Handle keyboard shortcuts
    function handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter: Generate diagram
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            generateDiagram();
        }
        
        // Ctrl/Cmd + S: Save (export)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const diagramElement = document.querySelector('.mermaid');
            if (diagramElement) {
                openExportModal();
            }
        }
        
        // Ctrl/Cmd + L: Load example
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            loadExample();
        }
        
        // Ctrl/Cmd + D: Toggle dark mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            toggleDarkMode();
        }
    }

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initialize the application
    init();
});