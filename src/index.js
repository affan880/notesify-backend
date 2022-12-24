const express = require('express');
const serverless = require('serverless-http')
const app = express();
const router = express.Router();

const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();


// Set up the storage engine for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './tmp');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const upload = multer({ storage: storage });

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
        "hee": "she",
    });
});


router.post('/upload', upload.single('file'), (req, res) => {
    console.log(req.file)
    // Read the file from the local file system
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const mimetype = req.file.mimetype;
    const readStream = fs.createReadStream(filePath);

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

        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(err);
            }
        });
        res.send({ fileId: file.data.id });
    });

});

app.use('/.netlify/functions/index', router);

module.exports.handler = serverless(app);

// app.listen(PORT, () => {
//     console.log('Server is running on port 3000');
// });



// exports.handler = (event, context, callback) => {
//     // This will allow the function to handle all HTTP methods
//     event.httpMethod = event.httpMethod || 'GET';

//     return app(event, context, callback);
// };
