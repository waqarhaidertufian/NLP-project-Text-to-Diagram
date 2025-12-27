// Diagram Generator using Mermaid.js
class DiagramGenerator {
    constructor() {
        this.mermaidInitialized = false;
        this.currentDiagramType = 'auto';
        this.initMermaid();
    }

    // Initialize Mermaid with configuration
    initMermaid() {
        if (typeof mermaid === 'undefined') {
            console.error('Mermaid.js library not loaded!');
            return;
        }
        
        mermaid.initialize({
            startOnLoad: false,
            theme: document.body.classList.contains('dark-mode') ? 'dark' : 'default',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            },
            sequence: {
                useMaxWidth: true,
                noteFontWeight: 'normal',
                actorFontSize: 14
            },
            gantt: {
                useMaxWidth: true,
                barHeight: 20,
                barGap: 4
            },
            securityLevel: 'loose'
        });
        
        this.mermaidInitialized = true;
        console.log('Mermaid.js initialized successfully');
    }

    // Detect diagram type from text
    detectDiagramType(text) {
        if (!text || text.trim() === '') return 'unknown';
        
        const firstLine = text.trim().split('\n')[0].toLowerCase();
        
        if (firstLine.includes('graph')) return 'flowchart';
        if (firstLine.includes('sequence')) return 'sequence';
        if (firstLine.includes('class')) return 'class';
        if (firstLine.includes('state')) return 'state';
        if (firstLine.includes('pie')) return 'pie';
        if (firstLine.includes('gantt')) return 'gantt';
        if (firstLine.includes('er')) return 'entityRelationship';
        if (firstLine.includes('journey')) return 'userJourney';
        
        // Try to guess based on content
        if (text.includes('-->') || text.includes('---') || text.includes('==>')) {
            return 'flowchart';
        }
        
        if (text.includes('participant') || text.includes('->>') || text.includes('-->>')) {
            return 'sequence';
        }
        
        return 'unknown';
    }

    // Generate diagram from text
    async generateDiagram(text, containerId = 'diagram-container', diagramType = 'auto') {
        if (!this.mermaidInitialized) {
            throw new Error('Mermaid.js is not initialized');
        }
        
        // Clear previous diagram
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with id '${containerId}' not found`);
        }
        
        // Detect diagram type if auto
        let actualType = diagramType;
        if (diagramType === 'auto') {
            actualType = this.detectDiagramType(text);
        }
        
        this.currentDiagramType = actualType;
        
        try {
            // Validate the mermaid syntax
            await mermaid.parse(text);
            
            // Generate unique ID for the diagram
            const diagramId = `mermaid-diagram-${Date.now()}`;
            
            // Create a container for the diagram
            container.innerHTML = `<div id="${diagramId}" class="mermaid">${text}</div>`;
            
            // Render the diagram
            await mermaid.run({
                nodes: [document.getElementById(diagramId)]
            });
            
            // Update theme if needed
            this.updateTheme();
            
            return {
                success: true,
                type: actualType,
                elementCount: this.countDiagramElements(text),
                container: document.getElementById(diagramId)
            };
            
        } catch (error) {
            console.error('Diagram generation error:', error);
            this.displayError(container, error.message);
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Count elements in diagram (simplified)
    countDiagramElements(text) {
        if (!text) return 0;
        
        const lines = text.split('\n');
        let count = 0;
        
        // Count based on diagram type
        const type = this.detectDiagramType(text);
        
        switch(type) {
            case 'flowchart':
                // Count nodes and edges
                const nodeMatches = text.match(/\[.*?\]|\{.*?\}|\(.*?\)/g);
                const edgeMatches = text.match(/--|==|->/g);
                count = (nodeMatches ? nodeMatches.length : 0) + 
                       (edgeMatches ? Math.floor(edgeMatches.length / 2) : 0);
                break;
                
            case 'sequence':
                // Count participants and messages
                const participantMatches = text.match(/participant\s+\w+/gi);
                const messageMatches = text.match(/(->>|-->>|->|-->|->x|--x|-){1,2}/g);
                count = (participantMatches ? participantMatches.length : 0) + 
                       (messageMatches ? messageMatches.length : 0);
                break;
                
            case 'class':
                // Count classes and relationships
                const classMatches = text.match(/class\s+\w+/gi);
                const relationMatches = text.match(/<\|--|--|\.\./g);
                count = (classMatches ? classMatches.length : 0) + 
                       (relationMatches ? relationMatches.length : 0);
                break;
                
            default:
                // Simple line count for other types
                count = lines.filter(line => line.trim() !== '' && !line.trim().startsWith('%')).length;
        }
        
        return count;
    }

    // Display error in diagram container
    displayError(container, errorMessage) {
        container.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Diagram Error</h3>
                <p>${errorMessage}</p>
                <p>Please check your syntax and try again.</p>
            </div>
        `;
    }

    // Update diagram theme based on current mode
    updateTheme() {
        if (!this.mermaidInitialized) return;
        
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'default';
        mermaid.initialize({ ...mermaid.mermaidAPI.getConfig(), theme });
    }

    // Export diagram as image
    async exportDiagram(format = 'png') {
        const diagramElement = document.querySelector('.mermaid');
        if (!diagramElement) {
            throw new Error('No diagram to export');
        }
        
        const svgElement = diagramElement.querySelector('svg');
        if (!svgElement) {
            throw new Error('Diagram SVG not found');
        }
        
        // For SVG export
        if (format === 'svg') {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            return {
                blob,
                url: URL.createObjectURL(blob),
                filename: `diagram-${Date.now()}.svg`
            };
        }
        
        // For PNG export (using canvas)
        if (format === 'png') {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Get SVG dimensions
            const svgRect = svgElement.getBoundingClientRect();
            canvas.width = svgRect.width;
            canvas.height = svgRect.height;
            
            // Create image from SVG
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const img = new Image();
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve({
                                blob,
                                url: URL.createObjectURL(blob),
                                filename: `diagram-${Date.now()}.png`
                            });
                        } else {
                            reject(new Error('Failed to create PNG'));
                        }
                    }, 'image/png');
                };
                
                img.onerror = reject;
                img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
            });
        }
        
        // For PDF export (would require pdf.js library)
        throw new Error(`Export format '${format}' not supported yet`);
    }
}

// Create global instance
window.diagramGenerator = new DiagramGenerator();