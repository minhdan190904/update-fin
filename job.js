let gplay = require('google-play-scraper');
if (gplay.default) { gplay = gplay.default; }
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = '8598152179:AAFfj1LlKSZ1TKdO3FAnbjAKNic3iHXK4Qc';
const TELEGRAM_CHAT_ID = '-5198536028';
const VERSION_FILE = path.join(__dirname, 'version.txt');

// ĐIỀN LINK GOOGLE PLAY HOẶC TRANG WEB CỦA BẠN VÀO ĐÂY
const TARGET_URL = 'https://play.google.com/store/apps/details?id=com.b3fin.finphoto&hl=en';
const APP_ID = 'com.b3fin.finphoto';

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

async function fetchVersionFromWebsite() {
    try {
        const appInfo = await gplay.app({ appId: APP_ID });
        return appInfo.version;
    } catch (error) {
        console.error("Lỗi khi lấy thông tin Google Play:", error.message);
        return null;
    }
}

async function checkVersion() {
    console.log("Đang kiểm tra phiên bản mới...");
    try {
        if (!fs.existsSync(VERSION_FILE)) {
            fs.writeFileSync(VERSION_FILE, '1.0.0', 'utf8');
        }
        const currentVersion = fs.readFileSync(VERSION_FILE, 'utf8').trim();
        
        // Bỏ qua nếu chưa cài đặt TARGET_URL
        if (TARGET_URL.includes('YOUR_PACKAGE_ID')) {
            console.log("Vui lòng cập nhật TARGET_URL trong file job.js");
            return;
        }

        const newVersion = await fetchVersionFromWebsite();
        
        if (newVersion) {
            console.log(`Phiên bản hiện tại: ${currentVersion} | Phiên bản trên web: ${newVersion}`);
            
            // Nếu current không >= new (nghĩa là new > current)
            if (!isVersionGreaterOrEqual(currentVersion, newVersion)) {
                const message = `🚀 <b>Đã có phiên bản mới!</b>\n\n📦 Phiên bản cũ: <code>${currentVersion}</code>\n✨ Phiên bản mới: <code>${newVersion}</code>\n\n🔗 Link: ${TARGET_URL}`;
                await sendTelegramMessage(message);
                
                // Lưu lại phiên bản mới
                fs.writeFileSync(VERSION_FILE, newVersion, 'utf8');
                console.log(`Đã cập nhật phiên bản thành công: ${newVersion}`);
            } else {
                console.log("Không có phiên bản mới.");
            }
        } else {
            console.log("Không tìm thấy thông tin phiên bản trên trang web.");
        }
    } catch (error) {
        console.error("Lỗi trong quá trình checkVersion:", error.message);
    }
}

function startJob() {
    console.log("Bắt đầu chạy Cron Job kiểm tra phiên bản (mỗi 30 phút).");
    
    // Chạy kiểm tra ngay lần đầu tiên khi khởi động
    checkVersion();
    
    // Đặt lịch chạy mỗi 30 phút
    cron.schedule('*/30 * * * *', () => {
        checkVersion();
    });
}

module.exports = { startJob };
