const axios = require('axios');

async function fetchData(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching data from the URL: ' + error.message);
    }
}

async function generateM3UPlaylist() {
    try {
        // URL of the JSON file
        const jsonUrl = 'https://fox.toxic-gang.xyz/tata/channels';

        // Fetch JSON data
        const jsonData = await fetchData(jsonUrl);

        // Validate data
        if (!jsonData.data || !Array.isArray(jsonData.data)) {
            throw new Error('Invalid JSON data or format');
        }

        // Fetch HMAC value
        const hmacUrl = 'https://fox.toxic-gang.xyz/tata/hmac';
        const hmacJson = await fetchData(hmacUrl);
        const hmacValue = hmacJson[0]?.data?.hdntl;

        if (!hmacValue) {
            throw new Error('Error retrieving HMAC value');
        }

        // Generate M3U playlist
        let m3u8Content = "#EXTM3U\n";

        for (const channel of jsonData.data) {
            const { id, title, logo, initialUrl, genre, licence1, licence2 } = channel;

            // Construct the custom URL with the HMAC value
            const customUrl = `${initialUrl}?cookie=${encodeURIComponent(hmacValue)}`;

            // Create playlist entry
            m3u8Content += `#EXTINF:-1 tvg-id="${id}" group-title="${genre}", tvg-logo="${logo}", ${title}\n`;
            m3u8Content += "#KODIPROP:inputstream.adaptive.license_type=clearkey\n";
            m3u8Content += `#KODIPROP:inputstream.adaptive.license_key=${licence1}:${licence2}\n`;
            m3u8Content += `#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36\n`;
            m3u8Content += `#EXTHTTP:{"cookie":"${hmacValue}"}\n`;
            m3u8Content += `${customUrl}\n\n`;
        }

        // Output the playlist
        console.log(m3u8Content);
    } catch (error) {
        console.error(error.message);
    }
}

// Run the function to generate M3U playlist
generateM3UPlaylist();
