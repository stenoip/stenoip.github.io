/*
DO NOT DELETE!
This file provides functionality for index.html(homepage)!

*/
// This array now explicitly represents the available "coding programs" in the TV Guide,
// compiled from both the previous list and the links from the Guide page.
const links = [
    // Existing Items
    { name: 'Anniversary', url: 'anniversary.html' },
    { name: 'The Data Store(Datenspeicher)', url: 'download.html' },


    // Programs and Calculators (from Guide page)
    { name: 'TI 30XS', url: 'calculator_ti30xiis.html' },
    { name: 'TI 84', url: 'calculator_ti84.html' },
    { name: 'Kompmasine', url: 'kompmasine.html' },
    { name: 'Kompmasine Functions', url: 'kompmasine-functions.html' },
    { name: 'Draw It!', url: 'draw.html' },
    { name: 'Count', url: 'count.html' },
    { name: 'Gravity', url: 'gravity.html' },
    { name: 'AI Simulation', url: 'bot.html' }, // Already exists, kept for completeness
    { name: 'A box', url: 'box_model.html' },     // Already exists, kept for completeness
    { name: 'Camera', url: 'camera.html' },       // Already exists, kept for completeness
    { name: 'Maps 2D', url: 'maps2d.html' },

    // Entertainment (from Guide page)
    { name: '2048', url: '2048.html' }, // Already exists, kept for completeness
    { name: 'Windows XP Simulation', url: 'windows-xp-simulation.html' },
    { name: 'StenoTOANSTIK ARCADE', url: 'games/home.html' },
    { name: 'StenoVids', url: 'video.html' },      // Already exists, kept for completeness
    { name: 'StenoVids Plus', url: 'video_plus.html' }, // Already exists, kept for completeness
    { name: 'Flappy Bird', url: 'flappybird.html' }, // Already exists, kept for completeness
    { name: 'StenoTetris', url: 'games/tetris.html' },
    { name: 'Zuiz Quiz', url: 'quiz.html' },
    { name: 'Talking Pet', url: 'pet.html' },      // Already exists, kept for completeness
    { name: 'StenoMedia', url: 'media.html' },
    { name: 'StenoKomysk(since 2016)', url: 'comic.html' }, // Name simplified to 'Comics!' previously, updated to full name
    { name: 'Eggtastic!', url: 'eggtastic.html' }, // Already exists, kept for completeness

    // Downloadables (from Guide page)
    { name: 'SearXNG Instructions', url: 'searxng.html' }, // Name updated
    { name: 'Ringzauber', url: 'ringzauber.html' },       // Already exists, kept for completeness

    // Educational & Learning (from Guide page)
    // Zuiz Quiz (duplicate, already above)
    { name: 'PHet Gravity Simulation', url: 'my-solar-system_en.html' }, // Name updated
    { name: 'Solar System Scope', url: 'space-map.html' },

    // Tools (from Guide page)
    { name: 'Ferkenne Maps', url: 'maps.html' },
    { name: 'Space Map', url: 'space-map.html' }, // Duplicate of Solar System Scope, but kept for "Map" search
    { name: 'SWC Page', url: 'swc.html' },
    { name: 'Clocker', url: 'clocker.html' },       // Already exists, kept for completeness
    { name: 'Compass', url: 'compass.html' },
    { name: 'Testing', url: 'testing.html' },
    { name: 'Blogs', url: 'blog.html' },
    { name: 'Boublok Coding', url: 'boublok.html' } // Already exists, kept for completeness
];

// --- NOTIFICATION FUNCTIONALITY ---
function requestNotificationPermission() {
    // 1. Check if the browser supports notifications
    if (!('Notification' in window)) {
        alert('This browser does not support desktop notifications.');
        return;
    }

    // 2. Request permission from the user
    Notification.requestPermission().then(permission => {
        const notifyBtn = document.getElementById('notification-button');
        
        if (permission === 'granted') {
            // Permission granted
            notifyBtn.textContent = 'Notifications ACTIVE';
            notifyBtn.disabled = true;
            // Optional: Show a quick welcome notification
            showNotification('Welcome to SWC!', 'You will now receive updates on new games and features!');

        } else if (permission === 'denied') {
            // Permission denied
            notifyBtn.textContent = 'Notifications BLOCKED';
            notifyBtn.disabled = true;
            alert('Notifications have been blocked. Check your browser settings to enable them.');
        } else {
            // Permission default/ignored
            notifyBtn.textContent = 'Sign Up for Notifications';
        }
    });
}

function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'new-swc.png', // Ensure you have this icon file
            vibrate: [200, 100, 200]
        });
    }
}

