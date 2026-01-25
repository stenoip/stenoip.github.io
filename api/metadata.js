var axios = require('axios');

module.exports = async function(req, res) {
    // Enable CORS so your GitHub Pages site can talk to Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    var targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).json({ error: "No URL provided" });
    }

    try {
        // Use Google's favicon service (high quality)
        var favicon = "https://www.google.com/s2/favicons?sz=128&domain=" + targetUrl;
        
        // Default Windows 8-style accent colors to pick from randomly if we can't get a specific one
        var win8Colors = ["#2d89ef", "#603cba", "#1e7145", "#b91d47", "#e3a21a", "#00a300"];
        var color = win8Colors[Math.floor(Math.random() * win8Colors.length)];

        res.json({
            favicon: favicon,
            color: color
        });
    } catch (error) {
        res.json({ favicon: '', color: '#2d89ef' });
    }
};
