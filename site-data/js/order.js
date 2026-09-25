var project_data = undefined;
let board = document.getElementsByClassName("plan-board")[0];

let plan_ind = document.getElementById("plan-column-ind");
let spec_ind = document.getElementById("spec-column-ind");

let plan_sec = document.getElementById("plan-column-sec");
let spec_div = document.getElementById("spec-column-div");

let plan_full = document.getElementById("plan-column-full");
let spec_full = document.getElementById("spec-column-full");

let email = document.getElementById("email");
let submit_button = document.getElementById("submit-button");

let plan_ind_boxes = [];
let plan_sec_boxes = [];
let plan_full_box = [];

let spec_ind_boxes = [];
let spec_div_boxes = [];
let spec_full_box = [];

submit_button.addEventListener("click", (e) => {
    e.preventDefault();
    if (email.value.length <= 0 || !email.value.includes("@") || !email.value.includes(".")) {
        alert("Must enter valid email to submit.");
        return;
    }

    let message = {
        "name": document.getElementById("project-name").innerText,
        "email": email.value,
        "notes": document.getElementById("notes-textarea").value,
        "plan_ind": [],
        "plan_sec": [],
        "plan_full": [],
        "spec_ind": [],
        "spec_div": [],
        "spec_full": []
    };

    for (let i = 0; i < plan_full_box.length; i++) {
        if (plan_full_box[i].checked) message.plan_full.push(plan_full_box[i].id);
    }
    for (let i = 0; i < spec_full_box.length; i++) {
        if (spec_full_box[i].checked) message.spec_full.push(spec_full_box[i].id);
    }
    for (let i = 0; i < plan_sec_boxes.length; i++) {
        if (plan_sec_boxes[i].checked) message.plan_sec.push(plan_sec_boxes[i].id);
    }
    for (let i = 0; i < spec_div_boxes.length; i++) {
        if (spec_div_boxes[i].checked) message.spec_div.push(spec_div_boxes[i].id);
    }
    for (let i = 0; i < plan_ind_boxes.length; i++) {
        if (plan_ind_boxes[i].checked) message.plan_ind.push(plan_ind_boxes[i].id);
    }
    for (let i = 0; i < spec_ind_boxes.length; i++) {
        if (spec_ind_boxes[i].checked) message.spec_ind.push(spec_ind_boxes[i].id);
    }

    let config = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "mode": "same-origin"
        }
    };
    config.body = JSON.stringify(message);

    fetch("/order-request", config)
        .then((response) => response.json())
        .then((res) => {
            if (res.status == 'success') {
                board.className = "plan-board hidden";
                setTimeout(() => {
                    board.innerHTML = `
                        <p class="order-success-message">Plan order request submitted.</p>
                        <a class="return-button" href="/plans">View Plans</a>
                    `;
                    board.className = "plan-board";
                }, 500);
            }
        });
});

function make_item(style_class) {
    let item = document.createElement("p");
    if (style_class) item.className = style_class;
    return item;
}

function make_checkbox_row(id_val, label_text) {
    let item = document.createElement("p");
    item.className = "checkbox-row";

    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id_val;

    let label = document.createElement("p");
    label.innerText = label_text;
    label.className = "plan-order-label";

    item.appendChild(checkbox);
    item.appendChild(label);
    return { item, checkbox };
}

function set_project_data(data) {
    project_data = data;

    // Full sets
    let full_plans_header = document.createElement("p");
    full_plans_header.innerText = "~~~~~~~~~~ Plans ~~~~~~~~~~";
    plan_full.appendChild(full_plans_header);

    let { item: pfItem, checkbox: pfBox } = make_checkbox_row(project_data.plan_full, project_data.plan_full);
    pfItem.className = "checkbox-row centered";
    plan_full_box.push(pfBox);
    plan_full.appendChild(pfItem);

    let full_specs_header = document.createElement("p");
    full_specs_header.innerText = "~~~~~~~~~~ Specs ~~~~~~~~~~";
    spec_full.appendChild(full_specs_header);

    let { item: sfItem, checkbox: sfBox } = make_checkbox_row(project_data.spec_full, project_data.spec_full);
    sfItem.className = "checkbox-row centered";
    spec_full_box.push(sfBox);
    spec_full.appendChild(sfItem);

    // Sections / Divisions
    let sec_plans_header = document.createElement("p");
    sec_plans_header.innerText = "~~~~~~~~~~ Plans ~~~~~~~~~~";
    plan_sec.appendChild(sec_plans_header);

    for (let i = 0; i < project_data.plan_sec.length; i++) {
        let { item, checkbox } = make_checkbox_row(project_data.plan_sec[i], project_data.plan_sec[i]);
        plan_sec_boxes.push(checkbox);
        plan_sec.appendChild(item);
    }
    if (project_data.plan_sec.length == 0) {
        let p = document.createElement("p");
        p.innerText = "None available";
        plan_sec.appendChild(p);
    }

    let sec_specs_header = document.createElement("p");
    sec_specs_header.innerText = "~~~~~~~~~~ Specs ~~~~~~~~~~";
    spec_div.appendChild(sec_specs_header);

    for (let i = 0; i < project_data.spec_div.length; i++) {
        let { item, checkbox } = make_checkbox_row(project_data.spec_div[i], project_data.spec_div[i]);
        spec_div_boxes.push(checkbox);
        spec_div.appendChild(item);
    }
    if (project_data.spec_div.length == 0) {
        let p = document.createElement("p");
        p.innerText = "None available";
        spec_div.appendChild(p);
    }

    // Individuals
    let ind_plans_header = document.createElement("p");
    ind_plans_header.innerText = "~~~~~~~~~~ Plans ~~~~~~~~~~";
    plan_ind.appendChild(ind_plans_header);

    for (let i = 0; i < project_data.plan_ind.length; i++) {
        let { item, checkbox } = make_checkbox_row(project_data.plan_ind[i], project_data.plan_ind[i]);
        plan_ind_boxes.push(checkbox);
        plan_ind.appendChild(item);
    }
    if (project_data.plan_ind.length == 0) {
        let p = document.createElement("p");
        p.innerText = "None available";
        plan_ind.appendChild(p);
    }

    let ind_specs_header = document.createElement("p");
    ind_specs_header.innerText = "~~~~~~~~~~ Specs ~~~~~~~~~~";
    spec_ind.appendChild(ind_specs_header);

    for (let i = 0; i < project_data.spec_ind.length; i++) {
        let { item, checkbox } = make_checkbox_row(project_data.spec_ind[i], project_data.spec_ind[i]);
        spec_ind_boxes.push(checkbox);
        spec_ind.appendChild(item);
    }
    if (project_data.spec_ind.length == 0) {
        let p = document.createElement("p");
        p.innerText = "None available";
        spec_ind.appendChild(p);
    }
}
