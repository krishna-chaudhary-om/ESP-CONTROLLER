let ESP_IP = "";

function connectESP() {
  ESP_IP = document.getElementById("espIp").value;
  alert("Connected to " + ESP_IP);
}

function espUrl(path){
  return "http://" + ESP_IP + path;
}
