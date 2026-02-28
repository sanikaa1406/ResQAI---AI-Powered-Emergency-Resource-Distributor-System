document.addEventListener("DOMContentLoaded", function(){

  // MORE SAMPLE DATA (7 Requests)
  let requests = [
    { id:1, victimName:"John", state:"Delhi", lat:28.7041, lng:77.1025, type:"Medical", status:"Pending"},
    { id:2, victimName:"Rahul", state:"Maharashtra", lat:19.0760, lng:72.8777, type:"Food", status:"Pending"},
    { id:3, victimName:"Aisha", state:"Karnataka", lat:12.9716, lng:77.5946, type:"Water", status:"Pending"},
    { id:4, victimName:"Meera", state:"Tamil Nadu", lat:13.0827, lng:80.2707, type:"Medical", status:"Pending"},
    { id:5, victimName:"Arjun", state:"Gujarat", lat:23.0225, lng:72.5714, type:"Food", status:"Pending"},
    { id:6, victimName:"Fatima", state:"West Bengal", lat:22.5726, lng:88.3639, type:"Water", status:"Pending"},
    { id:7, victimName:"Rohan", state:"Punjab", lat:31.1471, lng:75.3412, type:"Medical", status:"Pending"},
  ];

  let resources = { Medical:10, Food:15, Water:20 };

  const map = L.map('map').setView([22.9734,78.6569],5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap'
  }).addTo(map);

  let markers = [];

  function renderAll(){
    renderTable();
    updateStats();
    updateResources();
    updateMap();
  }

  function getStatusBadge(status){
    let color = "";
    if(status === "Pending") color = "orange";
    else if(status === "Dispatched") color = "blue";
    else if(status === "Delivered") color = "green";

    return `<span style="
              color:white;
              background:${color};
              padding:5px 10px;
              border-radius:15px;
              font-size:0.85rem;
            ">${status}</span>`;
  }

  function renderTable(){
    const table = document.getElementById("tableBody");
    table.innerHTML = "";

    requests.forEach(req=>{
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${req.victimName}</td>
        <td>${req.state}</td>
        <td>${req.type}</td>
        <td>${getStatusBadge(req.status)}</td>
        <td>${req.status!=="Delivered" ? `<button onclick="nextStatus(${req.id})">Next</button>` : ""}</td>
      `;
      table.appendChild(row);
    });
  }

  // Deduct resource when DISPATCHED
  window.nextStatus = function(id){
    let req = requests.find(r=>r.id===id);

    if(req.status==="Pending"){
      if(resources[req.type] > 0){
        resources[req.type] -= 1;
        req.status="Dispatched";
      } else {
        alert("No resources available for " + req.type);
        return;
      }
    }
    else if(req.status==="Dispatched"){
      req.status="Delivered";
    }

    renderAll();
  }

  function updateStats(){
    document.getElementById("total").innerText = requests.length;
    document.getElementById("pending").innerText = requests.filter(r=>r.status==="Pending").length;
    document.getElementById("dispatched").innerText = requests.filter(r=>r.status==="Dispatched").length;
    document.getElementById("delivered").innerText = requests.filter(r=>r.status==="Delivered").length;
  }

  function updateResources(){
    const container = document.getElementById("resourceSection");
    container.innerHTML = "";

    Object.keys(resources).forEach(type=>{
      let card = document.createElement("div");
      card.className = "resource-card";
      let color = resources[type] <= 3 ? "red" : "green";

      card.innerHTML = `
        <h4>${type}</h4>
        <p style="color:${color}; font-weight:bold;">
          ${resources[type]} Available
        </p>
      `;
      container.appendChild(card);
    });
  }

  function updateMap(){
    markers.forEach(m=>map.removeLayer(m));
    markers=[];

    let heatPoints=[];

    requests.forEach(req=>{
      let color = req.status==="Delivered" ? "gray" :
                  req.status==="Dispatched" ? "blue" : "red";

      const marker = L.circleMarker([req.lat,req.lng],{
        radius:10,
        fillColor:color,
        color:color,
        fillOpacity:0.8
      }).addTo(map);

      marker.bindPopup(`${req.victimName} - ${req.type} - ${req.status}`);
      markers.push(marker);
      heatPoints.push([req.lat,req.lng,1]);
    });

    if(window.heatLayer) map.removeLayer(window.heatLayer);
    window.heatLayer = L.heatLayer(heatPoints,{radius:30}).addTo(map);
  }

  renderAll();
});