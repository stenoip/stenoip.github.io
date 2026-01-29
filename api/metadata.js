var axios = require('axios');
var FAC = require('fast-average-color-node');

var fac = new FAC.FastAverageColor();

module.exports = async function(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') return res.status(200).end();

    var targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: "No URL provided" });

    try {
        // Favicon URL via Google service
        var favicon = "https://www.google.com/s2/favicons?sz=128&domain=" + targetUrl;

        // Extract dominant color from favicon
        var colorData = await fac.getColorAsync(favicon);

        res.json({
            favicon: favicon,
            color: colorData.hex
        });
    } catch (error) {
        // Fallback in case favicon or colour extraction fails
        res.json({
            favicon: '',
            color: '#2d89ef'
        });
    }
};
