import axios from "axios";
import jsdom from "jsdom";
import ColorThief from "color-thief-node";

const { JSDOM } = jsdom;

export default async function handler(req, res) {
    try {
        const { url } = req.query;

        if (!url) return res.status(400).json({ error: "Missing URL" });

        // Ensure URL has protocol
        var siteUrl = url.startsWith("http") ? url : `https://${url}`;

        // step 1 Fetch HTML
        const response = await axios.get(siteUrl, { timeout: 5000 });
        const html = response.data;

        // step 2️ Parse HTML
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // step 3 Find favicon
        let favicon = document.querySelector("link[rel~='icon']");
        let faviconUrl = favicon ? favicon.href : `${siteUrl}/favicon.ico`;

        // Make favicon URL absolute if needed
        if (!faviconUrl.startsWith("http")) {
            faviconUrl = new URL(faviconUrl, siteUrl).href;
        }

        // step 4 Fetch favicon image
        const faviconResponse = await axios.get(faviconUrl, { responseType: "arraybuffer" });
        const faviconBuffer = Buffer.from(faviconResponse.data);

        // step 5 Get dominant color
        const dominantColor = await ColorThief.getColor(faviconBuffer); // returns [r,g,b]

        const colorHex = `rgb(${dominantColor.join(",")})`;

        res.status(200).json({ favicon: faviconUrl, color: colorHex });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch tile data" });
    }
}
