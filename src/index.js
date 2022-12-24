const express = require('express');
const serverless = require('serverless-http');
const app = express();
const router = express.Router();

const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI,
);

oAuth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
});

// Set up the Google Drive API client
const drive = google.drive({
    version: 'v3',
    auth: oAuth2Client,
});

router.get('/', (req, res) => {
    res.json({
        "message": "Hello World!",
    });
});
router.post('/upload', (req, res) => {
    // Read the file from the request body
    const fileName = req.headers['x-file-name'];
    const mimetype = req.headers['x-file-mimetype'];
    const readStream = req;

    // Create a new file in Google Drive
    drive.files.create({
        resource: {
            name: fileName,
            mimeType: mimetype,
        },
        media: {
            body: readStream,
        },
    }, (err, file) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
            return;
        }
        res.send({ fileId: file.data.id });
    });
});

app.use('/.netlify/functions/index', router);

module.exports.handler = serverless(app);
