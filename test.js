const gplay = require('google-play-scraper').default || require('google-play-scraper');
console.log(gplay);
if (gplay.app) {
    gplay.app({appId: 'com.b3fin.finphoto'}).then(app => console.log('Version:', app.version)).catch(console.error);
}
