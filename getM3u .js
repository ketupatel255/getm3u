// pages/api/generateM3u.js

import fetch from "cross-fetch";

const getUserChanDetails = async () => {
    let hmacValue;
    let obj = { list: [] };

    try {
        const responseHmac = await fetch("https://fox.toxic-gang.xyz/tata/hmac");
        const data = await responseHmac.json();
        const hmacData = data[0];
        hmacValue = hmacData.data.hdntl;
    } catch (error) {
        console.error('Error fetching HMAC data:', error);
        return obj;
    }

    try {
        const responseChannels = await fetch("https://fox.toxic-gang.xyz/tata/channels");
        const cData = await responseChannels.json();

        if (cData && cData.data && Array.isArray(cData.data)) {
            cData.data.forEach(channel => {
                let firstGenre = channel.genre || null;
                let rearrangedChannel = {
                    id: channel.id,
                    name: channel.title,
                    tvg_id: channel.id,
                    group_title: firstGenre,
                    tvg_logo: channel.logo,
                    stream_url: channel.mpd, // Adjust this if the correct property is different
                    license_url: null,
                    stream_headers: null,
                    drm: null,
                    is_mpd: true,
                    kid_in_mpd: channel.kid,
                    hmac_required: null,
                    key_extracted: null,
                    pssh: channel.pssh,
                    clearkey: channel.clearkeys_base64 ? JSON.stringify(channel.clearkeys_base64) : null,
                    hma: hmacValue
                };
                obj.list.push(rearrangedChannel);
            });
        }
    } catch (error) {
        console.error('Fetch error:', error);
        return obj;
    }

    return obj;
};

const generateM3u = async () => {
    let m3uStr = '';

    let userChanDetails = await getUserChanDetails();
    let chansList = userChanDetails.list;

    m3uStr = '#EXTM3U\n';

    for (const channel of chansList) {
        m3uStr += `#EXTINF:-1 tvg-id="${channel.id}" `;
        m3uStr += `group-title="${channel.group_title}", tvg-logo="${channel.tvg_logo}", ${channel.name}\n`;
        m3uStr += '#KODIPROP:inputstream.adaptive.license_type=clearkey\n';
        m3uStr += `#KODIPROP:inputstream.adaptive.license_key=${channel.clearkey}\n`;
        m3uStr += '#EXTVLCOPT:http-user-agent=Mozilla/5.0\n';
        m3uStr += `#EXTHTTP:{"cookie":"${channel.hma}"}\n`;
        m3uStr += `${channel.stream_url}|cookie:${channel.hma}\n\n`;
    }

    return m3uStr;
};

export default async function handler(req, res) {
    try {
        const m3uString = await generateM3u();
        res.setHeader("Content-Type", "text/plain");
        res.status(200).send(m3uString);
    } catch (error) {
        console.error('Error generating M3U:', error);
        res.status(500).send('Error generating M3U');
    }
}
