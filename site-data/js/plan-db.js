let tab_bar = document.getElementsByClassName("tab-bar")[0];
let board = document.getElementById("plan-board");
let search_bar = document.getElementById("search-bar");
let field_labels = document.getElementsByClassName("field_label");

var sort_field = "Name";
var sort_flip = false;

var no_projects_card = undefined;
let tabs = [];
var category = 0;
var saved_category = -1;
let categories = [];
let plans = [];
var match_phrase = "";

let field_label_names = {
    "Name": "Proj Name",
    "Contractor": "Contractor(s)",
    "BidDate": "Bid Date",
    "Version": "Version"
};

search_bar.addEventListener("input", (e) => {
    match_phrase = e.target.value;

    if (match_phrase.length > 0 && category != -1) {
        saved_category = category;
        category = -1;
        set_active_tab();
        retrieve_plans();
    } else if (match_phrase.length == 0 && category == -1) {
        category = saved_category;
        saved_category = -1;
        set_active_tab();
        retrieve_plans();
    }

    populate_list();
});

function keyword_match_check(plan) {
    let keyword = match_phrase.toUpperCase();

    let name = plan.Name.toUpperCase();
    let contractor = plan.Contractor.toUpperCase();
    let version = plan.Version.toUpperCase();
    let bid_date = plan.BidDate;

    return name.includes(keyword) || contractor.includes(keyword) ||
           version.includes(keyword) || bid_date.includes(keyword);
}

function populate_list() {
    let cards = document.getElementsByClassName("plan-card");
    while (cards.length > 0)
        cards[0].remove();

    if (no_projects_card != undefined) {
        no_projects_card.remove();
        no_projects_card = undefined;
    }

    for (let i = 0; i < plans.length; i++) {
        let plan = plans[i];

        if (keyword_match_check(plan) == false) {
            continue;
        }

        let file_name = plan.Preview.substring(14);

        var preview_link = `<a href='/get-preview?file=${file_name}' target="_blank">preview</a>`;
        if (plan.Preview == "#") {
            preview_link = 'NA';
        }

        let access_level = (plan.IsPublic == "Yes") ? "Public Project" : "Private Project";
        var access_link = `<a href='${plan.Link}'>${access_level}</a>`;
        if (plan.Link == 'NA') {
            access_link = '<a href="https://servius.tech/contact">Contact Us</a>';
        }

        var contractors = plan.Contractor;
        contractors = contractors.replace(" ", "");
        contractors = contractors.replace(",", "<br>");

        let card = document.createElement("div");
        card.className = "plan-card";
        card.innerHTML = `
            <table>
                <tr>
                    <td class="name-col">${plan.Name}</td>
                    <td class="contractor-col">${contractors}</td>
                    <td class="bid-col">${plan.BidDate}</td>
                    <td class="version-col">${plan.Version}</td>
                    <td class="preview-col">${preview_link}</td>
                    <td class="access-col">${access_link}</td>
                </tr>
            </table>
            <a class="order-button" href="/order?id=${plan.Id}&cat=${category}">Order<br>Plans</a>
        `;

        board.appendChild(card);
    }

    if (plans.length == 0) {
        no_projects_card = document.createElement("div");
        no_projects_card.className = "no-projects-card";
        no_projects_card.innerText = "No current projects";
        board.appendChild(no_projects_card);
    }
}

function retrieve_plans() {
    var cat_name = (category == -1) ? "All" : categories[category];

    let config = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "mode": "same-origin"
        }
    };

    fetch(`/get-projects?category=${cat_name}&db=1`, config)
        .then((response) => response.json())
        .then((res) => {
            plans = res.plans;
            sort_data();
            populate_list();
        });
}

function set_active_tab() {
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].className = (tabs[i].id == category) ? "tab active" : "tab";
    }
}

function set_active_field_tab() {
    for (let i = 0; i < field_labels.length; i++) {
        if (field_labels[i].id == sort_field) {
            field_labels[i].innerHTML = field_label_names[field_labels[i].id] + " &Congruent;";
            field_labels[i].style.textDecoration = "underline";
        } else {
            field_labels[i].innerHTML = field_label_names[field_labels[i].id];
            field_labels[i].style.textDecoration = "none";
        }
    }
}

function sort_data() {
    plans = plans.sort((a, b) => {
        let string1 = a[sort_field];
        let string2 = b[sort_field];

        if (sort_field == "BidDate") {
            var date1 = new Date(string1);
            var date2 = new Date(string2);

            if (date1.toString() == "Invalid Date") date1 = new Date(0);
            if (date2.toString() == "Invalid Date") date2 = new Date(0);

            let year_dif = date1.getFullYear() - date2.getFullYear();
            if (year_dif != 0) return sort_flip ? year_dif : -year_dif;

            let month_dif = date1.getMonth() - date2.getMonth();
            if (month_dif != 0) return sort_flip ? month_dif : -month_dif;

            let day_dif = date1.getDate() - date2.getDate();
            return sort_flip ? day_dif : -day_dif;
        }

        if (string1 < string2) return sort_flip ? 1 : -1;
        if (string1 > string2) return sort_flip ? -1 : 1;
        return 0;
    });
}

for (let i = 0; i < field_labels.length; i++) {
    field_labels[i].addEventListener("click", (e) => {
        e.preventDefault();

        if (e.target.id == sort_field) {
            sort_flip = !sort_flip;
        } else {
            sort_flip = false;
        }

        sort_field = e.target.id;
        set_active_field_tab();
        sort_data();
        populate_list();
    });
}

let config = {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        "mode": "same-origin"
    }
};

fetch("/categories", config)
    .then((response) => response.json())
    .then((res) => {
        for (let cat_index in res.categories) {
            categories.push(res.categories[cat_index]);

            let tab = document.createElement("a");
            tab.href = "#";
            tab.className = "tab";
            tab.id = cat_index;
            tab.innerText = res.categories[cat_index];

            tab.addEventListener("click", (e) => {
                e.preventDefault();
                category = e.target.id;
                set_active_tab();
                retrieve_plans();
            });

            tab_bar.appendChild(tab);
            tabs.push(tab);
        }

        set_active_tab();
        retrieve_plans();
        set_active_field_tab();
    });
