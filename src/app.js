import express from 'express';
import {add_participant} from './add_participant';
import {writeCSV} from './writeCSV';
import {detect} from './detect';
import admin from 'firebase-admin';
import bodyParser from 'body-parser';
import Multer from 'multer';
import {uploadImageToStorage} from "./uploadFile";

const app = express();
const dirPublic = (__dirname + '/../public');
app.use(express.static(dirPublic));

admin.initializeApp({ // initialize firestore database
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://stanford-ocr.firebaseio.com'
});
const db = admin.firestore();
export const dataCollection = db.collection('dataCollection');

app.use(bodyParser.json()); // middleware to parse req body into json
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
    res.send(dirPublic + 'index.html');
});

const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // no larger than 5mb, can be changed
    }
});

app.post('/upload', multer.single('file'), (req, res) => {
    console.log('Upload Image');

    let file = req.file;
    if (file) {
        uploadImageToStorage(file).then((success) => {
            res.status(200).send({
                status: 'success'
            });
        }).catch((error) => {
            console.error(error);
        });
    }
});

app.post('/add_participant', (req, res) => {
    add_participant(req.body);
    res.sendFile('form.html', {root: dirPublic});
});

app.get('/download', function (req, res) { // i dunno why this doesnt work
    let date_ob = new Date();
    let filepath = `${__dirname}/../survey_data_` +
        date_ob.getFullYear() + "_" + ("0" + (date_ob.getMonth() + 1)).slice(-2) +
        "_" + ("0" + date_ob.getDate()).slice(-2) + "_" + date_ob.getHours() + "_" + date_ob.getMinutes() + ".txt";
    writeCSV(filepath);
    res.download(filepath);
});

app.get('/test', function (req, res) { // huh why this no work
    detect().then(r => {
    });
    res.send('huh');
});

const port = process.env.port || 8080;
app.listen(port, () => {
    console.log("Server listening on port " + port);
});