function loadBulletinBoard() {
    const bulletinContent = `
        <li><span class="highlight">Breaking News!</span> <mark>Ringzauber 1.5 is coming out now! <a href="ringzauber.html">Learn more</a></mark></li>
        <li>Access Private Programs Online through our <a href="television_guide.html">Television Guide</a>.</li>
        <li><span class="highlight">New Games:</span> Frog Crossing and StenoTetris are now <a href="games/home.html">available</a>. </li>
        <li><span class="highlight">Suggested AI:</span> Meet <mark><a href="https://stenoip.github.io/praterich">Lady Praterich, an AI chatbot and SWC assistant.</a></mark></li>
        <li><span class="highlight">New Update:</span> Version ${document.querySelector('.footer p').textContent.match(/Version ([\d\.]+)/)[1]} brings improved search suggestions!</li> 
        <li><span class="highlight">Stay Updated:</span> <a href="#" onclick="requestNotificationPermission(); return false;">Click here to sign up for notifications!</a></li>
    `;

    const bulletinList = document.getElementById('bulletin-list');
    if (bulletinList) {
        bulletinList.innerHTML = bulletinContent;
    }
}
        // --- SEARCH FUNCTIONALITY ---
        function search() {
            const query = document.getElementById('search-input').value.trim();
            if (!query) return;

            const matchedLink = links.find(link => link.name.toLowerCase().includes(query.toLowerCase()));
            if (matchedLink) {
                window.location.href = matchedLink.url + (matchedLink.url.includes('?') ? '&' : '?') + 'q=' + encodeURIComponent(query);
            } else {
                alert(`No exact app match for "${query}" in the Television Guide. Try searching for one of the suggested items.`);
            }
        }

        function showSuggestions() {
            const query = document.getElementById('search-input').value.toLowerCase();
            const suggestionsContainer = document.getElementById('suggestions');
            suggestionsContainer.innerHTML = '';

            if (query.length < 2) {
                suggestionsContainer.style.display = 'none';
                return;
            }

            const filteredLinks = links.filter(link => link.name.toLowerCase().includes(query));

            if (filteredLinks.length > 0) {
                filteredLinks.slice(0, 5).forEach(link => {
                    const suggestion = document.createElement('div');
                    suggestion.textContent = link.name;
                    suggestion.onclick = () => {
                        document.getElementById('search-input').value = link.name;
                        search();
                    };
                    suggestionsContainer.appendChild(suggestion);
                });
                suggestionsContainer.style.display = 'block';
            } else {
                suggestionsContainer.style.display = 'none';
            }
        }

        // --- INTRO VIDEO LOGIC (Unchanged) ---
        function showMainContent() {
            document.getElementById('intro-video').pause();
            document.getElementById('intro-video').style.display = 'none';
            document.getElementById('launch-screen').style.display = 'none';
            document.getElementById('skip-btn').style.display = 'none';
            document.getElementById('main-content').style.display = 'block';
            document.body.style.overflowY = 'auto';
        }

        function startExperience() {
            const introToggle = document.getElementById('introToggle');
            document.getElementById('launch-screen').style.display = 'none';

            if (introToggle.checked) {
                const video = document.getElementById('intro-video');
                video.muted = false;
                video.style.display = 'block';
                video.play().catch(error => console.log("Video play failed:", error));
                document.getElementById('skip-btn').style.display = 'block';
            } else {
                showMainContent();
            }
        }

        function skipVideo() {
            showMainContent();
        }

        document.getElementById('intro-video').addEventListener('ended', showMainContent);

        // --- TOGGLE STATE & PAGE LOAD (Unchanged) ---
        const introToggle = document.getElementById('introToggle');

        const savedIntroState = localStorage.getItem('introVideoEnabled');
        if (savedIntroState === null) {
            introToggle.checked = true;
        } else {
            introToggle.checked = (savedIntroState === 'true');
        }

        introToggle.addEventListener('change', function() {
            localStorage.setItem('introVideoEnabled', this.checked);
            if (!this.checked && document.getElementById('intro-video').style.display === 'block') {
                skipVideo();
            } else if (this.checked && document.getElementById('main-content').style.display === 'block') {
                document.getElementById('main-content').style.display = 'none';
                document.getElementById('launch-screen').style.display = 'flex';
                document.getElementById('intro-video').load();
                document.getElementById('intro-video').muted = true;
            }
        });

        // DOM Content Loaded Handler
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('intro-video').muted = true;

            if (!introToggle.checked) {
                showMainContent();
            } else {
                document.getElementById('launch-screen').style.display = 'flex';
                document.getElementById('intro-video').style.display = 'none';
            }
 loadBulletinBoard();

            // Initial check for notification status to update the button
            const notifyBtn = document.getElementById('notification-button');
            if (notifyBtn) {
                if ('Notification' in window) {
                    if (Notification.permission === 'granted') {
                        notifyBtn.textContent = 'Notifications ACTIVE';
                        notifyBtn.disabled = true;
                    } else if (Notification.permission === 'denied') {
                        notifyBtn.textContent = 'Notifications BLOCKED';
                        notifyBtn.disabled = true;
                    }
                } else {
                     // Hide or disable the button if not supported
                     notifyBtn.style.display = 'none';
                }
            }
            
            // --- TOMORROW.IO WIDGET LOADER ---
            // Note: This loader script was moved here from the HTML for better organization.
            (function (d, s, id) {
                if (d.getElementById(id)) {
                    if (window.__TOMORROW__) {
                        window.__TOMORROW__.renderWidget();
                    }
                    return;
                }
                const fjs = d.getElementsByTagName(s)[0];
                const js = d.createElement(s);
                js.id = id;
                js.src = "https://www.tomorrow.io/v1/widget/sdk/sdk.bundle.min.js";
                fjs.parentNode.insertBefore(js, fjs);
            })(document, 'script', 'tomorrow-sdk');
        });
