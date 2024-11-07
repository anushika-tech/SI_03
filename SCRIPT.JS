const editor = document.getElementById('editor');
const presenceIndicators = document.getElementById('presence-indicators');
const commentSection = document.getElementById('comment-section');
const notificationPanel = document.getElementById('notification-panel');

let ws, userColor, userId, userName;
let notifications = [];

window.onload = () => {
  userId = generateUserId();
  userColor = generateUserColor();
  userName = prompt("Enter your name:", "User " + userId);

  ws = new WebSocket('ws://localhost:8080');
  
  ws.onopen = () => {
    addNotification(`Connected as ${userName}`);
    ws.send(JSON.stringify({ type: 'join', userId, userName, userColor }));
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'update') {
      editor.innerHTML = message.content;
      highlightUserText(message.userId);
    } else if (message.type === 'presence') {
      updatePresence(message.users);
    } else if (message.type === 'comment') {
      displayComment(message);
    } else if (message.type === 'cursor') {
      updateCursor(message);
    } else if (message.type === 'notification') {
      addNotification(message.text);
    }
  };
};

editor.addEventListener('input', () => {
  const content = editor.innerHTML;
  ws.send(JSON.stringify({ type: 'update', content, userId }));
});

editor.addEventListener('mouseup', () => {
  const cursorPosition = window.getSelection().anchorOffset;
  ws.send(JSON.stringify({ type: 'cursor', userId, cursorPosition }));
});

function undo() {
  document.execCommand('undo');
}

function redo() {
  document.execCommand('redo');
}

function addComment() {
  const selection = window.getSelection();
  if (selection.toString()) {
    const commentText = prompt("Enter your comment:");
    const timestamp = new Date().toLocaleTimeString();
    ws.send(JSON.stringify({ type: 'comment', text: commentText, selection: selection.toString(), userId, timestamp }));
  }
}

function showHistory() {
  alert("This feature is under development.");
}

function updatePresence(users) {
  presenceIndicators.innerHTML = `Users online: ${users.map(u => `<span style="color: ${u.color};">${u.name}</span>`).join(', ')}`;
}

function displayComment(comment) {
  const commentDiv = document.createElement('div');
  commentDiv.className = 'comment';
  commentDiv.style.borderLeft = `4px solid ${comment.userColor}`;
  commentDiv.innerHTML = `<span class="username" style="color:${comment.userColor}">${comment.userName}</span>: <span class="text">${comment.text}</span> <span class="timestamp">(${comment.timestamp})</span>`;
  commentSection.appendChild(commentDiv);
}

function updateCursor({ userId, cursorPosition }) {
  // Logic to show floating cursor with username, colored to match user
  const cursorIndicator = document.createElement('div');
  cursorIndicator.className = 'user-cursor';
  cursorIndicator.style.left = `${cursorPosition}px`;
  cursorIndicator.style.backgroundColor = userColor;
  editor.appendChild(cursorIndicator);
}

function addNotification(message) {
  notifications.push(message);
  notificationPanel.innerHTML = notifications.slice(-5).map(text => `<div class="notification">${text}</div>`).join('');
  notificationPanel.style.display = "block";
  setTimeout(() => { notificationPanel.style.display = "none"; }, 5000);
}

function generateUserId() {
  return Math.floor(Math.random() * 10000);
}

function generateUserColor() {
  const colors = ["#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function highlightUserText(userId) {
  // Temporarily highlight new text entries by each user in their respective color
  editor.style.backgroundColor = userColor;
  setTimeout(() => editor.style.backgroundColor = '', 1000);
}
