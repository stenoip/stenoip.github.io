var canvas;
var currentProjectName = "Default Project";
var appState = {
    slides: [],
    currentSlideIndex: 0
};

function init() {
    canvas = new fabric.Canvas('mainCanvas', {
        width: 800,
        height: 450,
        backgroundColor: '#ffffff'
    });

    setupKeyboardShortcuts();
    loadProjectList();
    loadProject(currentProjectName);
    
    canvas.on('mouse:down', function(e) {
        if (document.fullscreenElement) {
            advanceSlide();
        }
    });
}

function loadProjectList() {
    var list = JSON.parse(localStorage.getItem('steno_project_list') || '["Default Project"]');
    var select = document.getElementById('projectSelect');
    select.innerHTML = '';
    var i;
    for (i = 0; i < list.length; i++) {
        var opt = document.createElement('option');
        opt.value = list[i];
        opt.innerHTML = list[i];
        select.appendChild(opt);
    }
    select.value = currentProjectName;
}

function createNewProject() {
    var name = prompt("Enter project name:");
    if (!name) return;
    var list = JSON.parse(localStorage.getItem('steno_project_list') || '[]');
    list.push(name);
    localStorage.setItem('steno_project_list', JSON.stringify(list));
    currentProjectName = name;
    appState = { slides: [], currentSlideIndex: 0 };
    addNewSlide();
    saveToStorage();
    loadProjectList();
}

function switchProject(name) {
    saveToStorage();
    currentProjectName = name;
    loadProject(name);
}

function deleteCurrentProject() {
    if (!confirm("Delete entire project?")) return;
    var list = JSON.parse(localStorage.getItem('steno_project_list') || '[]');
    var newList = list.filter(function(i) { return i !== currentProjectName; });
    localStorage.setItem('steno_project_list', JSON.stringify(newList));
    localStorage.removeItem('steno_proj_' + currentProjectName);
    location.reload();
}

function saveToStorage() {
    appState.slides[appState.currentSlideIndex].data = canvas.toJSON();
    localStorage.setItem('steno_proj_' + currentProjectName, JSON.stringify(appState));
    document.getElementById('projNameDisplay').innerText = currentProjectName + " (Saved)";
}

function loadProject(name) {
    var data = localStorage.getItem('steno_proj_' + name);
    if (data) {
        appState = JSON.parse(data);
        loadSlide(appState.currentSlideIndex || 0);
    } else {
        addNewSlide();
    }
    document.getElementById('projNameDisplay').innerText = currentProjectName;
}

function addNewSlide() {
    var slide = { id: Date.now(), data: null, background: '#ffffff' };
    appState.slides.push(slide);
    loadSlide(appState.slides.length - 1);
}

function loadSlide(index) {
    if (appState.slides[appState.currentSlideIndex]) {
        appState.slides[appState.currentSlideIndex].data = canvas.toJSON();
    }
    appState.currentSlideIndex = index;
    canvas.clear();
    var slide = appState.slides[index];
    if (slide.data) {
        canvas.loadFromJSON(slide.data, function() {
            canvas.renderAll();
        });
    } else {
        canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
    }
    renderThumbs();
}

function renderThumbs() {
    var container = document.getElementById('slide-sorter');
    container.innerHTML = '';
    var i;
    for (i = 0; i < appState.slides.length; i++) {
        var thumb = document.createElement('div');
        thumb.className = 'slide-thumb' + (i === appState.currentSlideIndex ? ' active' : '');
        thumb.onclick = (function(idx) { return function() { loadSlide(idx); }; })(i);
        container.appendChild(thumb);
    }
}

function addTextbox() {
    var t = new fabric.IText("Type Here", { left: 100, top: 100, fontFamily: 'Segoe UI' });
    canvas.add(t);
}

function addShape(type) {
    var s = (type === 'rect') ? new fabric.Rect({ width: 100, height: 100, fill: '#2b579a' }) : 
                               new fabric.Circle({ radius: 50, fill: '#2b579a' });
    s.set({ left: 150, top: 150 });
    canvas.add(s);
}

function triggerMedia() { document.getElementById('mediaInput').click(); }

