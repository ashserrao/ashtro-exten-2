console.log("background.js is working");
// variables =============================
let candidateDetails;
let loginStatus = false;
let e_Status = "exam-completed";
let examMode = "offline";

let videoBackupRequest = false;

let allowedUrls = [
  "chrome://",
  "edge://",
  "examroom.ai",
  "chrome-extension://",
];

let Flags = [];

//
//
// on extension installation ======================
chrome.runtime.onInstalled.addListener(() => {
  // chrome.tabs.create({ url: "https://www.examroom.ai" });
  chrome.tabs.query({ currentWindow: true }, (allTabs) => {
    allTabs.forEach((tab) => {
      const tabUrl = tab.url;
      if (!allowedUrls.some((allowedurl) => tabUrl.includes(allowedurl))) {
        if (loginStatus === true) {
          // chrome.tabs.remove(tab.id);
          console.log(tab.id);
        }
      } else {
        chrome.tabs.reload(tab.id);
      }
    });
  });
});

// when candidate opens new tab ===================
chrome.tabs.onUpdated.addListener(() => {
  if (loginStatus === true && e_Status === "exam-ongoing") {
    chrome.tabs.query({ currentWindow: true }, (allTabs) => {
      allTabs.forEach((tab) => {
        if (!allowedUrls.some((allowedurl) => tab.url.includes(allowedurl))) {
          console.log(tab.url);
        }
      });
    });
  } else {
    console.log("Exam is not running");
  }
});

// messsages listener ==================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.info === "prime-data") {
    let response = {
      l_status: loginStatus,
      examStatus: e_Status,
    };
    sendResponse(response);
    getCandyDetails();
    getAllowedUrls(); // Call getData after updating the values
  } else if (message.info === "AI") {
    sendResponse("Extension Flagging");
    saveGestureLogs(message);
  } else if (message.info === "video Flag") {
    sendResponse("video part from background.js");
    eventLogs(message);
  } else if (message.info === "request videobackup") {
    sendResponse("request acheived");
    videoBackupRequest = true;
    // console.log(`video backup request received: ${videoBackupRequest}`);
  } else if (message.info === "generate videoBackup") {
    // console.log( `video backup from background.js ${videoBackupRequest}`);
    let response = videoBackupRequest;
    // console.log( videoBackupRequest);
    // console.log(response);
    sendResponse(response);
    setTimeout(() => {
      videoBackupRequest = false;
    }, 5000);
  } else if (message.info === "battery Flag") {
    let response = "Flagged battery status";
    sendResponse(response);
    eventLogs(message);
  } else if (message.info === "videoStatus") {
    let response = {
      mode_of_exam: examMode,
      exam_status: e_Status,
    };
    sendResponse(response);
  } else {
    console.log("message detection failed.");
  }
});

//Candidate details =============================================
function getCandyDetails() {
  fetch("http://localhost:3000/candidate")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      candidateDetails = data[0];
      // console.log("candidateDetails fetched", data[0]);
      e_Status = data[0].exam_status;
      loginStatus = data[0].login_status;
    })
    .catch((error) =>
      console.error("There was a problem with the fetch operation:", error)
    );
}

// getting allowed urls ==========================================
function getAllowedUrls() {
  if (loginStatus === true) {
    // console.log("AllowedURls works");
    allowedUrls.push("https://provexam.com/");
    allowedUrls.push("https://home.pearsonvue.com/");
    // console.log(allowedUrls);
  }
}

//Gesture logger ================================================
function saveGestureLogs(message) {
  try {
    if (loginStatus === true && e_Status === "exam-ongoing") {
      console.log(`Flag: Red; ${message.msg}, Timestamp: ${Date.now()}`);
      Flags.push(`Flag: Red; ${message.msg}, Timestamp: ${Date.now()}`);
      console.log(Flags);
    } else {
      console.log("exam is not running!!");
    }
  } catch (error) {
    console.error("Error saving gesture logs:", error);
  }
}

//Event flagging ================================================
function eventLogs(message) {
  try {
    if (loginStatus === true && e_Status === "exam-ongoing") {
      console.log(`Flag: Green; ${message.msg}, Timestamp: ${Date.now()}`);
      Flags.push(`Flag: Green; ${message.msg}, Timestamp: ${Date.now()}`);
      console.log(Flags);
    } else {
      console.log("exam is not running!!");
    }
  } catch (error) {
    console.error("Error saving gesture logs:", error);
  }
}