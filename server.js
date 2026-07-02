const express = require('express');
const path = require('path');
const { startJob } = require('./job');

const app = express();
const port = 3001;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    startJob(); // Khởi động Cron Job
});
