// get elements from the page
const start = document.getElementById('start');
const stop = document.getElementById('stop');
const statusDisplay = document.getElementById('status');
const updates = document.getElementById('updates-list');
const count = document.getElementById('update-count');

let eventSource = null;
let counter = 0;

start.addEventListener('click', startStream);
stop.addEventListener('click', stopStream);

function startStream() {
    
    // clear previous data
    updates.innerHTML = '';
    counter = 0;
    count.textContent = `(${counter})`;
    
    start.disabled = true;
    stop.disabled = false;
    statusDisplay.textContent = 'connecting...';
    
    // connect to Wikipedia API
    eventSource = new EventSource('https://stream.wikimedia.org/v2/stream/recentchange');
    
    // open the connection
    eventSource.onopen = function() {
        statusDisplay.textContent = 'connected';
        statusDisplay.classList.add('connected');
    };
    
    // receiving data
    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);
        processUpdate(data);
    };
    
    // handle errors
    eventSource.onerror = function() {
        statusDisplay.textContent = 'error';
        statusDisplay.classList.remove('connected');
    };
}

function stopStream() {

    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
    
   
    start.disabled = false;
    stop.disabled = true;
    statusDisplay.textContent = 'disconnected';
    statusDisplay.classList.remove('connected');
}


function processUpdate(data) {
   
    // filtering only the edits
    if (data.type !== 'edit' || !data.title || data.wiki !== 'enwiki' || data.bot === true) {
        return;
    }
    
    // create a new element
    const updateEl = document.createElement('div');
    updateEl.className = 'update-item';
    
    // get the data we want to show
    const title = data.title;
    const user = data.user || 'Anonymous';
    const timestamp = new Date(data.meta.dt).toLocaleTimeString();
    
    // add the HTML
    updateEl.innerHTML = `
        <h3>${title}</h3>
        <p>edited by ${user} at ${timestamp}</p>
    `;
    
    // add to the page
    updates.prepend(updateEl);
    counter++;
    count.textContent = `(${counter})`;
}
