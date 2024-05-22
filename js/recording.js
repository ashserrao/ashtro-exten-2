// variables =============================================
const recStatus = document.getElementById("rec-status");
let screenRecorder = null;
let webcamRecorder = null;
// the following variables are getting auto fetched from background.js=====
let examMode = "online";
let examStatus = "exam-completed";

// Open IndexedDB database==================================
let db;
const request = window.indexedDB.open("RecordingsDB", 1);

request.onerror = function (event) {
  console.error("IndexedDB error:", event.target.errorCode);
};

request.onsuccess = function (event) {
  db = event.target.result;
};

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("recordings", { autoIncrement: true });
};

function onAccessApproved(screenStream, webcamStream) {
  screenRecorder = new MediaRecorder(screenStream);
  webcamRecorder = new MediaRecorder(webcamStream);

  recStatus.innerText = "You are being recorded";
  console.log("You are being recorded");
  screenRecorder.start();
  webcamRecorder.start();

  const blobs = {
    screen: [],
    webcam: [],
  };

  screenRecorder.ondataavailable = function (event) {
    blobs.screen.push(event.data);
  };

  webcamRecorder.ondataavailable = function (event) {
    blobs.webcam.push(event.data);
  };

  // stopping the video tracks==========================================
  screenRecorder.onstop = function () {
    if (battFlagStatus === false && examStatus === "exam-ongoing") {
      screenStream.getTracks().forEach(function (track) {
        recStatus.innerText = "Recording stopped";
        if (track.readyState === "live") {
          track.stop();
        }
      });
      saveRecording(blobs.screen, `screen-recording-${Date.now()}.webm`);
    } else if (battFlagStatus === true && examStatus === "exam-ongoing") {
      saveRecording(blobs.screen, `backup-screen-recording-${Date.now()}.webm`);
      blobs.screen = [];
    } else {
      console.log("exception error");
    }
  };

  webcamRecorder.onstop = function () {
    if (battFlagStatus === false && examStatus === "exam-ongoing") {
      webcamStream.getTracks().forEach(function (track) {
        if (track.readyState === "live") {
          track.stop();
        }
      });
      saveRecording(blobs.webcam, `webcam-recording-${Date.now()}.webm`);
      battFlagStatus = false;
    } else if (battFlagStatus === true && examStatus === "exam-ongoing") {
      saveRecording(blobs.webcam, `backup-webcam-recording-${Date.now()}.webm`);
      blobs.webcam = [];
    } else {
      console.log("exception error");
    }
  };
}

// saving video function ===================================================
function saveRecording(dataArray, filename) {
  const transaction = db.transaction(["recordings"], "readwrite");
  const objectStore = transaction.objectStore("recordings");
  const blob = new Blob(dataArray, { type: dataArray[0].type });

  // Construct an object that includes the blob data and filename
  const recordingData = {
    blob: blob,
    filename: filename,
  };

  transaction.onerror = function (event) {
    console.error("Error in transaction:", event);
  };

  // Add the recording data to the object store
  const request = objectStore.add(recordingData);

  request.onerror = function (event) {
    console.error(
      "Error saving file to IndexedDB:",
      event.target.errorCode
    );
  };

  request.onsuccess = function (event) {
    console.log("File saved to IndexedDB:", filename);
  };
}

