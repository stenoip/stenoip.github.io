var axios = require('axios');
var FAC = require('fast-average-color-node');
var fac = FAC;

module.exports = async function(req, res) {
    // CORS headers (must be sent even on errors)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    var targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: "No URL provided" });

    try {
        var faviconUrl = "https://www.google.com/s2/favicons?sz=128&domain=" + targetUrl;

        // Fetch favicon as arraybuffer
        var response = await axios.get(faviconUrl, { responseType: 'arraybuffer' });
        var buffer = Buffer.from(response.data, 'binary');

        // Extract average color
        var colorData = await fac.getAverageColor(buffer);

        res.json({
            favicon: faviconUrl,
            color: colorData.hex
        });
    } catch (error) {
        console.error("API error:", error.message);
        res.status(200).json({
            favicon: '',
            color: '#2d89ef' // fallback color
        });
    }
};
