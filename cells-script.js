var TOTAL_ROWS = 50;
var TOTAL_COLS = 26;
var cellData = {}; 
var currentCellId = null;
var useBrowserStorage = false;
var isDrawingMode = false;
var isDrawing = false;

// DOM Elements
var gridHead = document.getElementById('grid-head');
var gridBody = document.getElementById('grid-body');
var formulaBar = document.getElementById('formula-bar');
var canvas = document.getElementById('drawing-canvas');
var ctx = canvas ? canvas.getContext('2d') : null;

// INITIALIZATION 
window.onload = function() {
    initGrid();
    loadFromStorage();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
};

// RIBBON & TABS LOGIC 
function switchTab(tabName) {
    var buttons = document.getElementsByClassName('tab-button');
    var panels = document.getElementsByClassName('tab-panel');
    
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
        panels[i].classList.remove('active');
        
        if (buttons[i].innerText.toLowerCase() === tabName.toLowerCase()) {
            buttons[i].classList.add('active');
        }
    }
    document.getElementById('tab-' + tabName).classList.add('active');
}

// GRID ENGINE
function getColName(index) {
    return String.fromCharCode(65 + index);
}

function initGrid() {
    var headerRow = document.createElement('tr');
    var cornerHeader = document.createElement('th');
    cornerHeader.className = 'row-header';
    headerRow.appendChild(cornerHeader);

    for (var c = 0; c < TOTAL_COLS; c++) {
        var th = document.createElement('th');
        th.innerText = getColName(c);
        headerRow.appendChild(th);
    }
    gridHead.appendChild(headerRow);

    for (var r = 1; r <= TOTAL_ROWS; r++) {
        var row = document.createElement('tr');
        var rowHeader = document.createElement('th');
        rowHeader.className = 'row-header';
        rowHeader.innerText = r;
        row.appendChild(rowHeader);

        for (var c2 = 0; c2 < TOTAL_COLS; c2++) {
            var td = document.createElement('td');
            var input = document.createElement('input');
            var cellId = getColName(c2) + r;
            
            input.id = cellId;
            input.type = 'text';
            input.addEventListener('focus', handleCellFocus);
            input.addEventListener('blur', handleCellBlur);
            input.addEventListener('keydown', handleCellKeydown);
            
            td.appendChild(input);
            row.appendChild(td);
        }
        gridBody.appendChild(row);
    }
    formulaBar.addEventListener('input', handleFormulaBarInput);
}

function handleCellFocus(e) {
    currentCellId = e.target.id;
    if (cellData[currentCellId] !== undefined) {
        e.target.value = cellData[currentCellId];
        formulaBar.value = cellData[currentCellId];
    } else {
        formulaBar.value = '';
    }
}

function handleCellBlur(e) {
    cellData[e.target.id] = e.target.value;
    saveToStorage();
    refreshGrid();
}

function handleCellKeydown(e) {
    if (e.key === 'Enter') {
        e.target.blur();
        var match = e.target.id.match(/([A-Z]+)(\d+)/);
        if (match) {
            var nextRow = parseInt(match[2]) + 1;
            var nextCell = document.getElementById(match[1] + nextRow);
            if (nextCell) nextCell.focus();
        }
    }
}

function handleFormulaBarInput(e) {
    if (currentCellId) {
        document.getElementById(currentCellId).value = e.target.value;
        cellData[currentCellId] = e.target.value;
        saveToStorage();
    }
}

function evaluateCell(cellId, visited) {
    var rawValue = cellData[cellId];
    if (rawValue === undefined || rawValue === "") return "";
    if (rawValue.toString().charAt(0) !== '=') return isNaN(rawValue) ? rawValue : Number(rawValue);

    visited = visited || {};
    if (visited[cellId]) return "#REF!";
    visited[cellId] = true;

    var formula = rawValue.substring(1).toUpperCase();
    var cellRefRegex = /[A-Z]+\d+/g;
    
    var parsedFormula = formula.replace(cellRefRegex, function(match) {
        var refValue = evaluateCell(match, Object.assign({}, visited));
        if (refValue === "" || refValue === undefined) return 0;
        if (refValue === "#REF!" || refValue === "#ERROR!") return refValue;
        return isNaN(refValue) ? '"' + refValue + '"' : refValue;
    });

    try {
        if (parsedFormula.indexOf("#REF!") !== -1 || parsedFormula.indexOf("#ERROR!") !== -1) return "#ERROR!";
        var result = new Function('return ' + parsedFormula)();
        return result === undefined ? "" : result;
    } catch (err) {
        return "#ERROR!";
    }
}

