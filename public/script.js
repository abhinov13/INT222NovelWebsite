const socket = io("http://localhost:5000");
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const buttonpos = document.getElementById('buttonpos');

const name = localStorage.getItem('username');
console.log(name);
var i = 0;
var pageURL = "" + window.location.href;
pageURL = pageURL.slice("http://localhost:5000/".length,pageURL.length);
console.log(pageURL);
while (pageURL.charAt(i) != '_') {
  i++;
}
var chapter = parseInt(pageURL.slice(i + 1, pageURL.length));

socket.emit('pageloaded',chapter);
socket.emit('newuser', name);
socket.emit('loadComments',chapter);


socket.on('dataLoaded', data => {
  var novelTitle = document.getElementById('pageTitle');
  var novelText = document.getElementById('novelContent');

  novelTitle.innerHTML = `The Beginning after the End<br> Chapter ${chapter}`;
  novelText.innerHTML = '<pre>' + data + '</pre>';
  if(chapter == 1)
  {
    buttonpos.innerHTML = `<a href="http://localhost:5000/novel_2"><button id="chapbutton">next</button></a>`;
  }
  else{
    buttonpos.innerHTML = `<a href="http://localhost:5000/novel_1"><button id="chapbutton">prev</button></a>`;
  }
});

socket.on('sendComments', result => {
  for (var i = 0; i < result.length; i++) {
    appendMessage(result[i].comment);
  }
})


socket.on('commentmessage', data => {
  appendMessage(`${data.name}: ${data.message}`);
})

messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message == "")
    return;
  appendMessage(`${name}: ${message}`);
  socket.emit('sendcomment', {chapter_: chapter,message_: message});
  messageInput.value = '';
})

function appendMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.innerText = message;
  messageContainer.append(messageElement);
}