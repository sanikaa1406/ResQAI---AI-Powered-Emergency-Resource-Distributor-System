console.log('user.js loaded!');

// Select elements
const helpForm = document.getElementById('helpForm');
const descriptionInput = document.getElementById('description');
const locationInput = document.getElementById('locationInput');
const contactInput = document.getElementById('contact');
const statusMsg = document.getElementById('statusMsg');
let selectedHelpType = null;

// ================= MAP INITIALIZATION =================
const map = L.map('map').setView([20.5937, 78.9629], 5); // Default: India view

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let marker = null;

// Click on map to select location
map.on('click', function(e) {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);
    
    locationInput.value = `${lat}, ${lng}`;
    
    // Add or move marker
    if (marker) {
        marker.setLatLng(e.latlng);
    } else {
        marker = L.marker(e.latlng).addTo(map);
    }
});

// ================= LIVE LOCATION =================
document.getElementById('liveLocationBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
        statusMsg.classList.remove('hidden');
        statusMsg.textContent = '📍 Getting your location...';
        
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            locationInput.value = `${lat}, ${lng}`;
            
            // Center map on user location
            map.setView([lat, lng], 14);
            
            // Add marker
            if (marker) {
                marker.setLatLng([lat, lng]);
            } else {
                marker = L.marker([lat, lng]).addTo(map);
            }
            
            statusMsg.textContent = '✅ Location found!';
            setTimeout(() => statusMsg.classList.add('hidden'), 3000);
            
        }, (error) => {
            statusMsg.textContent = '❌ Could not get location. Please enable GPS.';
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
});

// ================= FORM HANDLING =================

// Handle selecting help type
document.querySelectorAll('.option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        selectedHelpType = option.dataset.type;
    });
});

// Handle form submission
helpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedHelpType) {
        alert('Please select a help type.');
        return;
    }

    if (!locationInput.value) {
        alert('Please select a location.');
        return;
    }

    const requestData = {
        description: descriptionInput.value,
        location: locationInput.value,
        contact: contactInput.value,
        type: selectedHelpType,
        severity: 3 
    };

    try {
        const response = await fetch('http://localhost:3000/submit-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();

        // Show result to user
        statusMsg.classList.remove('hidden');
        statusMsg.style.background = '#d4edda';
        statusMsg.style.color = '#155724';
        statusMsg.innerHTML = `
            ✅ Request Submitted!<br>
            Emergency Score: ${result.emergencyScore}<br>
            Priority: ${result.priority}<br>
            Assigned Team: ${result.assignedTeam}
        `;

        // Reset form
        helpForm.reset();
        document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
        selectedHelpType = null;
        
        if (marker) {
            map.removeLayer(marker);
            marker = null;
        }

    } catch (error) {
        console.error(error);
        statusMsg.classList.remove('hidden');
        statusMsg.style.background = '#f8d7da';
        statusMsg.style.color = '#721c24';
        statusMsg.textContent = '❌ Failed to submit. Is the server running?';
    }
});