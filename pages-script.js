document.addEventListener('DOMContentLoaded', function() {
    var tabButtons = document.querySelectorAll('.tab-button');
    var tabPanels = document.querySelectorAll('.tab-panel');
    var editor = document.getElementById('editor');
    var fileInput = document.getElementById('fileInput');
    var openFileBtn = document.getElementById('openFileBtn');
    var saveTxtBtn = document.getElementById('saveTxtBtn');
    var saveDocxBtn = document.getElementById('saveDocxBtn');
    var savePdfBtn = document.getElementById('savePdfBtn');
    var insertImageBtn = document.getElementById('insertImageBtn');
    var imageInput = document.getElementById('imageInput');
    var insertVideoBtn = document.getElementById('insertVideoBtn');
    var videoInput = document.getElementById('videoInput');
    var penBtn = document.getElementById('penBtn');
    var eraserBtn = document.getElementById('eraserBtn');
    var cursorBtn = document.getElementById('cursorBtn');
    var drawingCanvas = document.getElementById('drawing-canvas');
    var themeSelect = document.getElementById('themeSelect');
    var marginSelect = document.getElementById('marginSelect');
    var orientationBtn = document.getElementById('orientationBtn');
    var tocBtn = document.getElementById('tocBtn');
    var spellCheckBtn = document.getElementById('spellCheckBtn');
    var readModeBtn = document.getElementById('readModeBtn');
    var printLayoutBtn = document.getElementById('printLayoutBtn');

    var CLOUD_URL = 'https://penguin.tail6139c3.ts.net';
    var uploadCloudBtn = document.getElementById('uploadCloudBtn');

    if (uploadCloudBtn) {
        uploadCloudBtn.addEventListener('click', function() {
            var filename = prompt("Enter a name for your cloud document:");
            if (!filename) return;
            if (filename.indexOf('.pages.html') === -1) filename += '.pages.html';

            var content = editor.innerHTML;
            var blob = new Blob([content], { type: 'text/html' });
            var formData = new FormData();
            formData.append('file', blob, filename);

            var token = localStorage.getItem('authToken');

            fetch(CLOUD_URL + '/upload', { 
                method: 'POST', 
                headers: { 'Authorization': 'Bearer ' + token },
                body: formData 
            })
            .then(function(res) {
                if (!res.ok) throw new Error("Server rejected the upload. Are you logged in?");
                alert("Document uploaded to cloud successfully!");
            })
            .catch(function(e) {
                alert("Cloud upload failed: " + e.message);
            });
        });
    }

    function loadFromCloud(filename) {
        var token = localStorage.getItem('authToken');
        fetch(CLOUD_URL + '/download/' + filename, {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(function(res) {
            if (!res.ok) throw new Error("File not found or access denied");
            return res.text();
        })
        .then(function(htmlContent) {
            editor.innerHTML = htmlContent;
            document.title = filename + " - Steno Pages";
        })
        .catch(function(e) {
            alert("Failed to load from cloud: " + e.message);
        });
    }

    function getQueryParam(param) {
        var search = window.location.search.substring(1);
        var vars = search.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) === param) {
                return decodeURIComponent(pair[1]);
            }
        }
        return null;
    }

    var fileToOpen = getQueryParam('file');
    if (fileToOpen) {
        loadFromCloud(fileToOpen);
    }

    var AUTOSAVE_KEY = 'documentContent';
    var AUTOSAVE_INTERVAL = 5000;

    function saveContent() {
        try {
            localStorage.setItem(AUTOSAVE_KEY, editor.innerHTML);
        } catch (e) {}
    }

    function loadContent() {
        try {
            var savedContent = localStorage.getItem(AUTOSAVE_KEY);
            if (savedContent) {
                editor.innerHTML = savedContent;
            }
        } catch (e) {}
    }

    loadContent();
    setInterval(saveContent, AUTOSAVE_INTERVAL);
    window.addEventListener('beforeunload', saveContent);

    for (var i = 0; i < tabButtons.length; i++) {
        tabButtons[i].addEventListener('click', function() {
            var j;
            for (j = 0; j < tabButtons.length; j++) tabButtons[j].classList.remove('active');
            for (j = 0; j < tabPanels.length; j++) tabPanels[j].classList.remove('active');
            this.classList.add('active');
            var targetPanel = document.getElementById(this.getAttribute('data-tab') + '-panel');
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    }

    var ribbonMenu = document.querySelector('.ribbon-menu');
    ribbonMenu.addEventListener('click', function(event) {
        var target = event.target;
        while (target && target !== ribbonMenu && !target.classList.contains('ribbon-item')) {
            target = target.parentNode;
        }
        if (!target || !target.getAttribute('data-command')) return;
        var command = target.getAttribute('data-command');
        var value = target.value || target.getAttribute('data-value');
        document.execCommand(command, false, value);
    });

    openFileBtn.addEventListener('click', function() { fileInput.click(); });
    fileInput.addEventListener('change', function(event) {
        var file = event.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var arrayBuffer = e.target.result;
                mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                    .then(function(result) {
                        editor.innerHTML = result.value;
                    })
                    .catch(function() {
                        alert('Failed to convert DOCX file.');
                    });
            };
            reader.readAsArrayBuffer(file);
        }
    });

    saveTxtBtn.addEventListener('click', function() {
        var textContent = editor.innerText;
        var blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'document.txt');
    });

    saveDocxBtn.addEventListener('click', function() {
        var cleanedContent = document.createElement('div');
        cleanedContent.innerHTML = editor.innerHTML;
        
        var badTags = cleanedContent.querySelectorAll('script, style');
        for (var i = 0; i < badTags.length; i++) {
            badTags[i].parentNode.removeChild(badTags[i]);
        }

        var contentHtml = cleanedContent.innerHTML;
        var content = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' + contentHtml + '</body></html>';
        var converted = htmlDocx.asBlob(content);
        saveAs(converted, 'document.docx');
    });

    savePdfBtn.addEventListener('click', function() {
        html2canvas(editor).then(function(canvas) {
            var jsPDF = window.jspdf.jsPDF;
            var imgData = canvas.toDataURL('image/png');
            var pdf = new jsPDF('p', 'mm', 'a4');
            var imgWidth = 210;
            var pageHeight = 295;
            var imgHeight = canvas.height * imgWidth / canvas.width;
            var heightLeft = imgHeight;
            var position = 0;
            
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

    insertImageBtn.addEventListener('click', function() { imageInput.click(); });
    imageInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function() {
                var img = document.createElement('img');
                img.src = reader.result;
                img.style.maxWidth = '100%';
                document.execCommand('insertHTML', false, img.outerHTML);
            };
            reader.readAsDataURL(file);
        }
    });

    insertVideoBtn.addEventListener('click', function() { videoInput.click(); });
    videoInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function() {
                var video = document.createElement('video');
                video.src = reader.result;
                video.controls = true;
                video.style.maxWidth = '100%';
                document.execCommand('insertHTML', false, video.outerHTML);
            };
            reader.readAsDataURL(file);
        }
    });

    var isDrawing = false;
    var lastX = 0;
    var lastY = 0;
    var mode = 'pen';
    var ctx = drawingCanvas.getContext('2d');
    
    var resizeCanvas = function() {
        drawingCanvas.width = editor.clientWidth;
        drawingCanvas.height = editor.clientHeight;
        ctx.lineWidth = 5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    drawingCanvas.addEventListener('mousedown', function(e) {
        isDrawing = true;
        var rect = drawingCanvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
    });
    
    drawingCanvas.addEventListener('mousemove', function(e) {
        if (!isDrawing) return;
        var rect = drawingCanvas.getBoundingClientRect();
        var newX = e.clientX - rect.left;
        var newY = e.clientY - rect.top;
        
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
        
        lastX = newX;
        lastY = newY;
    });
    
    drawingCanvas.addEventListener('mouseup', function() { isDrawing = false; });
    drawingCanvas.addEventListener('mouseout', function() { isDrawing = false; });

    penBtn.addEventListener('click', function() {
        mode = 'pen';
        drawingCanvas.classList.add('drawing-canvas-active');
    });
    eraserBtn.addEventListener('click', function() {
        mode = 'eraser';
        drawingCanvas.classList.add('drawing-canvas-active');
    });
    cursorBtn.addEventListener('click', function() {
        drawingCanvas.classList.remove('drawing-canvas-active');
    });

    themeSelect.addEventListener('change', function(e) {
        var theme = e.target.value;
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

    marginSelect.addEventListener('change', function(e) {
        var margin = e.target.value;
        if (margin === 'normal') {
            editor.style.padding = '1in';
        } else if (margin === 'narrow') {
            editor.style.padding = '0.5in';
        } else if (margin === 'wide') {
            editor.style.padding = '2in';
        }
    });

    orientationBtn.addEventListener('click', function() {
        if (editor.style.width === '11in') {
            editor.style.width = '8.5in';
            editor.style.minHeight = '11in';
        } else {
            editor.style.width = '11in';
            editor.style.minHeight = '8.5in';
        }
    });

    tocBtn.addEventListener('click', function() {
        var headings = editor.querySelectorAll('h1, h2, h3');
        var tocHtml = '<h2>Table of Contents</h2><ul>';
        for (var i = 0; i < headings.length; i++) {
            var h = headings[i];
            var id = h.innerText.replace(/\s+/g, '-').toLowerCase();
            h.id = id;
            tocHtml += '<li><a href="#' + id + '">' + h.innerText + '</a></li>';
        }
        tocHtml += '</ul>';
        document.execCommand('insertHTML', false, tocHtml);
    });

    spellCheckBtn.addEventListener('click', function() {
        var text = editor.innerText;
        var speller = new SpellCheck();
        var misspelled = speller.check(text).misspelled;
        if (misspelled.length > 0) {
            var newHtml = editor.innerHTML;
            for (var i = 0; i < misspelled.length; i++) {
                var word = misspelled[i];
                var regex = new RegExp('\\b' + word + '\\b', 'g');
                newHtml = newHtml.replace(regex, '<span class="spellcheck-highlight">' + word + '</span>');
            }
            editor.innerHTML = newHtml;
            alert("Found " + misspelled.length + " misspelled words. They are highlighted in red.");
        } else {
            alert('No misspelled words found!');
        }
    });

    readModeBtn.addEventListener('click', function() {
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
    
    printLayoutBtn.addEventListener('click', function() { window.print(); });

    editor.addEventListener('mouseup', function() {
        var selection = window.getSelection();
        if (selection.rangeCount > 0) {
            var currentFont = document.queryCommandValue('fontName');
            var currentSize = document.queryCommandValue('fontSize');
            var fontFamilySelect = document.querySelector('[data-command="fontName"]');
            if (fontFamilySelect) {
                fontFamilySelect.value = currentFont;
            }
            var fontSizeSelect = document.querySelector('[data-command="fontSize"]');
            if (fontSizeSelect) {
                fontSizeSelect.value = currentSize;
            }
        }
    });
});