function refreshGrid() {
    for (var r = 1; r <= TOTAL_ROWS; r++) {
        for (var c = 0; c < TOTAL_COLS; c++) {
            var cellId = getColName(c) + r;
            var el = document.getElementById(cellId);
            if (el && el !== document.activeElement) {
                el.value = evaluateCell(cellId);
            }
        }
    }
}

// FILE TAB
function toggleBrowserStorage() {
    useBrowserStorage = !useBrowserStorage;
    document.getElementById('storage-btn').innerText = "Storage: " + (useBrowserStorage ? "ON" : "OFF");
    document.getElementById('storage-btn').classList.toggle('active', useBrowserStorage);
    if (useBrowserStorage) saveToStorage();
}

function saveToStorage() {
    if (useBrowserStorage) {
        localStorage.setItem('stenoCellsData', JSON.stringify(cellData));
    }
}

function loadFromStorage() {
    var saved = localStorage.getItem('stenoCellsData');
    if (saved) {
        cellData = JSON.parse(saved);
        refreshGrid();
    }
}

function saveAsJSON() {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cellData));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "StenoCells_Workbook.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function openJSON(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            cellData = JSON.parse(e.target.result);
            refreshGrid();
            alert("File loaded successfully.");
        } catch (err) {
            alert("Invalid JSON file.");
        }
    };
    reader.readAsText(file);
}

// INSERT TAB
function insertMedia(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var element;
        if (file.type.startsWith('image/')) {
            element = document.createElement('img');
            element.src = e.target.result;
        } else if (file.type.startsWith('video/')) {
            element = document.createElement('video');
            element.src = e.target.result;
            element.controls = true;
        }
        if (element) {
            element.className = 'inserted-media';
            document.getElementById('media-container').appendChild(element);
        }
    };
    reader.readAsDataURL(file);
}

function insertChart() {
    alert("THERE ARE NO CHARTS YET!");
}

//  DATA TAB (SORTING)
function sortData(direction) {
    if (!currentCellId) {
        alert("Please select a cell in the column you want to sort.");
        return;
    }
    
    var colMatch = currentCellId.match(/([A-Z]+)/);
    if (!colMatch) return;
    var sortCol = colMatch[1];
    
    var rowsData = [];
    for (var r = 1; r <= TOTAL_ROWS; r++) {
        var rowObj = {};
        for (var c = 0; c < TOTAL_COLS; c++) {
            var colName = getColName(c);
            rowObj[colName] = cellData[colName + r] || "";
        }
        rowsData.push(rowObj);
    }
    
    rowsData.sort(function(a, b) {
        var valA = a[sortCol];
        var valB = b[sortCol];
        
        var numA = Number(valA);
        var numB = Number(valB);
        var isNumA = valA !== "" && !isNaN(numA);
        var isNumB = valB !== "" && !isNaN(numB);
        
        if (isNumA && isNumB) {
            return direction === 'asc' ? numA - numB : numB - numA;
        } else {
            var strA = String(valA);
            var strB = String(valB);
            return direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        }
    });
    
    for (var r2 = 1; r2 <= TOTAL_ROWS; r2++) {
        for (var c2 = 0; c2 < TOTAL_COLS; c2++) {
            var colName2 = getColName(c2);
            cellData[colName2 + r2] = rowsData[r2 - 1][colName2];
        }
    }
    
    saveToStorage();
    refreshGrid();
}

// --- DRAW TAB ---
function resizeCanvas() {
    if (!canvas) return;
    var editor = document.getElementById('editor');
    canvas.width = editor.scrollWidth;
    canvas.height = editor.scrollHeight;
}

function toggleDrawMode() {
    isDrawingMode = !isDrawingMode;
    document.getElementById('draw-btn').classList.toggle('active', isDrawingMode);
    
    if (isDrawingMode) {
        canvas.classList.add('drawing-canvas-active');
        resizeCanvas();
    } else {
        canvas.classList.remove('drawing-canvas-active');
    }
}

function clearCanvas() {
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

if (canvas) {
    canvas.addEventListener('mousedown', function(e) {
        if (!isDrawingMode) return;
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    });

    canvas.addEventListener('mousemove', function(e) {
        if (!isDrawingMode || !isDrawing) return;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    canvas.addEventListener('mouseup', function() {
        isDrawing = false;
        ctx.closePath();
    });
    
    canvas.addEventListener('mouseleave', function() {
        isDrawing = false;
    });
}
