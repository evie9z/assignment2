
'use strict';

var imgString = null;
var imgKeyString = null;
var key = [];
var keyResult = "";
var faces = [];
var isFace = true;
var foundFace = false;
var foundKey = false;
var keyImgWidth = 425/2;
var keyImgHeight = 668/2;
var keyX = 425/2;
var keyY = 26;
var newMag = 0;
var newScore = 0;
var isWelcomedFace = true;
var isWelcomedKey = true;

// Make the robot talk with user
var grammar =
  "#JSGF V1.0; grammar emar; public <greeting> = hello | hi; <person> = maya | alisa;";
var recognition = new window.webkitSpeechRecognition();
var speechRecognitionList = new window.webkitSpeechGrammarList();
var qList = ["Hi, how are you today?", "What do you think of GIX building?", "How's your study?"];
var posResponseList = ["Good!","Cool","Great!"];
var negResponseList = ["Oops","That sucks","Sad:("];
var neuResponseList = ["Hmmmm....","I see","Yeah..."];
var index = 0;

speechRecognitionList.addFromString(grammar, 1);
recognition.grammars = speechRecognitionList;
recognition.continuous = true;
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;

//Make the robot blink
function blink(){

  var pupil1=document.getElementById("pupil1");
  var pupil2=document.getElementById("pupil2");
  pupil1.animate([
              { ry: 2 },
              { ry: 0.1},
              { ry: 2 }
          ], 200); 
  
  pupil2.animate([
              { ry: 2 },
              { ry: 0.1},
              { ry: 2 }
          ], 200); 
}

(function loop() {
    var rand = Math.random() * 5000;
    setTimeout(function() {
            blink();
            loop();  
    }, rand);
}());

// This function enables speech recognition
function startRecognition() {
  var textDiv = document.getElementById("robotSpeech");
  textDiv.innerHTML = qList[index];
  index++;
  if (index>2){
    index = 0;
  }
  recognition.start();
};

recognition.onresult = processSpeech;

function processSpeech(event) {
  console.log("on result event triggered.");
  var inputSpeech = event.results[0][0].transcript;
  var textDiv = document.getElementById("robotSpeech");
  textDiv.innerHTML = "You said: " + inputSpeech;

  sentimentAnalysis(inputSpeech);
}

recognition.onend = recognitionEnded;

function recognitionEnded() {
  console.log("onend happened");
  recognition.stop();
}

/*Function that makes the browser speak a text in a given language*/
function speak(text, lang) {

  if ('speechSynthesis' in window) {
    var msg = new SpeechSynthesisUtterance();
    var voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      msg.voice = voices.filter(function(voice) { return voice.lang == lang; })[1];
    }
    msg.voiceURI = 'native';
    msg.volume = 0.8; // 0 to 1
    msg.rate = 0.6; // 0.1 to 10
    msg.pitch = 0.6; //0 to 2
    msg.text = text;
    msg.lang = lang;
    speechSynthesis.speak(msg);
  }
}


// SWITCH TO DIFFERENT FUNCTION
// IMPORTANT !!
document.addEventListener('DOMContentLoaded', function () {
  var checkbox = document.querySelector('input[type="checkbox"]');
  checkbox.addEventListener('change', function () {
    isFace = !checkbox.checked;
  });
});

/* This function checks and sets up the camera */
function startVideo() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(handleUserMediaSuccess);
  }
  recognition.stop();
  var textDiv = document.getElementById("robotSpeech");
  textDiv.innerHTML = "You can choose to let me recognize your face or the key";

}

/* This function initiates the camera video */
function handleUserMediaSuccess(stream) {
  var video = document.getElementById("myVideo");
  try {
    video.srcObject = stream;
  } catch (error) {
    video.src = URL.createObjectURL(stream);
  }
  video.play();

  /* We will capture an image twice every second */
  window.setInterval(captureImageFromVideo, 500);
}

function detectFace() {
  // Use the following if you are testing locally

  var serviceURL = "http://127.0.0.1:8080/";
  var request = {image: imgString};
  if (imgString != null)
    ajaxRequest("POST", serviceURL,
      handleResponse, JSON.stringify(request));
  else
    console.log("An image has not yet been captured.");
}

