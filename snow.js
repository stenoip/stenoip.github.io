// snow.js — falling snow for StenoKonnect Homepage(on Christmas and Winter only)

(function () {
    const snowContainer = document.createElement("div");
    snowContainer.style.position = "fixed";
    snowContainer.style.top = "0";
    snowContainer.style.left = "0";
    snowContainer.style.width = "100%";
    snowContainer.style.height = "100%";
    snowContainer.style.pointerEvents = "none";
    snowContainer.style.overflow = "hidden";
    snowContainer.style.zIndex = "9999";

    document.body.appendChild(snowContainer);

    function createSnowflake() {
        const snow = document.createElement("div");
        snow.innerHTML = "❄";
        snow.style.position = "absolute";
        snow.style.color = "white";
        snow.style.fontSize = Math.random() * 10 + 10 + "px"; 
        snow.style.left = Math.random() * window.innerWidth + "px";
        snow.style.opacity = Math.random();
        snow.style.animation = `fall ${5 + Math.random() * 7}s linear`;

        snowContainer.appendChild(snow);

        setTimeout(() => snow.remove(), 12000);
    }

    setInterval(createSnowflake, 150); // how much snow falls
})();
