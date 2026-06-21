// --- INTRO & CONTENT CONTROL ---

function checkAuthRouting() {
    var token = localStorage.getItem('authToken');
    var isAuthPage = window.location.pathname.indexOf('account.html') !== -1;

    // Gatekeeper: Redirect unauthenticated users immediately to the account login page
    if (!token && !isAuthPage) {
        window.location.href = 'account.html';
        return false;
    }

    // Dynamic UI state adjustments specifically for the account management elements
    if (isAuthPage) {
        var loggedOutView = document.getElementById('logged-out-view');
        var loggedInView = document.getElementById('logged-in-view');
        
        if (token) {
            if (loggedOutView) loggedOutView.style.display = 'none';
            if (loggedInView) {
                loggedInView.style.display = 'block';
                var userDisplay = document.getElementById('user-display');
                if (userDisplay) {
                    userDisplay.innerText = "Logged in as: " + localStorage.getItem('userEmail');
                }
            }
        } else {
            if (loggedInView) loggedInView.style.display = 'none';
            if (loggedOutView) loggedOutView.style.display = 'block';
        }
    }
    return true;
}

function showMainContent() {
    var video = document.getElementById('intro-video');
    if (video) {
        video.pause();
        video.style.display = 'none';
    }
    if (document.getElementById('launch-screen')) document.getElementById('launch-screen').style.display = 'none';
    if (document.getElementById('skip-btn')) document.getElementById('skip-btn').style.display = 'none';
    
    if (checkAuthRouting()) {
        if (document.getElementById('main-content')) document.getElementById('main-content').style.display = 'block';
        document.body.style.overflowY = 'auto';
        
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
        if (launch) {
            launch.style.display = 'flex';
        }
        if (document.getElementById('main-content')) document.getElementById('main-content').style.display = 'none';
    } else {
        showMainContent();
    }
}

document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);

// --- CLOUD STORAGE SYSTEM ---

var CLOUD_URL = 'https://penguin.tail6139c3.ts.net';

function getAuthHeaders() {
    return {
        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
    };

}

// --- AUTHENTICATION ACTIONS (SIGN IN / SIGN OUT / SIGN UP) ---

function submitSignup() {
    var email = document.getElementById('auth-email').value;
    var password = document.getElementById('auth-password').value;
    
    fetch(CLOUD_URL + '/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(function(res) {
        if (!res.ok) return res.json().then(function(e) { throw new Error(e.detail || "Registration failed"); });
        return res.json();
    })
    .then(function() {
        alert("Registration complete! You can now sign in.");
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
        if (!res.ok) throw new Error("Incorrect login email or password.");
        return res.json();
    })
    .then(function(data) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userEmail', data.email);
        window.location.href = 'index.html'; // Go back to Home dashboard upon successful auth
    })
    .catch(function(err) { alert(err.message); });
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    window.location.href = 'account.html';
}

function changePassword() {
    var oldPwd = prompt("Confirm your current password:");
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
            alert("Password modified securely.");
        } else {
            alert("Error modifying password. Please check your inputs.");
        }
    });
}

function deleteAccount() {
    if (!confirm("WARNING: Deleting your account permanently clears all profile logs and associated cloud files. Proceed?")) return;
    
    fetch(CLOUD_URL + '/delete-account', {
        method: 'DELETE',
        headers: getAuthHeaders()
    })
    .then(function(res) {
        if (res.ok) {
            alert("Account permanently deleted.");
            logout();
        }
    });
}

// --- SECURED STORAGE DISPATCHERS ---

function handleFetchResponse(response) {
    return response.json();
}

function handleFetchSuccess(data) {
    renderFiles(data.files || []);
}

function handleFetchError(error) {
    console.error("Error fetching files:", error);
}

function fetchFiles() {
    fetch(CLOUD_URL + '/files', { headers: getAuthHeaders() })
        .then(function(res) { 
            if (res.status === 401) throw new Error("Unauthorized");
            return res.json(); 
        })
        .then(function(data) { renderFiles(data.files || []); })
        .catch(function(error) { console.error("Error fetching files:", error); });
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
    var targetId = 'file-item-' + btoa(filename).replace(/=/g, '');
    var li = document.getElementById(targetId);
    
    if (!li) return;

    var existingPreview = li.querySelector('.file-preview');
    if (existingPreview) {
        existingPreview.parentNode.removeChild(existingPreview);
        return;
    }

    if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png') || lowerName.endsWith('.gif') || lowerName.endsWith('.webp')) {
        
        var previewContainer = document.createElement('div');
        previewContainer.className = 'file-preview';
        var img = document.createElement('img');
        
        // Secure Blob Delivery: Required to pass authentication tokens so unlogged users cannot intercept data
        fetch(CLOUD_URL + '/download/' + encodeURIComponent(filename), { headers: getAuthHeaders() })
            .then(function(res) { 
                if(!res.ok) throw new Error();
                return res.blob(); 
            })
            .then(function(blob) {
                img.src = URL.createObjectURL(blob);
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
            })
            .catch(function() { alert("Authentication error loading image preview."); });

    } else if (filename.endsWith('.cells.json')) {
        window.location.href = 'cells.html?file=' + encodeURIComponent(filename);
    } else if (filename.endsWith('.slides.json')) {
        window.location.href = 'slides.html?file=' + encodeURIComponent(filename);
    } else if (filename.endsWith('.pages.html')) {
        window.location.href = 'pages.html?file=' + encodeURIComponent(filename);
    } else {
        alert("Unknown file type! Cannot open.");
    }
}

function downloadFile(filename) {
    // Secure Authenticated Download via Blob generation to maintain account restrictions
    fetch(CLOUD_URL + '/download/' + encodeURIComponent(filename), { headers: getAuthHeaders() })
        .then(function(res) { 
            if (!res.ok) throw new Error();
            return res.blob(); 
        })
        .then(function(blob) {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        })
        .catch(function() { alert("You must be logged in to download files."); });
}

function handleDeleteSuccess() {
    fetchFiles();
}

function handleDeleteError(error) {
    console.error("Error deleting file:", error);
}

function deleteFile(filename) {
    if (!confirm('Are you sure you want to delete ' + filename + '?')) return;
    
    fetch(CLOUD_URL + '/delete/' + encodeURIComponent(filename), { 
        method: 'DELETE', 
        headers: getAuthHeaders() 
    })
    .then(function() { fetchFiles(); })
    .catch(function(err) { console.error("Error deleting file:", err); });
}

window.onload = function() {
    if (checkAuthRouting() && document.getElementById('fileList')) {
        fetchFiles();
    }
};