function detectKey() {
  // Use the following if you are testing locally

  var serviceURL = "http://127.0.0.1:8080/key";
  var request = {image: imgKeyString};
  if (imgKeyString != null)
    ajaxRequest("POST", serviceURL,
      handleResponseKey, JSON.stringify(request));
  else
    console.log("An image has not yet been captured.");
}

function handleResponseKey() {
  if (successfulRequest(this)) {
    key = JSON.parse(this.responseText);
    try {
      keyResult = key[0].labels;
    } catch (error) {
      keyResult = "Pending Input";
    }
  }
}

function handleResponse() {
  if (successfulRequest(this)) {
    faces = JSON.parse(this.responseText);
  }
}

/*Helper function: sends an XMLHTTP request*/
function ajaxRequest(method, url, handlerFunction, content) {
  var xhttp = new XMLHttpRequest();
  xhttp.open(method, url);
  xhttp.onreadystatechange = handlerFunction;
  if (method == "POST") {
    xhttp.send(content);
  }
  else {
    xhttp.send();
  }
}

/*Helper function: checks if the response to the request is ready to process*/
function successfulRequest(request) {
  return request.readyState === 4 && request.status == 200;
}


/* This function captures the video */
function captureImageFromVideo() {
  
  var canvas = document.getElementById("mainCanvas");
  var context = canvas.getContext("2d");
  var video = document.getElementById("myVideo");
  var textDiv = document.getElementById("robotSpeech");

  if (isFace) {

    canvas.setAttribute("width", video.width);
    canvas.setAttribute("height", video.height);
    context.drawImage(video, 0, 0, video.width, video.height);
  
    imgString = canvas.toDataURL();
    context.strokeStyle = "#0F0";
  
  
    if (faces.length > 0) {
      let authenticated = false;
      for (var i=0; i<faces.length; i++) {
        if (!authenticated || !foundFace) {
          foundFace = (faces[i].name == "Evie") || (faces[i].name == "Zoff");
          if (foundFace) {
            var text = "Hi " + faces[i].name + ", welcome home!";
            textDiv.innerHTML = text;
            if (isWelcomedFace) {
              speak(text, 'en-US');
              isWelcomedFace = false;
            }
          }
          authenticated = foundFace;
        }
        var textX = faces[i].x + (faces[i].w)/2;
        var textY = faces[i].y + faces[i].h
        context.rect(faces[i].x,faces[i].y,faces[i].w,faces[i].h);
        context.fillText(faces[i].name,textX,textY);
        context.stroke();
      }
    }

    detectFace();

  } else {

    canvas.setAttribute("width", video.width);
    canvas.setAttribute("height", video.height);
    context.drawImage(video, 0, 0, video.width, video.height);

    var hidden_canv = document.createElement('canvas');
    hidden_canv.style.display = 'none';
    document.body.appendChild(hidden_canv);
    hidden_canv.width = keyImgWidth;
    hidden_canv.height = keyImgHeight;

    //Draw the data you want to download to the hidden canvas
    var hidden_ctx = hidden_canv.getContext('2d');
    hidden_ctx.drawImage(
        canvas, 
        keyX,//Start Clipping
        keyY,//Start Clipping
        keyImgWidth,//Clipping Width
        keyImgHeight,//Clipping Height
        0,//Place X
        0,//Place Y
        hidden_canv.width,//Place Width
        hidden_canv.height//Place Height
    );

    imgKeyString = hidden_canv.toDataURL();
    
    context.strokeStyle = "#0F0";
    context.rect(keyX, keyY, keyImgWidth, keyImgHeight);
    context.fillText(keyResult,keyX,keyY);
    context.stroke();

    detectKey();
    foundKey = (keyResult == "rightKey");
  }

  facialExpression();
}

function facialExpression(){
  if (isFace) {
    if (foundFace) {
      console.log("isFace: " + isFace + ", foundFace=");
      laugh();
    } else {
      smile();
    }
    
  } else {
    if (foundKey) {
      laugh();
      welcomeHome();
    } else {
      smile();
    }

  }
}

