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

/* 
    The email to which all messages and requests will be sent to.
*/
const message_recipient = "eaststore@semblueinc.com";

/*
    Time related constants used for delayed actions
    and calculating dates
*/
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/*
    Act as result constants to be returned during 
    one-way transactions such as posting data
*/
const SUCCESS = JSON.stringify({ "status": "project added" });
const UPDATED = JSON.stringify({ "status": "project updated" });
const DELETED = JSON.stringify({ "status": "project deleted" });
const NOT_FOUND = JSON.stringify({ "status": "project not found" });

// Will hold all project data once read in from file on server start
var project_data = {};

/*
    Container of category constants to be used for tabs on plans list
*/
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

/*
    Initializes nodemailer to allow for sending message and requests
    through email.
*/
const transporter = nodemailer.createTransport({
	"service": 'gmail',
	"auth": {
		"user": 'noreply.semblueinc@gmail.com',
		"pass": 'gpjd arjz lbhe kgda',
	}
})

/*
    Handles message sending through the nodemailer module.
    Takes in the recipient, subject and message, and then sends
    the message from the noreply.semblueinc@gmail.com email.
*/
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

/*
    Called on server start, reads in project data from the
    data_table.json file and stores data in project_data
    object.
*/
function load_project_data() {
    let data = fs.readFileSync("data/data_table.json", "utf-8");
    project_data = JSON.parse(data);
}

/*
    Serializes project data stored in the project_data object
    and saves it to file at data_table.json
*/
function save_project_data() {
    //console.log("Saving project data");
    let data = JSON.stringify(project_data, null, 4);
    fs.writeFileSync("data/data_table.json", data);
}


/*
    Returns the monocle landing page with links to all sister sites
    and the list of all tracked projects.
*/
app.get("/", (req, res) => {
    res.sendFile("/pages/index.html", { root: __dirname });
});

/*
    Returns order page for project selected. Displays all available
    plans and pages on file to be selected. Submitted requests are
    sent as POST requests to /order-request.
*/
app.get("/order", (req, res) => {
    let id = req.query.id;
    let category = categories.categories[req.query.cat];

    var project = undefined;

    if (req.query.cat == -1) {
        for (let i = 0; i < categories.categories.length; i++) {
            let curr_cat = categories.categories[i];

            for (let j = 0; j < project_data[curr_cat].plans.length; j++){
                if (project_data[curr_cat].plans[j].id == id) {
                    project = project_data[curr_cat].plans[j];
                }
            }

            if (project != undefined)
                break;
        }
    }
    else {
        for (let i = 0; i < project_data[category].plans.length; i++){
            if (project_data[category].plans[i].id == id) {
                project = project_data[category].plans[i];
            }
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

/*
    Handles plan set order requests submitted from the order
    page on viewmyplans. Displays all selected sets along
    with project name and submitter email within message to 
    be sent to the specified message_recipient constant.
*/
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
            <h5 style="width: 100%; text-align: center;">${data.name}</h5>
            <h7>${data.email}</h7>

            <h5>Notes:</h5>
            <h7>${data.notes}</h7>

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

/*
    Returns the listings page to view all current
    projects being tracked.
*/
app.get("/plans", (req, res) => {
    res.sendFile("/pages/plans.html", { root: __dirname });
});

/*
    Returns the list of all valid categories in the system.
*/
app.get("/categories", (req, res) => {
    res.send(JSON.stringify(categories));
});

/*
    Retrieves list of projects coinciding with the provided category.
    Returns combined list of all projects when "All" provided
    for category.
    Used for viewmyplans listing page when switching categories.
*/
app.get("/get-projects", (req, res) => {
    let category = req.query.category;
    var data = {"plans": []};
    
    if (category == "All") {
        for(let i = 0; i < categories["categories"].length; i++) {
            let curr_cat = categories["categories"][i];
            let cat_data = project_data[curr_cat];
            data["plans"] = data["plans"].concat(cat_data["plans"]);
        }

        res.send(JSON.stringify(data));
        return;
    }

	data = project_data[category];
    res.send(JSON.stringify(data));
});

/*
    Handles project data uploads and updates.
    Used by data upload and sync program keeping
    local and server data in sync.
*/ 
app.post("/upload-project", upload.single('file'), (req, res) => {
    let category = categories.categories[req.body.category - 1];
    var file_path = "#";

    if (req.body.name == "Market District Park") {
	console.log(category);
    }
    
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
	"spec_ind": req.body.spec_ind,
	"spec_div": req.body.spec_div,
	"spec_full": req.body.spec_full
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

/*
    Searches for project with specified id within specified
    category. If found, project data is removed from memory
    and all associated files are removed from disk.
*/
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

/*
    Deprecated function which returns online set file
    for the selected project if one exists.
*/
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

/*
    Returns preview pdf for specified project.
*/
app.get("/get-preview", (req, res) => {
    res.sendFile(`/data/previews/${req.query.file}`, { root: __dirname });
});

/*
    Routes file paths with a single folder depth.
*/
app.get("/:dir/:file", (req, res) => {
    res.sendFile(`/${req.params.dir}/${req.params.file}`, { root: __dirname });
})

/*
    Routes file paths with a folder depth of two.
*/
app.get("/:dir1/:dir2/:file", (req, res) => {
    res.sendFile(`/${req.params.dir1}/${req.params.dir2}/${req.params.file}`, { root: __dirname })
})

/*
    Initializes and starts web server.
*/
app.listen(port, () => {
    console.log(`ViewMyPlans listening on port ${port}`);
    load_project_data();
});

// Save project data every hour
setInterval(save_project_data, 5 * MINUTE);
