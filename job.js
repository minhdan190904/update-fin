let gplay = require('google-play-scraper');
if (gplay.default) { gplay = gplay.default; }
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = '8598152179:AAFfj1LlKSZ1TKdO3FAnbjAKNic3iHXK4Qc';
const TELEGRAM_CHAT_ID = '-5198536028';
const APPS = [
    {
        id: 'com.b3fin.finphoto',
        url: 'https://play.google.com/store/apps/details?id=com.b3fin.finphoto&hl=en',
        versionFile: path.join(__dirname, 'version_com.b3fin.finphoto.txt')
    },
    {
        id: 'photo3b.aitrending.editor',
        url: 'https://play.google.com/store/apps/details?id=photo3b.aitrending.editor&hl=vi',
        versionFile: path.join(__dirname, 'version_photo3b.aitrending.editor.txt')
    }
];

function isVersionGreaterOrEqual(current, target) {
    if (!target || target.trim() === '') return true;
    const c = current.split(".").map(n => parseInt(n) || 0);
    const t = target.split(".").map(n => parseInt(n) || 0);
    const max = Math.max(c.length, t.length);
    for (let i = 0; i < max; i++) {
        const cv = c[i] || 0;
        const tv = t[i] || 0;
        if (cv !== tv) return cv > tv;
    }
    return true;
}

async function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        console.log("Đã gửi tin nhắn Telegram thành công!");
    } catch (error) {
        console.error("Lỗi khi gửi tin nhắn Telegram:", error.message);
    }
}

async function fetchVersionFromWebsite(appId) {
    try {
        const appInfo = await gplay.app({ appId: appId });
        return appInfo.version;
    } catch (error) {
        console.error(`Lỗi khi lấy thông tin Google Play cho ${appId}:`, error.message);
        return null;
    }
}

async function checkVersion() {
    console.log("Đang kiểm tra phiên bản mới cho các ứng dụng...");
    for (const app of APPS) {
        try {
            if (!fs.existsSync(app.versionFile)) {
                fs.writeFileSync(app.versionFile, '1.0.0', 'utf8');
            }
            const currentVersion = fs.readFileSync(app.versionFile, 'utf8').trim();
            
            if (app.url.includes('YOUR_PACKAGE_ID')) {
                console.log(`Vui lòng cập nhật URL cho ứng dụng ${app.id}`);
                continue;
            }

            const newVersion = await fetchVersionFromWebsite(app.id);
            
            if (newVersion) {
                console.log(`[${app.id}] Phiên bản hiện tại: ${currentVersion} | Phiên bản trên web: ${newVersion}`);
                
                if (!isVersionGreaterOrEqual(currentVersion, newVersion)) {
                    const message = `🚀 <b>Đã có phiên bản mới cho ứng dụng!</b>\n\n📦 Ứng dụng: <code>${app.id}</code>\n📦 Phiên bản cũ: <code>${currentVersion}</code>\n✨ Phiên bản mới: <code>${newVersion}</code>\n\n🔗 Link: ${app.url}`;
                    await sendTelegramMessage(message);
                    
                    fs.writeFileSync(app.versionFile, newVersion, 'utf8');
                    console.log(`Đã cập nhật phiên bản thành công cho ${app.id}: ${newVersion}`);
                } else {
                    console.log(`[${app.id}] Không có phiên bản mới.`);
                }
            } else {
                console.log(`[${app.id}] Không tìm thấy thông tin phiên bản trên trang web.`);
            }
        } catch (error) {
            console.error(`Lỗi trong quá trình checkVersion cho ${app.id}:`, error.message);
        }
    }
}

function startJob() {
    console.log("Bắt đầu chạy Cron Job kiểm tra phiên bản (mỗi 5 phút).");
    
    // Chạy kiểm tra ngay lần đầu tiên khi khởi động
    checkVersion();
    
    // Đặt lịch chạy mỗi 5 phút
    cron.schedule('*/5 * * * *', () => {
        checkVersion();
    });
}

module.exports = { startJob };
