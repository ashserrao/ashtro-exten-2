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

// on extension installation ======================
chrome.runtime.onInstalled.addListener(() => {
  // chrome.tabs.create({ url: "https://www.examroom.ai" });
  chrome.tabs.query({ currentWindow: true }, (allTabs) => {
    allTabs.forEach((tab) => {
      const tabUrl = tab.url;
      if (!allowedUrls.some((allowedurl) => tabUrl.includes(allowedurl))) {
          chrome.tabs.remove(tab.id);
          console.log(tab.id);
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
          // console.log(tab.url);
          chrome.tabs.remove(tab.id);
        }
      });
    });
  } else {
    console.log("Exam is not running");
  }
});

// Function to create and show a push notification
function showNotification() {
  const options = {
    type: "basic",
    iconUrl: "assets/icon.png",
    title: "Examlock Warning",
    message: "Return back to your exam screen or the exam will be cancelled.",
    priority: 3,
  };

  chrome.notifications.create('minimizedNotification', options, function(notificationId) {
    // Add event listener for notification click
    chrome.notifications.onClicked.addListener(function(clickedNotificationId) {
      // Check if the clicked notification is the one we created
      if (clickedNotificationId === notificationId) {
        // Get active tab and focus on it
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          // Check if there are any tabs
          if (tabs && tabs.length > 0) {
            // Focus on the first active tab
            chrome.tabs.update(tabs[0].id, {active: true});
          }
        });
      }
    });
  });
}

chrome.tabs.onActivated.addListener((tab) => {
  chrome.tabs.get(tab.tabId, (current_tab_info) => {
    if (
      current_tab_info.url.includes(
        "https://testdeliveryconsole.examroom.ai/#/linear"
      )
    ) {
      chrome.windows.onFocusChanged.addListener((windowId) => {
        if (windowId === chrome.windows.WINDOW_ID_NONE) {
          showNotification();
          const serveMessage = {
            msg: `Flag: Red; Screen was minimized by the candidate, Timestamp: ${Date.now()}`,
            timestamp: Date.now(),
          };
          postData("http://localhost:3000/Gesturelogs", serveMessage);
        }
      });
    }
  });
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
  } else if (message.info === "Data received") {
    console.log("BG received", message.data);
    sendResponse("got your data");
  } else if (message.info === "AI") {
    sendResponse("Extension Flagging");
    saveGestureLogs(message);
  } else if (message.info === "check-link") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // Ensure tabs[0] exists and then send the response with the active URL
      if (tabs.length > 0) {
        sendResponse({ message: "active url is:", url: tabs[0].url });
      } else {
        sendResponse({ message: "No active tab found" });
      }
    });
    // Return true to indicate that the response will be sent asynchronously
    return true;
  } else if (message.info === "no video") {
    sendResponse("video stopped due to no feed.");
    videoBackupRequest = false;
  } else if (message.info === "video Flag") {
    sendResponse("video part from background.js");
    eventLogs(message);
    videoBackupRequest = false;
  } else if (message.info === "request videobackup") {
    sendResponse("request acheived");
    videoBackupRequest = true;
    // console.log(`video backup request received: ${videoBackupRequest}`);
  } else if (message.info === "generate videoBackup") {
    // console.log( `video generate from background.js ${videoBackupRequest}`);
    let response = videoBackupRequest;
    // console.log( videoBackupRequest);
    // console.log(response);
    sendResponse(response);
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
  }
}

//Gesture logger ================================================
function saveGestureLogs(message) {
  try {
    if (loginStatus === true && e_Status === "exam-ongoing") {
          const serveMessage = {
            msg: `Flag: Red; ${message.msg}, Timestamp: ${Date.now()}`,
            timestamp: Date.now(),
          };
          postData("http://localhost:3000/Gesturelogs", serveMessage);
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
    const serveMessage = {
      msg: `Flag: White; ${message.msg}, Timestamp: ${Date.now()}`,
      timestamp: Date.now(),
    };
      postData("http://localhost:3000/Gesturelogs", serveMessage);
      console.log(`Flag: White; ${message.msg}, Timestamp: ${Date.now()}`);
      Flags.push(`Flag: White; ${message.msg}, Timestamp: ${Date.now()}`);
      console.log(Flags);
    } else {
      console.log("exam is not running!!");
    }
  } catch (error) {
    console.error("Error saving gesture logs:", error);
  }
}

// Post data =======================================
function postData(url, data) {
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Post data response:", data);
    })
    .catch((error) => {
      console.error("Error posting data:", error);
    });
}

// Function on opening dev tools ===================
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "devtools") {
    port.onMessage.addListener((msg) => {
      if (msg.name === "openDevTools") {
        fetchSystemIP();
        onDevToolsOpen();
      }
    });
  }
});

function onDevToolsOpen() {
  chrome.tabs.query({ currentWindow: true }, (allTabs) => {
    chrome.tabs.create({ url: "https://examroom.ai/34pizy6/" });
    allTabs.forEach((tab) => {
      const tabUrl = tab.url;
      if (tabUrl === "https://examroom.ai/34pizy6/") {
        console.log("you tried to hack us page");
      } else {
        chrome.tabs.remove(tab.id);
      }
    });
  });
}

// Fetch system IP =================================
function fetchSystemIP() {
  fetch("https://api64.ipify.org?format=json")
    .then((response) => response.json())
    .then((data) => {
      const systemIP = data.ip;
      console.log("Current System IP:", systemIP);
      const serveMessage = {
        by: "chrome",
        ip: data,
        url: data.url,
        remarks: "Dev tools opened by candidate",
        timestamp: Date.now(),
      };
      postData("http://localhost:3000/Devlogs", serveMessage);
    })
    .catch((error) => {
      console.error("Error fetching IP address:", error);
    });
}