function handleMediaUpload(e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function(f) {
        var data = f.target.result;
        if (file.type.indexOf('image') !== -1) {
            fabric.Image.fromURL(data, function(img) {
                img.scaleToWidth(300);
                canvas.add(img);
            });
        } else if (file.type.indexOf('video') !== -1) {
            var videoEl = document.createElement('video');
            videoEl.src = data;
            videoEl.loop = true;
            videoEl.muted = true;
            videoEl.play();
            var videoObj = new fabric.Image(videoEl, { left: 100, top: 100, width: 400, height: 225 });
            canvas.add(videoObj);
            fabric.util.requestAnimFrame(function render() {
                canvas.renderAll();
                fabric.util.requestAnimFrame(render);
            });
        }
    };
    reader.readAsDataURL(file);
}

function changeSlideColor(color) {
    canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
    appState.slides[appState.currentSlideIndex].background = color;
}

function changeSelectionColor(color) {
    var obj = canvas.getActiveObject();
    if (obj) { obj.set('fill', color); canvas.renderAll(); }
}

function deleteObject() {
    var obj = canvas.getActiveObject();
    if (obj) canvas.remove(obj);
}

function execCmd(cmd) {
    var obj = canvas.getActiveObject();
    if (!obj || !obj.set) return;
    if (cmd === 'bold') obj.set('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold');
    if (cmd === 'italic') obj.set('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic');
    canvas.renderAll();
}

function enterPresentMode() {
    var el = document.getElementById('presentation-area');
    if (el.requestFullscreen) el.requestFullscreen();
}

function advanceSlide() {
    if (appState.currentSlideIndex < appState.slides.length - 1) {
        loadSlide(appState.currentSlideIndex + 1);
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

function handlePresentationClick() {
    if (document.fullscreenElement) advanceSlide();
}

function setupKeyboardShortcuts() {
    window.addEventListener('keydown', function(e) {
        if (e.key === "Delete" || e.key === "Backspace") {
            if (!canvas.getActiveObject() || canvas.getActiveObject().isEditing) return;
            deleteObject();
        }
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveToStorage();
            alert("Project Saved to Browser Storage");
        }
        if (e.key.toLowerCase() === 'n' && !e.ctrlKey) {
            if (canvas.getActiveObject() && canvas.getActiveObject().isEditing) return;
            addNewSlide();
        }
        if (e.key === "F5") {
            e.preventDefault();
            enterPresentMode();
        }
        if (e.key === "ArrowRight" || e.key === "PageDown") advanceSlide();
        if (e.key === "ArrowLeft" || e.key === "PageUp") {
            if (appState.currentSlideIndex > 0) loadSlide(appState.currentSlideIndex - 1);
        }
    });
}

function switchTab(name) {
    var i, contents = document.getElementsByClassName('ribbon-content'), tabs = document.getElementsByClassName('tab-btn');
    for (i = 0; i < contents.length; i++) contents[i].classList.remove('active');
    for (i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
    document.getElementById('tab-' + name).classList.add('active');
    window.event.currentTarget.classList.add('active');
}

var CLOUD_URL = 'https://penguin.tail6139c3.ts.net';

function uploadToCloud() {
    var filename = prompt("Enter a name for your cloud presentation:", currentProjectName);
    if (!filename) return;
    if (filename.indexOf('.slides.json') === -1) filename += '.slides.json';

    saveToStorage();

    var blob = new Blob([JSON.stringify(appState)], { type: 'application/json' });
    var formData = new FormData();
    formData.append('file', blob, filename);

    var token = localStorage.getItem('authToken');

    fetch(CLOUD_URL + '/upload', { 
        method: 'POST', 
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData 
    })
    .then(function(res) {
        if (!res.ok) throw new Error("Upload rejected. Check login status.");
        alert("Presentation uploaded to cloud successfully!");
    })
    .catch(function(e) {
        alert("Cloud upload failed: " + e.message);
    });
}

function loadFromCloud(filename) {
    var token = localStorage.getItem('authToken');
    fetch(CLOUD_URL + '/download/' + filename, {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function(response) {
        if (!response.ok) throw new Error("File not found or access denied");
        return response.json();
    })
    .then(function(data) {
        currentProjectName = filename.replace('.slides.json', '');
        appState = data;
        loadSlide(appState.currentSlideIndex || 0);
        document.getElementById('projNameDisplay').innerText = currentProjectName + " (Cloud)";
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

var originalInit = init;
init = function() {
    originalInit();
    var fileToOpen = getQueryParam('file');
    if (fileToOpen) {
        loadFromCloud(fileToOpen);
    }
};

window.onload = init;
