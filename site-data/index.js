const nodemailer = require('nodemailer');
const express = require('express');
const fs = require('fs');
const combyne = require('combyne');
const multer = require("multer");
const upload = multer({dest: "data/temp"});

const bodyParser = require('body-parser');
const app = express();

// Sets the upload size limit for json blobs
app.use(bodyParser.json({limit: '200mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));

const port = 3005;

let message_recipient = "eaststore@semblueinc.com";

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
        "City and County",
        "State of Florida",
        "Church",
        "Residential",
        "Airport",
        "Medical",
        "Library",
        "Military"
    ]
}

const transporter = nodemailer.createTransport({
	"service": 'gmail',
	"auth": {
		"user": 'noreply.semblueinc@gmail.com',
		"pass": 'zosb bsqw fyci vhkb',
	}
})

function send_message(recipient, subject, message) {
	let mailOptions = {
		"from": 'noreply.semblueinc@gmail.com',
		"to": recipient,
		"subject": subject,
		"html": message,
	};

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.error('Error:', error);
		} else {
			console.log('Email sent:', info.response);
		}	
	})
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
            document.getElementById("project-name").innerText = "Project: ${(project != undefined) ? project.name : "NONE"}";
            set_project_data(${JSON.stringify(project)});
        </script>
    </html>
    `;
    let full_page = page_data + footer;
    res.send(full_page);
});

app.post("/order-request", (req, res) => {
    let data = req.body;

    let full_plans = "";
    var i = 0;
    for (; i < data.plan_full.length; i++) {
        full_plans += "<br>"
        full_plans += data.plan_full[i]
    }
    i = 0;
    for (; i < data.spec_full.length; i++) {
        full_plans += "<br>"
        full_plans += data.spec_full[i]
    }

    let secs = "";
    i = 0;
    for (; i < data.plan_sec.length; i++) {
        secs += "<br>";
        secs += data.plan_sec[i];
    }

    let divs = "";
    i = 0;
    for (; i < data.spec_div.length; i++) {
        divs += "<br>";
        divs += data.spec_div[i];
    }

    let plans = "";
    i = 0;
    for (; i < data.plan_ind.length; i++) {
        plans += "<br>";
        plans += data.plan_ind[i];
    }
    
    let specs = "";
    i = 0;
    for (; i < data.spec_ind.length; i++) {
        specs += "<br>";
        specs += data.spec_ind[i];
    }


    let message = `
        <body style="padding-left: 30%; padding-right: 30%;">
            <h2 style="width: 100%; text-align: center;"><b>Plan Order Request</b></h2>
            <h7>${data.email}</h7>

            <h5><b>Full Plans:</b></h5>
            <h6>${full_plans}</h6>

            <h5><b>Sections/Divisions:</b></h5>
            <h6>Sections: ${secs}</h6>
            <h6>Divisions: ${divs}</h6>

            <h5><b>Individuals:</b></h5>
            <h6>Plans: ${plans}</h6>
            <h6>Specs: ${specs}</h6>
        <body>
    `

    send_message(message_recipient, "Plan Order Request", message);

    res.send(JSON.stringify({ "status": "success" }));
})

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
        "is_public": req.body.is_public,
	"plan_ind": req.body.plan_ind,
	"plan_sec": req.body.plan_sec,
	"plan_full": req.body.plan_full,
	"spec_ind": req.body.sec_ind,
	"spec_div": req.body.sec_div,
	"spec_full": req.body.sec_full
    };

	if (project.plan_ind == undefined)
		project.plan_ind = [];
	if (project.plan_sec == undefined)
		project.plan_sec = [];
	if (project.plan_full == undefined || project.plan_full == "")
		project.plan_full = "NA";
	if (project.spec_ind == undefined)
		project.spec_ind = [];
	if (project.spec_div == undefined)
		project.spec_div = [];
	if (project.spec_full == undefined || project.spec_full == "")
		project.spec_full = "NA";

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
	    project_data[category].plans[i].plan_ind = project.plan_ind;
	    project_data[category].plans[i].plan_sec = project.plan_sec;
	    project_data[category].plans[i].plan_full = project.plan_full;
	    project_data[category].plans[i].spec_ind = project.spec_ind;
	    project_data[category].plans[i].spec_div = project.spec_div;
	    project_data[category].plans[i].spec_full = project.spec_full;
            res.send(UPDATED);
            return;
        }
    }

    // New project
    project_data[category].plans.push(project);
    res.send(SUCCESS);
});

app.post("/delete-project", (req, res) => {
    let project_id = req.body.id;
    let category = categories.categories[req.body.category - 1];
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

app.get("/:dir1/:dir2/:file", (req, res) => {
    res.sendFile(`/${req.params.dir1}/${req.params.dir2}/${req.params.file}`, { root: __dirname })
})

app.listen(port, () => {
    console.log(`Semblueinc listening on port ${port}`);
    load_project_data();
});

// Save project data every hour
setInterval(save_project_data, 5 * MINUTE);
