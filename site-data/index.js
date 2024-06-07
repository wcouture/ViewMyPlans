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

const port = 3005;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const SUCCESS = JSON.stringify({ "status": "project added" });
const UPDATED = JSON.stringify({ "status": "project updated" });
const DELETED = JSON.stringify({ "status": "project deleted" });
const NOT_FOUND = JSON.stringify({ "status": "project not found" });

var project_data = {};

const categories = {
    "categories": [
        "Commercial",
        "School",
        "City & County",
        "State of Florida",
        "Church",
        "Residential",
        "Airport",
        "Medical",
        "Library",
        "Military"
    ]
}

function load_project_data() {
    let data = fs.readFileSync("data/data_table.json", "utf-8");
    project_data = JSON.parse(data);
}

function save_project_data() {
    console.log("Saving project data");
    let data = JSON.stringify(project_data, null, 4);
    fs.writeFileSync("data/data_table.json", data);
}

app.get("/", (req, res) => {
    res.sendFile("/pages/index.html", { root: __dirname });
});

app.get("/order", (req, res) => {
    let id = req.query.id;
    let category = categories.categories[req.query.cat];
    var project = undefined;
    for (let i = 0; i < project_data[category].plans.length; i++){
        if (project_data[category].plans[i].id == id) {
            project = project_data[category].plans[i];
        }
    }

    let page_data = fs.readFileSync('pages/order.html', 'utf-8');
    let footer = `
        <script>
            document.getElementById("project-name").innerText = "Project: ${project.name}";
            set_project_data(${JSON.stringify(project)});
        </script>
    </html>
    `;
    let full_page = page_data + footer;
    res.send(full_page);
});

app.get("/plans", (req, res) => {
    res.sendFile("/pages/plans.html", { root: __dirname });
});

app.get("/categories", (req, res) => {
    res.send(JSON.stringify(categories));
});

app.get("/get-projects", (req, res) => {
    let category = req.query.category;
    let data = project_data[category];
    res.send(JSON.stringify(data));
});

app.post("/upload-project", upload.single('file'), (req, res) => {
    let category = categories.categories[req.body.category - 1];
    console.log("Category: " + category);
    var file_path = "#";
    
    if (req.file != undefined) {
        file_path = "data/previews/" + req.file.originalname;

	while (file_path.includes(' ') || file_path.includes('#')){
	    file_path = file_path.replace(' ', '_');
	    file_path = file_path.replace('#', '');
	}
        
	fs.rename(req.file.path, file_path, (err) => {
            if (err) {
                console.error('Error moving the file:', err);
                res.status(500).send('Error saving the file');
                return;
            }
	    console.log("File saved: " + file_path);
        })

    }

    let project = {
        "id": req.body.id,
        "name": req.body.name,
        "contractor": req.body.contractor,
        "bid_date": req.body.bid_date,
        "version": req.body.version,
        "preview": file_path,
        "link": req.body.newforma,
        "is_public": req.body.is_public
    };

    if (project.contractor == "")
	    project.contractor = "__";
    if (project.bid_date == "")
	    project.bid_date = "__";

    for (let i = 0; i < project_data[category].plans.length; i++){
        if (project_data[category].plans[i].id == project.id) {
            // Update project information
            project_data[category].plans[i].name = project.name;
            project_data[category].plans[i].contractor = project.contractor;
            project_data[category].plans[i].bid_date = project.bid_date;
            project_data[category].plans[i].version = project.version;
            project_data[category].plans[i].preview = project.preview;
            project_data[category].plans[i].link = project.link;
            project_data[category].plans[i].is_public = project.is_public;
            res.send(UPDATED);
	    console.log("Updating project: " + JSON.stringify(project_data[category].plans[i]));
            return;
        }
    }

    // New project
    project_data[category].plans.push(project);
    console.log("Uploading project: " + JSON.stringify(project));
    res.send(SUCCESS);
});

app.post("/delete-project", (req, res) => {
    let project_id = req.body.id;
    let category = categories.categories[req.body.category - 1];
    console.log(`deleting: ${project_id} | ${category}`);
    for (let i = 0; i < project_data[category].plans.length; i++) {
        if (project_data[category].plans[i].id == project_id) {
            // Remove one element at the specified index
	
	    if (project_data[category].plans[i].preview != "#") {
            	fs.rm(project_data[category].plans[i].preview, null, (e) => {
			if (e) {
				console.log("Error removing file: " + project_data[category].plans[i].preview);
			}
	    	});
	    }
		project_data[category].plans.splice(i, 1);
		res.send(DELETED);
	    return;
	
        }
    }

    res.send(NOT_FOUND);
});

app.get("/online-set", (req, res) => {
    let id = req.query.id;

    for (let i = 0; i < project_data[category].plans.length; i++) {
        if (project_data[category].plans[i].id == id) {
            res.sendFile(project_data[category].plans[i].preview, { root: __dirname });
            return;
        }
    }
    res.send(NOT_FOUND);
});

app.get("/:dir/:file", (req, res) => {
    res.sendFile(`/${req.params.dir}/${req.params.file}`, { root: __dirname });
})

app.listen(port, () => {
    console.log(`Semblueinc listening on port ${port}`);
    load_project_data();
});

// Save project data every hour
setInterval(save_project_data, MINUTE);
