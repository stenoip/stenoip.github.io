// --- CONFIGURATION ---
var CLOUD_URL = 'http://localhost:8000'; 

// --- AUTHENTICATION & ROUTING GATE ---
function checkAuthRouting() {
    var token = localStorage.getItem('authToken');
    var isAuthPage = window.location.pathname.indexOf('account.html') !== -1;

    // If no token and not on account page, redirect to sign-in
    if (!token && !isAuthPage) {
        window.location.href = 'account.html';
        return false;
    }

    // Dynamic UI adjustments specifically for the account page
    if (isAuthPage) {
        var loggedOutView = document.getElementById('logged-out-view');
        var loggedInView = document.getElementById('logged-in-view');
        
        if (token) {
            if (loggedOutView) loggedOutView.style.display = 'none';
            if (loggedInView) {
                loggedInView.style.display = 'block';
                document.getElementById('user-display').innerText = "Logged in as: " + localStorage.getItem('userEmail');
            }
        } else {
            if (loggedInView) loggedInView.style.display = 'none';
            if (loggedOutView) loggedOutView.style.display = 'block';
        }
    }
    return true;
}

// --- INTRO & CONTENT CONTROL ---
function showMainContent() {
    var video = document.getElementById('intro-video');
    if (video) {
        video.pause();
        video.style.display = 'none';
    }
    if (document.getElementById('launch-screen')) document.getElementById('launch-screen').style.display = 'none';
    if (document.getElementById('skip-btn')) document.getElementById('skip-btn').style.display = 'none';
    
    // Execute Auth Check before revealing core app structures
    if (checkAuthRouting()) {
        var mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.style.display = 'block';
        document.body.style.overflowY = 'auto';
        
        // Only trigger backend fetch if the file list placeholder component exists on the active page
        if (document.getElementById('fileList')) {
            fetchFiles();
        }
    }
}

function startExperience() {
    var introToggle = document.getElementById('introToggle');
    if (document.getElementById('launch-screen')) document.getElementById('launch-screen').style.display = 'none';

    if (introToggle && introToggle.checked) {
        var video = document.getElementById('intro-video');
        if (video) {
            video.muted = false;
            video.style.display = 'block';
            video.play().catch(function() {});
        }
        if (document.getElementById('skip-btn')) document.getElementById('skip-btn').style.display = 'block';
    } else {
        showMainContent();
    }
}

function skipVideo() { showMainContent(); }
function handleIntroToggleChange() { localStorage.setItem('introVideoEnabled', this.checked); }
function handleVideoEnded() { showMainContent(); }

function handleDOMContentLoaded() {
    var introToggle = document.getElementById('introToggle');
    var saved = localStorage.getItem('introVideoEnabled');
    var video = document.getElementById('intro-video');

    if (introToggle) {
        introToggle.checked = saved === null ? false : saved === 'true';
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
        if (launch) launch.style.display = 'flex';
        if (document.getElementById('main-content')) document.getElementById('main-content').style.display = 'none';
    } else {
        showMainContent();
    }
}
document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);

// --- AUTH DATA ACTIONS ---
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
    };
}

function submitSignup() {
    var email = document.getElementById('auth-email').value;
    var password = document.getElementById('auth-password').value;
    
    fetch(CLOUD_URL + '/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(function(res) {
        if (!res.ok) return res.json().then(function(e) { throw new Error(e.detail); });
        return res.json();
    })
    .then(function() {
        alert("Registration successful! You can now log in.");
    })
    .catch(function(err) { alert(err.message); });
}

function submitLogin() {
    var email = document.getElementById('auth-email').value;
    var password = document.getElementById('auth-password').value;
    
    fetch(CLOUD_URL + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(function(res) {
        if (!res.ok) return res.json().then(function(e) { throw new Error(e.detail); });
        return res.json();
    })
    .then(function(data) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userEmail', data.email);
        window.location.href = 'index.html'; // Go Home on successful auth
    })
    .catch(function(err) { alert(err.message); });
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    window.location.href = 'account.html';
}

