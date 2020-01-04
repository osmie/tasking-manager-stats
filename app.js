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
        el.innerHTML = childNodes_or_innerHTML;
    } 
    if (Array.isArray(childNodes_or_innerHTML)) {
        for (let i=0; i<childNodes_or_innerHTML.length; i++) {
            el.append(childNodes_or_innerHTML[i]);
        }
    }
    return el;
}

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
    base.append(html("button", {"onclick": "load_campaign()"}, "Load Campaign"));
    base.append(html("div", {'id': 'campaign_details'}));
}

async function load_campaign() {
    let campaign_details = document.getElementById("campaign_details");
    let campaign = document.getElementById("campaign_name").value;
    campaign_details.innerHTML = `Loading ${campaign}...`;

    let tasking_manager_url = get_tasking_manager_url();
    let resp = await fetch(tasking_manager_url + "/api/v1/project/search?campaign_tag="+campaign);
    let projects = await resp.json();

    campaign_details.innerHTML = "";
    campaign_details.append(html("div", {}, `There are ${projects.results.length} projects in campaign ${campaign}`));
    campaign_details.append(html("select", {"id": "project_id"},
        projects.results.map(p => html("option", {"value": p.projectId}, `${p.projectId} ${p.name}`))
    ));
    base.append(html("button", {"onclick": "load_project()"}, "Load Project"));
    base.append(html("div", {'id': 'project_details'}));


}

async function load_project() {
    let tasking_manager_url = get_tasking_manager_url();
    let project_details = document.getElementById("campaign_details");
    let project_id = document.getElementById("project_id").value;
    let resp = await fetch(tasking_manager_url + "/api/v1/project/"+project_id+"/tasks");
    let tasks = await resp.json();
    console.log(tasks);
    tasks = tasks.features.map(t => {
        let task_id = t.properties.taskId;
        return task_id;
    });
    console.log(tasks);

}