//Dom content loader ====================================================
document.addEventListener("DOMContentLoaded", () => {
  // Getting selectors of the buttons======================================
  const startVideoButton = document.querySelector("button#exam-continue");
  const stopVideoButton = document.querySelector("button#exam-stop");
  const playPauseButton = document.querySelector("button#exam-pause-play");

  // getting exam status data==========================================
  function getExamStatus() {
    let message = {
      info: "videoStatus",
    };

    chrome.runtime.sendMessage(message, (response) => {
      examMode = `${response.mode_of_exam}`;
      examStatus = `${response.exam_status}`;
    });
  }

  //battery status info ============================================
  function genVideoBackup() {
    // console.log("backup func from rec.js");
    let message = {
      info: "generate videoBackup",
    };
    chrome.runtime.sendMessage(message, (response) => {
      response;
      // console.log("signal generated!!!", response);
      if (response === true) {
        console.log("backup generated!!!");
        playPauseVideo();
      }
      // console.log("video backup request:", response);
    });
  }

  //video starting function====================================================
  function startVideoFunc() {
    if (examMode === "offline" && examStatus === "exam-ongoing") {
      console.log("requesting recording");
      navigator.mediaDevices
        .getDisplayMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            channelCount: 2, // Enable stereo audio
          },
          video: {
            width: 999999999,
            height: 999999999,
            displaySurface: "monitor",
          },
        })
        .then((screenStream) => {
          // Now, get user media for webcam
          navigator.mediaDevices
            .getUserMedia({
              video: true,
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                channelCount: 2, // Enable stereo audio
              },
            })
            .then((webcamStream) => {
              // Pass both streams to onAccessApproved
              onAccessApproved(screenStream, webcamStream);
              //Recording source details
              setTimeout(() => {
                console.log(
                  screenStream.getVideoTracks()[0].getSettings().displaySurface
                );
                console.log(
                  `screen share audio: ${screenStream.getAudioTracks().length}`
                );
                console.log(
                  `webcam share audio: ${webcamStream.getAudioTracks().length}`
                );
              }, 2000);
            })
            .catch((error) => {
              console.error("Error accessing webcam", error);
            });
        })
        .catch((error) => {
          console.error("Error starting the video", error);
        });
    } else {
      console.log("exam is not started or exam state is online");
    }
  }

  //video backup function ============================================
  function playPauseVideo() {
    battFlagStatus = true;
    console.log("stopping video");
    if (!screenRecorder || !webcamRecorder) return console.log("no recording");
    screenRecorder.stop();
    webcamRecorder.stop();

    // video backup auto Flag =================================
    let message = {
      info: "video Flag",
      msg: "Flagging video partition and backup.",
    };
    chrome.runtime.sendMessage(message, (response) => {
      console.log("video message trigger");
      console.log("response from background.js", response);
    });

    setTimeout(() => {
      screenRecorder.start();
      webcamRecorder.start();
      backupStatus = true;
    }, 1000);
  }

  //Stop video trigger ============================================
  function stopVideoFunc() {
    battFlagStatus = false;
    // console.log("stopping video");
    if (!screenRecorder || !webcamRecorder) {
      let message = {
        info: "no video",
        msg: "No video recording to stop.",
      };
      chrome.runtime.sendMessage(message, (response) => {
        console.log(response);
      });
      return console.log("no recording");
    }
    screenRecorder.stop();
    webcamRecorder.stop();
  }

  //video onclick function trigger============================================
  playPauseButton.addEventListener("click", () => {
    playPauseVideo();
  });

  startVideoButton.addEventListener("click", () => {
    startVideoFunc();
  });

  stopVideoButton.addEventListener("click", () => {
    stopVideoFunc();
  });

  // Rec trigger =============================================
  window.addEventListener("load", () => {
    setTimeout(() => {
      startVideoFunc();
    }, 2000);
  });

  //Display list of items =======================================
  const recordingList = document.getElementById("recording-list");
  const selectedDownloads = []; // Array to store selected download links
  const allDownloadedLinks = [];

  function displayRecordings() {
    const transaction = db.transaction(["recordings"], "readonly");
    const objectStore = transaction.objectStore("recordings");
    const request = objectStore.getAll();

    request.onerror = function (event) {
      console.error("Error fetching recordings:", event.target.errorCode);
    };

    request.onsuccess = function (event) {
      const recordings = event.target.result;
      recordingList.innerHTML = ""; // Clear previous recordings

      if (recordings.length === 0) {
        const noRecordingsMessage = document.createElement("li");
        noRecordingsMessage.innerText = "No recordings found.";
        recordingList.appendChild(noRecordingsMessage);
      } else {
        recordings.forEach(function (recording, index) {
          const recordingItem = document.createElement("li");
          const downloadLink = document.createElement("a");
          const checkbox = document.createElement("input");
          const horizonLine = document.createElement("hr");

          downloadLink.href = URL.createObjectURL(recording.blob); // Use blob data
          downloadLink.download = `${recording.filename}.webm`; // Use filename
          downloadLink.innerText = `${index + 1}-${recording.filename}`; // Display filename
          allDownloadedLinks.push(downloadLink.href);

          checkbox.type = "checkbox";
          checkbox.addEventListener("change", function () {
            if (checkbox.checked) {
              selectedDownloads.push(downloadLink.href);
            } else {
              const indexToRemove = selectedDownloads.indexOf(
                downloadLink.href
              );
              if (indexToRemove !== -1) {
                selectedDownloads.splice(indexToRemove, 1);
              }
            }
          });

          // recordingItem.appendChild(checkbox);
          recordingItem.appendChild(downloadLink);
          recordingList.appendChild(recordingItem);
          recordingList.appendChild(horizonLine);
        });
      }
    };
  }

  // Display recordings when DOM is loaded
  setInterval(() => {
    displayRecordings();
    genVideoBackup();
    getExamStatus();
  }, 2000);

  //Put it in the end of exam
  // clearInterval(runner);
});
