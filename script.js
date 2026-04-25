function connectESP() {
  ESP_IP = document.getElementById("espIp").value;
  localStorage.setItem("esp_ip", ESP_IP);
}

window.onload = function(){
  let saved = localStorage.getItem("esp_ip");
  if(saved){
    ESP_IP = saved;
    document.getElementById("espIp").value = saved;
  }
}
