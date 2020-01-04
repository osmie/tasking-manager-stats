"use strict";

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
    let tasking_manager_url = document.getElementById("tasking_manager_url").value;
    console.log(tasking_manager_url);
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

    base.append(
        html("select", {"id": "campaign_name"}, campaigns.tags.map(t => html("option", {"value": t}, t)),)
    );
    base.append(html("button", {"onclick": "load_campaign()"}, "Load Campaign"));
    base.append(html("div", {'id': 'campaign_details'}));
}

async function load_campaign() {
    let campaign_details = document.getElementById("campaign_details");
    let campaign = document.getElementById("campaign_name").value;
    campaign_details.innerHTML = `Loading ${campaign}...`;
}
