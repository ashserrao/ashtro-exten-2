//Redirect to profile page ========================
const profileIconButton = document.getElementById("profile");

profileIconButton.onclick = function () {
  window.location = "profile.html";
};

const cardClick = document.getElementById("clickcard");

cardClick.onclick = redirect;

//redirect function=====================
function redirect() {
  chrome.windows.create({
    url: "chrome-extension://" + chrome.runtime.id + "/device.html",
    type: "popup",
    width: 690,
    height: 750,
  });
}

//  Checking for WebRTC compatiblity in the browser ========================
const rtcStat = document.getElementById("RTC-stat");

var webrtcDetectedVersion = null;
var webrtcDetectedBrowser = null;
window.requestFileSystem =
  window.requestFileSystem || window.webkitRequestFileSystem;

function initWebRTCAdapter() {
  if (navigator.mozGetUserMedia) {
    webrtcDetectedBrowser = "firefox";
    webrtcDetectedVersion = parseInt(
      navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1],
      10
    );

    RTCPeerConnection = mozRTCPeerConnection;
    RTCSessionDescription = mozRTCSessionDescription;
    RTCIceCandidate = mozRTCIceCandidate;
    getUserMedia = navigator.mozGetUserMedia.bind(navigator);
    attachMediaStream = function (element, stream) {
      element.mozSrcObject = stream;
      element.play();
    };

    reattachMediaStream = function (to, from) {
      to.mozSrcObject = from.mozSrcObject;
      to.play();
    };

    MediaStream.prototype.getVideoTracks = function () {
      return [];
    };

    MediaStream.prototype.getAudioTracks = function () {
      return [];
    };
    return true;
  } else if (navigator.webkitGetUserMedia) {
    webrtcDetectedBrowser = "chrome";
    webrtcDetectedVersion = parseInt(
      navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2],
      10
    );

    RTCPeerConnection = webkitRTCPeerConnection;
    getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
    attachMediaStream = function (element, stream) {
      element.src = webkitURL.createObjectURL(stream);
    };

    reattachMediaStream = function (to, from) {
      to.src = from.src;
    };

    if (!webkitMediaStream.prototype.getVideoTracks) {
      webkitMediaStream.prototype.getVideoTracks = function () {
        return this.videoTracks;
      };
      webkitMediaStream.prototype.getAudioTracks = function () {
        return this.audioTracks;
      };
    }

    if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
      webkitRTCPeerConnection.prototype.getLocalStreams = function () {
        return this.localStreams;
      };
      webkitRTCPeerConnection.prototype.getRemoteStreams = function () {
        return this.remoteStreams;
      };
    }
    return true;
  } else return false;
}

// Trigger for WebRTC compatiblity========================
function checkWebRTC() {
  var isCompatible = initWebRTCAdapter();
  if (isCompatible) {
    rtcStat.innerText = "Compatible";
    document.getElementById("RTC-req").src = "/assets/loaded.svg";
  } else {
    rtcStat.innerText = "Not Compatible";
    document.getElementById("RTC-req").src = "/assets/cross_mark.svg";
  }
}

setInterval(() => {
  checkWebRTC();
}, 5000);
