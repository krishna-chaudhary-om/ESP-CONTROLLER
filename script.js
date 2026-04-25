var heatOn=false,vibOn=false,temp=30,vibLevel=50,vibMode='MED',pulse=null;

// clock
setInterval(function(){
  document.getElementById('liveClock').textContent=new Date().toLocaleTimeString('en-GB');
},1000);

function espUrl(path){
  var host=window.location.hostname||'192.168.1.1';
  return 'http://'+host+path;
}

/* ALL YOUR JS EXACTLY SAME */