function laugh() {
  var faceDiv = document.getElementById("faceSVG3");
  var htmlString = "<svg id='faceSVG3' viewBox='0 0 500 500' >" +
                   "<path d='M 170 30 q 80 50 160 0' stroke='#c2c2d6' stroke-width='1' fill='#c2c2d6' />" +
                   "<ellipse cx='20%' cy='5%' rx=60 ry=15 fill='#ffe6e6'> </ellipse>" +
                   "<ellipse cx='80%' cy='5%' rx=60 ry=15 fill='#ffe6e6'> </ellipse> </svg>";
  faceDiv.innerHTML = htmlString;
}

function smile() {
  var faceDiv = document.getElementById("faceSVG3");
  var htmlString = "<svg id='faceSVG3' viewBox='0 0 500 500' >" +
                   "<path d='M 170 30 q 80 50 160 0' stroke='#c2c2d6' stroke-width='5' fill='none' /> </svg>";
                  //  "<ellipse cx='20%' cy='5%' rx=60 ry=15 fill='#ffe6e6'> </ellipse>" +
                  //  "<ellipse cx='80%' cy='5%' rx=60 ry=15 fill='#ffe6e6'> </ellipse> </svg>";
  faceDiv.innerHTML = htmlString;
}

function sad() {
  var faceDiv = document.getElementById("faceSVG3");
  var htmlString = "<svg id='faceSVG3' viewBox='0 0 500 500' >" +
                   "<path d='M 170 50 q 80 -30 160 0' stroke='#c2c2d6' stroke-width='5' fill='none' />"
                    "<ellipse cx='20%' cy='5%' rx=60 ry=15 fill='#ffe6e6'> </ellipse>" +
                    "<ellipse cx='80%' cy='5%' rx=60 ry=15 fill='#ffe6e6'> </ellipse> </svg>";
  faceDiv.innerHTML = htmlString;
}

function welcomeHome(event) {
  var textDiv = document.getElementById("robotSpeech");
  var text = "The door is already open!";
  textDiv.innerHTML = text;
  if (isWelcomedKey) {
    speak(text, 'en-US');
    isWelcomedKey = false;
  }
}

// Sentiment analysis function
function sentimentAnalysis(text) {
  // The base URL of Google Natural Language Understanding API
  var baseUrl = "https://language.googleapis.com/v1/documents:analyzeSentiment"
  
  // API Key
  var mayasAPIKey = "AIzaSyBttL3_rUfMaP8vZQazT8bCd5XhHkmR4lA";
  var url = baseUrl + "?key=" + mayasAPIKey;
  
  // Establish the XMLHttp request
  var request = {
    document: {
      type: "PLAIN_TEXT",
      content: text
    },
    encodingType: "UTF16",
  }; 

  ajaxRequest("POST", url, handleSentimentResponse, JSON.stringify(request));

}

// This function is to handle the response gotten from the API
function handleSentimentResponse() {
  if (successfulRequest(this)) {
    
    // Get the response from the API
    var response = JSON.parse(this.responseText);
    newMag = response["documentSentiment"]["magnitude"];
    newScore = response["documentSentiment"]["score"];

    var randomNum = Math.floor(Math.random() * 3);
    var textDiv = document.getElementById("robotSpeech");
    try {
      console.log("newMag: " + newMag + ", newScore: " + newScore);
      if (newMag>0 && newScore>0.1) {    
        var text = posResponseList [randomNum];
        console.log(text);
        textDiv.innerHTML += "<br>Avo said: " + text;
        speak(text, 'en-US');
        laugh();
      }
      else if (newMag>0 && newScore<-0.1) {
        var text = negResponseList [randomNum];
        textDiv.innerHTML += "<br>Avo said: " + text;
        speak(text, 'en-US');
        sad();
      }
      else {
        var text = neuResponseList [randomNum];
        textDiv.innerHTML += "<br>Avo said: " + text;
        speak(text, 'en-US');
        smile();
      }
    } catch (error) {
      smile();
    }
    recognition.stop();
    setTimeout(startRecognition, 3000);
  }
}

/*Helper function: checks if the response to the request is ready to process*/
function successfulRequest(request) {
  return request.readyState === 4 && request.status == 200;
}