function changePassword() {
    var oldPwd = prompt("Enter your current password:");
    if (!oldPwd) return;
    var newPwd = prompt("Enter your new password:");
    if (!newPwd) return;

    fetch(CLOUD_URL + '/change-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ old_password: oldPwd, new_password: newPwd })
    })
    .then(function(res) {
        if (res.ok) {
            alert("Password successfully updated.");
        } else {
            alert("Error updating password. Check old credentials entry.");
        }
    });
}

// --- SECURED CLOUD OPERATIONS ---
function fetchFiles() {
    fetch(CLOUD_URL + '/files', { headers: getAuthHeaders() })
        .then(function(res) { return res.json(); })
        .then(function(data) { renderFiles(data.files || []); })
        .catch(function(err) { console.error("Error fetching files:", err); });
}

function openFile(filename) {
    var lowerName = filename.toLowerCase();
    var targetId = 'file-item-' + btoa(filename).replace(/=/g, '');
    var li = document.getElementById(targetId);
    if (!li) return;

    var existingPreview = li.querySelector('.file-preview');
    if (existingPreview) {
        existingPreview.parentNode.removeChild(existingPreview);
        return;
    }

    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(function(ext) { return lowerName.endsWith(ext); })) {
        var previewContainer = document.createElement('div');
        previewContainer.className = 'file-preview';
        var img = document.createElement('img');
        
        fetch(CLOUD_URL + '/download/' + encodeURIComponent(filename), { headers: getAuthHeaders() })
            .then(function(res) { return res.blob(); })
            .then(function(blob) {
                img.src = URL.createObjectURL(blob);
                img.style.maxWidth = '150px';
                img.style.maxHeight = '150px';
                img.style.objectFit = 'contain';
                img.style.borderRadius = '4px';
                img.style.border = '1px solid #ccc';
                img.style.marginTop = '5px';
                previewContainer.appendChild(img);
                li.appendChild(previewContainer);
            });
    } else if (filename.endsWith('.cells.json') || filename.endsWith('.slides.json') || filename.endsWith('.pages.html')) {
        var appPath = filename.endsWith('.cells.json') ? 'cells.html' : filename.endsWith('.slides.json') ? 'slides.html' : 'pages.html';
        window.location.href = appPath + '?file=' + encodeURIComponent(filename);
    } else {
        alert("Unknown file type! Cannot open.");
    }
}

function downloadFile(filename) {
    fetch(CLOUD_URL + '/download/' + encodeURIComponent(filename), { headers: getAuthHeaders() })
        .then(function(res) { return res.blob(); })
        .then(function(blob) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
}

function deleteFile(filename) {
    if (!confirm('Are you sure you want to delete ' + filename + '?')) return;
    
    fetch(CLOUD_URL + '/delete/' + filename, { method: 'DELETE', headers: getAuthHeaders() })
        .then(function() { fetchFiles(); })
        .catch(function(err) { console.error("Error deleting file:", err); });
}

function deleteAccount() {
    if (!confirm("WARNING: This permanently removes your account profile and clears all associated cloud files. Proceed?")) return;
    
    fetch(CLOUD_URL + '/delete-account', { method: 'DELETE', headers: getAuthHeaders() })
        .then(function(res) {
            if (res.ok) {
                alert("Account deleted.");
                logout();
            }
        });
}

function renderFiles(files) {
    var list = document.getElementById('fileList');
    if (!list) return;
    list.innerHTML = '';
    if (files.length === 0) {
        list.innerHTML = '<p>No files in the cloud yet.</p>';
        return;
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
        openBtn.className = 'btn btn-open'; openBtn.innerText = 'Open';
        openBtn.addEventListener('click', function() { openFile(file); });
        actions.appendChild(openBtn);

        var downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn-download'; downloadBtn.innerText = 'Download';
        downloadBtn.addEventListener('click', function() { downloadFile(file); });
        actions.appendChild(downloadBtn);

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-delete'; deleteBtn.innerText = 'Delete';
        deleteBtn.addEventListener('click', function() { deleteFile(file); });
        actions.appendChild(deleteBtn);
        
        mainRow.appendChild(actions);
        li.appendChild(mainRow);
        list.appendChild(li);
    });
}

window.onload = function() {
    checkAuthRouting();
};
