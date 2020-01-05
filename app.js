"use strict";

function get_tasking_manager_url() {
    return document.getElementById("tasking_manager_url").value;
}

function html(elementName, attrs, childNodes_or_innerHTML) {
    let el = document.createElement(elementName);
    for (const [ key, value ] of Object.entries(attrs)) {
        el.setAttribute(key, value);
    }
    if (typeof childNodes_or_innerHTML == 'string') {
        el.append(childNodes_or_innerHTML);
    } else if (Array.isArray(childNodes_or_innerHTML)) {
        for (let i=0; i<childNodes_or_innerHTML.length; i++) {
            el.append(childNodes_or_innerHTML[i]);
        }
    }
    return el;
}
function td(content) { return html("td", {}, content) }
function th(content) { return html("th", {}, content) }
function div(content) { return html("div", {}, content) }

async function load_tm() {
    let base = document.getElementById("base");
    base.innerHTML = "Loading...";
    let tasking_manager_url = get_tasking_manager_url();
    let resp = await fetch(tasking_manager_url+"/api/health-check");
    if (!resp.ok) {
        base.innerHTML = `Cannot connect to ${tasking_manager_url}`;
        return;
    }
    let health = await resp.json();
    if (health.status != 'healthy') {
        base.innerHTML = `Cannot connect to ${tasking_manager_url}`;
        return;
    }
    
    resp = await fetch(tasking_manager_url+"/api/v1/tags/campaigns");
    let campaigns = await resp.json();
    base.innerHTML = "";

    base.append(html("div", {},
        [ html("span", {}, "Campaigns on this server:"),
          html("select", {"id": "campaign_name"}, campaigns.tags.map(t => html("option", {"value": t}, t))),
        ]
    ));
    base.append(html("button", {"onclick": "load_campaign()"}, ["Load Campaign"]));
    base.append(html("div", {'id': 'campaign_details'}));
}

async function load_campaign() {
    let campaign_details = document.getElementById("campaign_details");
    let campaign = document.getElementById("campaign_name").value;
    campaign_details.innerHTML = `Loading ${campaign}...`;

    let tasking_manager_url = get_tasking_manager_url();
    let resp = await fetch(tasking_manager_url + "/api/v1/project/search?campaign_tag="+campaign);
    let projects = await resp.json();
    
    let all_projects = projects.results;
    all_projects.sort((p1, p2) => { if (p1.name < p2.name) { return -1; } else if (p1.name == p2.name) { return 0; } else if (p1.name > p2.name) { return 1; }});

    campaign_details.innerHTML = "";
    campaign_details.append(html("div", {}, `There are ${projects.results.length} projects in campaign ${campaign}`));
    campaign_details.append(html("select", {"id": "project_id"},
        all_projects.map(p => html("option", {"value": p.projectId}, `${p.projectId} ${p.name}`))
    ));
    campaign_details.append(html("button", {"onclick": "load_project()"}, "Load Project"));
    campaign_details.append(html("div", {'id': 'project_details'}));


}

async function load_project() {
    let tasking_manager_url = get_tasking_manager_url();
    let project_id = document.getElementById("project_id").value;
    let project_details = document.getElementById("project_details");

    let resp = await fetch(tasking_manager_url + "/api/v1/project/"+project_id);
    let project = await resp.json();

    resp = await fetch(tasking_manager_url + "/api/v1/stats/project/"+project_id+"/activity");
    let activity = await resp.json();

    let max_pages = activity.pagination.pages;
    //if (max_pages > 5) { max_pages = 5; }
    let history_load_progress = html("progress", {"id": "loading_history", "max":max_pages, "value": 0});
    let history_load = html("span", {}, ["Loading...", history_load_progress]);
    project_details.append(history_load);

    // TODO replace this with some sort of parallel fetch/Promise
    let all_history = []
    for (let page =1; page<=max_pages; page++) {
        resp = await fetch(tasking_manager_url + "/api/v1/stats/project/"+project_id+"/activity?page="+page);
        let hist_page = await resp.json();
        for (var i=0; i<hist_page.activity.length; i++) {
            let a = hist_page.activity[i];
            if (a.action == 'STATE_CHANGE' && a.actionText == 'MAPPED') {
                all_history.push(a);
            }
        }
        history_load_progress.setAttribute("value", page);
    }

    history_load.remove();

    let project_created = new Date(project.created);
    let now = new Date();
    let mapping_events = all_history.map(e => new Date(e.actionDate));
    mapping_events.sort();

    let project_age = now - project_created;
    let total_tasks = project.tasks.features.length;

    let tasks_per_ms = mapping_events.length / project_age;
    let tasks_per_day = tasks_per_ms * ( 86400000 );
    let num_remaining_tasks = total_tasks - mapping_events.length;
    let days_for_remaining_tasks = num_remaining_tasks / tasks_per_day;

    project_details.append(html("div", {},
        [
            div([`${total_tasks} tasks in total`]),
            html("table", {"class": "greyGridTable"},
            [
                html("tr", {}, [ th("Since When"), th("Tasks done"), th("% total tasks done"), th("Rate"), th("Est. Finished") ] ),
                html("tr", {}, [
                    td(`Since start (${project_created})`),
                    td(String(mapping_events.length)),
                    td(`${(mapping_events.length*100.0/total_tasks).toFixed(1)}%`),
                    td(`${tasks_per_day.toFixed(2)} tasks/day`),
                    td(`${days_for_remaining_tasks.toFixed(1)} days`)
                ] ),
            ])
        ]));

}

