// --- INTRO & CONTENT CONTROL ---

function showMainContent() {
    var video = document.getElementById('intro-video');
    if (video) {
        video.pause();
        video.style.display = 'none';
    }
    document.getElementById('launch-screen').style.display = 'none';
    document.getElementById('skip-btn').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.body.style.overflowY = 'auto';
}

function startExperience() {
    var introToggle = document.getElementById('introToggle');
    document.getElementById('launch-screen').style.display = 'none';

    if (introToggle && introToggle.checked) {
        var video = document.getElementById('intro-video');
        video.muted = false;
        video.style.display = 'block';
        video.play().catch(function() {});
        document.getElementById('skip-btn').style.display = 'block';
    } else {
        showMainContent();
    }
}

function skipVideo() {
    showMainContent();
}

// --- INITIALIZATION ---

function handleIntroToggleChange() {
    localStorage.setItem('introVideoEnabled', this.checked);
}

function handleVideoEnded() {
    showMainContent();
}

function handleDOMContentLoaded() {
    var introToggle = document.getElementById('introToggle');
    var saved = localStorage.getItem('introVideoEnabled');
    var video = document.getElementById('intro-video');

    if (introToggle) {
        introToggle.checked = saved === null ? true : saved === 'true';
        introToggle.addEventListener('change', handleIntroToggleChange);
    }

    if (video) {
        video.pause(); 
        video.muted = true; 
        video.style.display = 'none'; 
        video.addEventListener('ended', handleVideoEnded);
    }

    if (introToggle && introToggle.checked) {
        var launch = document.getElementById('launch-screen');
        if (launch) {
            launch.style.display = 'flex';
        }
        document.getElementById('main-content').style.display = 'none';
    } else {
        showMainContent();
    }
}

document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);

// --- CLOUD STORAGE SYSTEM ---

var CLOUD_URL = 'https://penguin.tail6139c3.ts.net';

function handleFetchResponse(response) {
    return response.json();
}

function handleFetchSuccess(data) {
    renderFiles(data.files);
}

function handleFetchError(error) {
    console.error("Error fetching files:", error);
}

function fetchFiles() {
    fetch(CLOUD_URL + '/files')
        .then(handleFetchResponse)
        .then(handleFetchSuccess)
        .catch(handleFetchError);
}

function handleOpenClick(e) {
    var filename = e.target.getAttribute('data-filename');
    openFile(filename);
}

function handleDownloadClick(e) {
    var filename = e.target.getAttribute('data-filename');
    downloadFile(filename);
}

function handleDeleteClick(e) {
    var filename = e.target.getAttribute('data-filename');
    deleteFile(filename);
}

function handlePreviewError(e) {
    var container = e.target.parentNode;
    if (container) {
        container.parentNode.removeChild(container);
    }
    alert("Failed to load image preview.");
}

function renderFiles(files) {
    var list = document.getElementById('fileList');
    list.innerHTML = '';
    if (files.length === 0) {
        list.innerHTML = '<p>No files in the cloud yet.</p>';
    }

    files.forEach(function(file) {
        var li = document.createElement('li');
        li.className = 'file-item';
        li.id = 'file-item-' + btoa(file).replace(/=/g, ''); 
        li.style.display = 'flex';
        li.style.flexDirection = 'column';
        li.style.gap = '10px';
        li.style.marginBottom = '15px';
        li.style.padding = '10px';
        li.style.border = '1px solid #ddd';

        var mainRow = document.createElement('div');
        mainRow.style.display = 'flex';
        mainRow.style.justifyContent = 'space-between';
        mainRow.style.alignItems = 'center';
        
        var nameSpan = document.createElement('span');
        nameSpan.innerText = file;
        mainRow.appendChild(nameSpan);
        
        var actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '5px';
        
        var openBtn = document.createElement('button');
        openBtn.className = 'btn btn-open';
        openBtn.innerText = 'Open';
        openBtn.setAttribute('data-filename', file);
        openBtn.addEventListener('click', handleOpenClick);
        actions.appendChild(openBtn);

        var downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn-download';
        downloadBtn.innerText = 'Download';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.setAttribute('data-filename', file);
        downloadBtn.addEventListener('click', handleDownloadClick);
        actions.appendChild(downloadBtn);

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-delete';
        deleteBtn.innerText = 'Delete';
        deleteBtn.setAttribute('data-filename', file);
        deleteBtn.addEventListener('click', handleDeleteClick);
        actions.appendChild(deleteBtn);
        
        mainRow.appendChild(actions);
        li.appendChild(mainRow);
        list.appendChild(li);
    });
}

function openFile(filename) {
    var lowerName = filename.toLowerCase();
    
    if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || lowerName.endsWith('.gif') || lowerName.endsWith('.webp')) {
        var targetId = 'file-item-' + btoa(filename).replace(/=/g, '');
        var li = document.getElementById(targetId);
        
        if (li) {
            var existingPreview = li.querySelector('.file-preview');
            if (existingPreview) {
                existingPreview.parentNode.removeChild(existingPreview);
                return;
            }

            var previewContainer = document.createElement('div');
            previewContainer.className = 'file-preview';
            
            var img = document.createElement('img');
            img.src = CLOUD_URL + '/files/' + encodeURIComponent(filename); 
            img.alt = filename;
            img.style.maxWidth = '150px';
            img.style.maxHeight = '150px';
            img.style.objectFit = 'contain';
            img.style.borderRadius = '4px';
            img.style.border = '1px solid #ccc';
            img.style.marginTop = '5px';
            
            img.addEventListener('error', handlePreviewError);

            previewContainer.appendChild(img);
            li.appendChild(previewContainer);
        }
    } else if (filename.endsWith('.cells.json')) {
        window.location.href = 'cells.html?file=' + filename;
    } else if (filename.endsWith('.slides.json')) {
        window.location.href = 'slides.html?file=' + filename;
    } else if (filename.endsWith('.pages.html')) {
        window.location.href = 'pages.html?file=' + filename;
    } else {
        alert("Unknown file type! Cannot open.");
    }
}

function downloadFile(filename) {
    var a = document.createElement('a');
    a.href = CLOUD_URL + '/files/' + encodeURIComponent(filename);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function handleDeleteSuccess() {
    fetchFiles();
}

function handleDeleteError(error) {
    console.error("Error deleting file:", error);
}

function deleteFile(filename) {
    if (!confirm('Are you sure you want to delete ' + filename + '?')) return;
    
    fetch(CLOUD_URL + '/delete/' + filename, { method: 'DELETE' })
        .then(handleDeleteSuccess)
        .catch(handleDeleteError);
}

window.onload = fetchFiles;
