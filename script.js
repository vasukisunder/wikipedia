// get elements from the page
const start = document.getElementById('start');
const stop = document.getElementById('stop');
const statusDisplay = document.getElementById('status');
const updates = document.getElementById('updates-list');
const count = document.getElementById('update-count');

let eventSource = null;
let counter = 0;
const topics = {
  science: ['physics', 'chemistry', 'biology', 'astronomy', 'science', 'scientific', 'researcher', 'discovery'],
  tech: ['computer', 'software', 'technology', 'programming', 'digital', 'internet', 'web', 'app', 'device'],
  entertainment: ['movie', 'film', 'actor', 'actress', 'singer', 'music', 'television', 'tv', 'celebrity', 'game'],
  sports: ['football', 'soccer', 'baseball', 'basketball', 'sport', 'athlete', 'olympics', 'player', 'tournament'],
  politics: ['politic', 'president', 'government', 'election', 'minister', 'party', 'senate', 'congress', 'vote']
};

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
    
    // create Wikipedia URLs
    const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
    const diffUrl = `https://en.wikipedia.org/w/index.php?diff=${data.revision.new}&oldid=${data.revision.old}`;
    const userUrl = `https://en.wikipedia.org/wiki/User:${encodeURIComponent(user)}`;
    
    // format change size with + or - and commas
    let changeSize = data.length.new - data.length.old;
    let changeSizeFormatted = (changeSize > 0 ? '+' : '') + changeSize.toLocaleString();
    let changeSizeClass = changeSize > 0 ? 'positive-change' : (changeSize < 0 ? 'negative-change' : 'no-change');
    
    // get edit summary/comment
    const comment = data.comment || 'No summary provided';
    
    // check if it's a new page
    const isNewPage = data.revision.old === 0;
    
    const detectedTopic = detectTopic(title, comment);
    
    // add the HTML
    updateEl.innerHTML = `
        <h3>
            <a href="${wikiUrl}" target="_blank">${title}</a>
            <span class="topic-badge topic-${detectedTopic}">${detectedTopic}</span>
            ${isNewPage ? '🌟' : ''}
        </h3>
        <p class="edit-details">
            edited by <a href="${userUrl}" target="_blank">${user}</a> at ${timestamp}
        </p>
        <p class="edit-stats">
            <span class="${changeSizeClass}">${changeSizeFormatted} bytes</span>
            <a href="${diffUrl}" target="_blank" class="view-changes">view diff</a>
        </p>
        <p class="edit-summary">${comment ? `"${comment}"` : ''}</p>
    `;
    
    // add to the page
    updates.prepend(updateEl);
    counter++;
    count.textContent = `(${counter})`;
}

function detectTopic(title, comment) {
    const text = (title + ' ' + comment).toLowerCase();
    for (const [topic, keywords] of Object.entries(topics)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return topic;
        }
    }
    return 'other';
}

