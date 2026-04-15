 document.addEventListener('DOMContentLoaded', () => {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanels = document.querySelectorAll('.tab-panel');
        const editor = document.getElementById('editor');
        const fileInput = document.getElementById('fileInput');
        const openFileBtn = document.getElementById('openFileBtn');
        const saveTxtBtn = document.getElementById('saveTxtBtn');
        const saveDocxBtn = document.getElementById('saveDocxBtn');
        const savePdfBtn = document.getElementById('savePdfBtn');
        const insertImageBtn = document.getElementById('insertImageBtn');
        const imageInput = document.getElementById('imageInput');
        const insertVideoBtn = document.getElementById('insertVideoBtn');
        const videoInput = document.getElementById('videoInput');
        const penBtn = document.getElementById('penBtn');
        const eraserBtn = document.getElementById('eraserBtn');
        const cursorBtn = document.getElementById('cursorBtn');
        const drawingCanvas = document.getElementById('drawing-canvas');
        const themeSelect = document.getElementById('themeSelect');
        const marginSelect = document.getElementById('marginSelect');
        const orientationBtn = document.getElementById('orientationBtn');
        const tocBtn = document.getElementById('tocBtn');
        const spellCheckBtn = document.getElementById('spellCheckBtn');
        const readModeBtn = document.getElementById('readModeBtn');
        const printLayoutBtn = document.getElementById('printLayoutBtn');

        // --- NEW AUTO-SAVE FUNCTIONALITY ---
        const AUTOSAVE_KEY = 'documentContent';
        const AUTOSAVE_INTERVAL = 5000; // Save every 5 seconds

        function saveContent() {
            try {
                localStorage.setItem(AUTOSAVE_KEY, editor.innerHTML);
                console.log('Document content saved automatically!');
            } catch (e) {
                console.error('Could not save to localStorage:', e);
            }
        }

        function loadContent() {
            try {
                const savedContent = localStorage.getItem(AUTOSAVE_KEY);
                if (savedContent) {
                    editor.innerHTML = savedContent;
                    console.log('Document content loaded from auto-save.');
                }
            } catch (e) {
                console.error('Could not load from localStorage:', e);
            }
        }

        // Load content on page load
        loadContent();

        // Save content automatically every few seconds
        setInterval(saveContent, AUTOSAVE_INTERVAL);

        // Save one last time before the user leaves the page
        window.addEventListener('beforeunload', saveContent);

        // --- END AUTO-SAVE FUNCTIONALITY ---

        // Tab functionality
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                button.classList.add('active');
                const targetPanel = document.getElementById(`${button.dataset.tab}-panel`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });

        // Home Tab Functionality
        const ribbonMenu = document.querySelector('.ribbon-menu');
        ribbonMenu.addEventListener('click', (event) => {
            const target = event.target.closest('.ribbon-item');
            if (!target || !target.dataset.command) return;
            const command = target.dataset.command;
            const value = target.value || target.dataset.value;
            document.execCommand(command, false, value);
        });

        // File Tab Functionality
        openFileBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const arrayBuffer = e.target.result;
                    mammoth.convertToHtml({
                            arrayBuffer: arrayBuffer
                        })
                        .then((result) => {
                            editor.innerHTML = result.value;
                        })
                        .catch((error) => {
                            console.error('Error converting DOCX to HTML:', error);
                            alert('Failed to convert DOCX file.');
                        });
                };
                reader.readAsArrayBuffer(file);
            }
        });
        saveTxtBtn.addEventListener('click', () => {
            const textContent = editor.innerText;
            const blob = new Blob([textContent], {
                type: 'text/plain;charset=utf-8'
            });
            saveAs(blob, 'document.txt');
        });

        // --- NEW DOCX SAVE FUNCTIONALITY ---
        saveDocxBtn.addEventListener('click', () => {
            // Create a new div to hold the content to be converted
            const cleanedContent = document.createElement('div');
            // Copy the editor's inner HTML
            cleanedContent.innerHTML = editor.innerHTML;

            // Remove any script tags, style tags, and event listeners that might cause issues
            cleanedContent.querySelectorAll('script, style').forEach(el => el.remove());

            // Get the cleaned up HTML
            const contentHtml = cleanedContent.innerHTML;

            // The html-docx-js library expects a well-formed HTML document structure.
            // Wrap the content in a basic HTML structure.
            const content = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${contentHtml}</body></html>`;

            // Convert the cleaned HTML to a DOCX Blob
            const converted = htmlDocx.asBlob(content);
            // Save the file
            saveAs(converted, 'document.docx');
        });
        // --- END NEW DOCX SAVE FUNCTIONALITY ---

        savePdfBtn.addEventListener('click', () => {
            html2canvas(editor).then(canvas => {
                const {
                    jsPDF
                } = window.jspdf;
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgWidth = 210;
                const pageHeight = 295;
                const imgHeight = canvas.height * imgWidth / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                pdf.save('document.pdf');
            });
        });

        // Insert Tab Functionality
        insertImageBtn.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    const img = document.createElement('img');
                    img.src = reader.result;
                    img.style.maxWidth = '100%';
                    document.execCommand('insertHTML', false, img.outerHTML);
                };
                reader.readAsDataURL(file);
            }
        });
        insertVideoBtn.addEventListener('click', () => videoInput.click());
        videoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    const video = document.createElement('video');
                    video.src = reader.result;
                    video.controls = true;
                    video.style.maxWidth = '100%';
                    document.execCommand('insertHTML', false, video.outerHTML);
                };
                reader.readAsDataURL(file);
            }
        });

        // Draw Tab Functionality
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        let mode = 'pen';
        let ctx = drawingCanvas.getContext('2d');
        const resizeCanvas = () => {
            drawingCanvas.width = editor.clientWidth;
            drawingCanvas.height = editor.clientHeight;
            ctx.lineWidth = 5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        drawingCanvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            const rect = drawingCanvas.getBoundingClientRect();
            [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
        });
        drawingCanvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            const rect = drawingCanvas.getBoundingClientRect();
            const [newX, newY] = [e.clientX - rect.left, e.clientY - rect.top];
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(newX, newY);
            if (mode === 'pen') {
                ctx.strokeStyle = '#000';
                ctx.globalCompositeOperation = 'source-over';
            } else if (mode === 'eraser') {
                ctx.strokeStyle = '#fff';
                ctx.globalCompositeOperation = 'destination-out';
            }
            ctx.stroke();
            [lastX, lastY] = [newX, newY];
        });
        drawingCanvas.addEventListener('mouseup', () => isDrawing = false);
        drawingCanvas.addEventListener('mouseout', () => isDrawing = false);

        penBtn.addEventListener('click', () => {
            mode = 'pen';
            drawingCanvas.classList.add('drawing-canvas-active');
        });
        eraserBtn.addEventListener('click', () => {
            mode = 'eraser';
            drawingCanvas.classList.add('drawing-canvas-active');
        });
        cursorBtn.addEventListener('click', () => {
            drawingCanvas.classList.remove('drawing-canvas-active');
        });

        // Design Tab Functionality
        themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            document.body.className = '';
            if (theme === 'dark') {
                document.body.style.backgroundColor = '#333';
                document.body.style.color = '#f3f3f3';
            } else if (theme === 'blue') {
                document.body.style.backgroundColor = '#f0f8ff';
                document.body.style.color = '#00008b';
            } else {
                document.body.style.backgroundColor = '#f3f3f3';
                document.body.style.color = '#333';
            }
        });

        // Layout Tab Functionality
        marginSelect.addEventListener('change', (e) => {
            const margin = e.target.value;
            if (margin === 'normal') {
                editor.style.padding = '1in';
            } else if (margin === 'narrow') {
                editor.style.padding = '0.5in';
            } else if (margin === 'wide') {
                editor.style.padding = '2in';
            }
        });
        orientationBtn.addEventListener('click', () => {
            if (editor.style.width === '11in') {
                editor.style.width = '8.5in';
                editor.style.minHeight = '11in';
            } else {
                editor.style.width = '11in';
                editor.style.minHeight = '8.5in';
            }
        });

        // References Tab Functionality
        tocBtn.addEventListener('click', () => {
            const headings = editor.querySelectorAll('h1, h2, h3');
            let tocHtml = '<h2>Table of Contents</h2><ul>';
            headings.forEach(h => {
                const id = h.innerText.replace(/\s+/g, '-').toLowerCase();
                h.id = id;
                tocHtml += `<li><a href="#${id}">${h.innerText}</a></li>`;
            });
            tocHtml += '</ul>';
            document.execCommand('insertHTML', false, tocHtml);
        });

        // Review Tab Functionality
        spellCheckBtn.addEventListener('click', () => {
            const text = editor.innerText;
            const speller = new SpellCheck();
            const misspelled = speller.check(text).misspelled;
            if (misspelled.length > 0) {
                let newHtml = editor.innerHTML;
                misspelled.forEach(word => {
                    const regex = new RegExp(`\\b${word}\\b`, 'g');
                    newHtml = newHtml.replace(regex, `<span class="spellcheck-highlight">${word}</span>`);
                });
                editor.innerHTML = newHtml;
                alert(`Found ${misspelled.length} misspelled words. They are highlighted in red.`);
            } else {
                alert('No misspelled words found!');
            }
        });

        // View Tab Functionality
        readModeBtn.addEventListener('click', () => {
            if (editor.contentEditable === 'true') {
                editor.contentEditable = 'false';
                editor.style.backgroundColor = '#f5f5f5';
                editor.style.boxShadow = 'none';
                editor.style.border = 'none';
            } else {
                editor.contentEditable = 'true';
                editor.style.backgroundColor = 'white';
                editor.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
                editor.style.border = '1px solid #ccc';
            }
        });
        printLayoutBtn.addEventListener('click', () => window.print());

        // Update font/size selects to reflect current selection
        editor.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const currentFont = document.queryCommandValue('fontName');
                const currentSize = document.queryCommandValue('fontSize');
                const fontFamilySelect = document.querySelector('[data-command="fontName"]');
                if (fontFamilySelect) {
                    fontFamilySelect.value = currentFont;
                }
                const fontSizeSelect = document.querySelector('[data-command="fontSize"]');
                if (fontSizeSelect) {
                    fontSizeSelect.value = currentSize;
                }
            }
        });
    });
