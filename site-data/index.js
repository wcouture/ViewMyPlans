const nodemailer = require('nodemailer');
const express = require('express');
const fs = require('fs');
const multer = require("multer");
const upload = multer({dest: "data/temp"});

const bodyParser = require('body-parser');
const app = express();

// Sets the upload size limit for json blobs
app.use(bodyParser.json({limit: '200mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));

const port = 3001;

app.get("/", (req, res) => {
    res.sendFile("/pages/index.html", { root: __dirname });
});

app.get("/upload", (req, res) => {
    res.sendFile("/pages/upload.html", { root: __dirname });
});

app.get("/order", (req, res) => {
    res.sendFile("/pages/order.html", { root: __dirname });
});

app.get("/plans", (req, res) => {
    res.sendFile("/pages/plans.html", { root: __dirname });
});

app.get("/categories", (req, res) => {
    res.send(JSON.stringify({ "categories": ["cat1", "cat2", "cat3"]}))
});

app.get("/:dir/:file", (req, res) => {
    res.sendFile(`/${req.params.dir}/${req.params.file}`, { root: __dirname });
})

app.listen(port, () => {
    console.log(`Semblueinc listening on port ${port}`);
});