console.log("content.js is being injected");

// variables ===============================
let loginStatus = false;
let e_Status = "exam-completed";
let battFlagStatus = false;
let videoBackupRequest = false;
let backupStatus = false;
let liveLink = "https://testdeliveryconsole.examroom.ai/#/auth/login";

function triggerExtension() {
  let message = {
    info: "prime-data",
    msg: "working",
  };
  chrome.runtime.sendMessage(message, (response) => {
    // console.log("login status received", response);
    loginStatus = response.l_status;
    e_Status = `${response.examStatus}`;
  });
}

function checkActiveLink(){
  let message = {
    info: "check-link",
    msg: "working",
  };
  chrome.runtime.sendMessage(message, (response) => {
    liveLink = response.url;
  })
}

// evade direct window exit =====================================
window.addEventListener("beforeunload", function (e) {
  e.preventDefault();
  e.returnValue = "";
});


// triggerExtension();
setInterval(function () {
  checkActiveLink();
  triggerExtension();
  getBattDetails();
  getNetworkDetails();
}, 5000);

//battery status info ============================================
function getNetworkDetails() {
 if (navigator.onLine) {
  //  console.log(`Connected/${navigator.connection.effectiveType}`);
 } else {
   console.log("Not Connected");
 }
}

//battery status info ============================================
function getBattDetails() {
  navigator.getBattery().then((battery) => {
    battChargeStatus = battery.charging;
    battLevel = battery.level * 100;
    if (battChargeStatus === false && backupStatus === false) {
      // low battery auto Flag =================================
      let message = {
        info: "battery Flag",
        msg: "Flagging low battery alert.",
      };
      chrome.runtime.sendMessage(message, (response) => {
        // console.log("response from background.js", response);
      });
      backupStatus = true;
      // console.log("requesting video backup trigger");
      requestVideoBackup();
    } else if (battChargeStatus === false && backupStatus === true) {
      console.log(`${battLevel}%`);
    } else {
      backupStatus = false;
    }
  });
}

// Key Blocker Compoenent======================================
document.addEventListener("DOMContentLoaded", function () {
  let spaceCount = 0;
  const body = document.querySelector("body");

  // block content function ----------------------
  const blockContent = () => {
    if (
      loginStatus === true &&
      liveLink !== "https://testdeliveryconsole.examroom.ai/#/auth/login"
    ) {
      // body.style.opacity = "0";
      console.log("content blocked");
    } else {
      console.log("content block failed since user is not logged in");
    }
  };

  // unblock content function ----------------------
  const unBlockContent = () => {
    body.style.opacity = "1";
  };

  //deteching screen resizing========================================
  document.addEventListener("mousemove", function (e) {
    // console.log("return full screen");
    detectOffsetChanges((offsetX, offsetY) => {
      console.log(
        `Window offset changed: offsetX=${offsetX}, offsetY=${offsetY}`
      );
      console.log("return to full screen");
      setTimeout(() => {
        makeTabFullScreen();
      }, 3000)
    });
    disabledEvent(e);
  });

  let lastOffsetX = window.screenX;
  let lastOffsetY = window.screenY;

  //function to detech offset=======================
  function detectOffsetChanges(callback, interval = 100) {
    setInterval(() => {
      const currentOffsetX = window.screenX;
      const currentOffsetY = window.screenY;

      if (currentOffsetX !== lastOffsetX || currentOffsetY !== lastOffsetY) {
        lastOffsetX = currentOffsetX;
        lastOffsetY = currentOffsetY;
        callback(lastOffsetX, lastOffsetY);
      }
    }, interval);
  }

  // keydown event listener --------------------------
  document.addEventListener("keydown", function (e) {
    if (e.altKey && "tab".indexOf(e.key) !== -1) {
      blockContent();
      let value = {
        remark: `Content blocked since the candidate pressed alt and ${e.key} key which is not allowed.`,
        url: window.location.href,
      };
      disabledEvent(e);
      actionLogger(JSON.stringify(value));
    } else if (
      (e.metaKey && e.key == "PrintScreen") ||
      e.key == "PrintScreen"
    ) {
      blockContent();
      let value = {
        remark: `Content blocked since the candidate tried to print the screen`,
        url: window.location.href,
      };
      disabledEvent(e);
      actionLogger(JSON.stringify(value));
    } else if (e.ctrlKey && e.shiftKey) {
      blockContent();
      let value = {
        remark: `Content blocked since the candidate pressed ctrl and ${e.key}`,
        url: window.location.href,
      };
      disabledEvent(e);
      actionLogger(JSON.stringify(value));
    } else if (e.shiftKey && e.metaKey) {
      let value = {
        remark: `Content blocked since the candidate pressed shift and ${e.metaKey}`,
        url: window.location.href,
      };
      disabledEvent(e);
      actionLogger(JSON.stringify(value));
    } else if (e.ctrlKey && e.shiftKey && "34".indexOf(e.key)) {
      blockContent();
      let value = {
        remark: `Pressed ctrl key, shift key and ${e.key} key`,
        url: window.location.href,
      };
      disabledEvent(e);
      actionLogger(JSON.stringify(value));
    } else if (e.ctrlKey && e.shiftKey) {
      blockContent();
      let value = {
        remark: `Pressed ctrl key, shift key and ${e.key} key`,
        url: window.location.href,
      };
      disabledEvent(e);
      actionLogger(JSON.stringify(value));
      blockContent();
    } else if (
      [
        // "Shift",
        "Control",
        "Alt",
        "Meta",
        "meta",
        "control",
        "alt",
        // "shift",
        "Escape",
        "escape",
      ].includes(e.key)
    ) {
      blockContent();
      let value = {
        remark: `Content blocked since the candidate pressed ${e.key} key which is not allowed.`,
        url: window.location.href,
      };
      disabledEvent(e);
      actionLogger(JSON.stringify(value));
    } else if (
      [
        "F1",
        "F2",
        "F3",
        "F4",
        "F5",
        "F6",
        "F7",
        "F8",
        "F9",
        "F10",
        "F11",
        "F12",
      ].includes(e.key)
    ) {
      let value = {
        remark: `Content blocked since the candidate pressed ${e.key} key which is not allowed.`,
        url: window.location.href,
      };
      actionLogger(JSON.stringify(value));
      if (e.key === "F11") {
        console.log(e.key);
        requestBackup();
      }
    } else if (e.ctrlKey && "cvxspwuaz".indexOf(e.key) !== -1) {
      let value = {
        remark: `Content blocked since the candidate pressed ctrl key and ${e.key}`,
        url: window.location.href,
      };
      disabledEvent(e);
      actionLogger(JSON.stringify(value));
    } else if (e.key === " ") {
      spaceCount++;
      if (spaceCount === 2) {
        unBlockContent();
        spaceCount = 0;
        makeTabFullScreen();
      }
    } else {
      console.log("Keydown event failed", e);
    }
  });

  // // Add an event listener for window resize
  // window.addEventListener(
  //   "resize",
  //   function (event) {
  //     console.log("resize event triggered", event);
  //     blockContent();
  //     let value = {
  //       remark: `Content blocked since the candidate tried to resize the screen.`,
  //       url: window.location.href,
  //     };
  //     actionLogger(JSON.stringify(value));
  //   },
  //   true
  // );

  //logging trigger===================================
  function actionLogger(msg) {
    if (loginStatus === true && e_Status === "exam-ongoing") {
      let message = {
        info: "AI",
        msg: `${msg}`,
      };
      chrome.runtime.sendMessage(message, (response) => {
        console.log(`${response},${msg}`);
      });
      setTimeout(() => {
        makeTabFullScreen();
      }, 1000);
    } else {
      console.log("exam not running");
    }
  }

  // function to make the tab full screen =================
  function makeTabFullScreen() {
    const docElm = document.documentElement;
    if (loginStatus === true && e_Status == "exam-ongoing") {
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
      } else if (docElm.mozRequestFullScreen) {
        /* Firefox */
        docElm.mozRequestFullScreen();
      } else if (docElm.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        docElm.webkitRequestFullscreen();
      } else if (docElm.msRequestFullscreen) {
        disabledEvent(docElm);
        /* IE/Edge */
        docElm.msRequestFullscreen();
      }
      console.log('fullscreen');
    } else {
      console.log("exam is not running!");
    }
  }

  // Function to check if the document is already in full screen
  // function isFullScreen() {
  //   return (
  //     document.fullscreenElement ||
  //     document.mozFullScreenElement ||
  //     document.webkitFullscreenElement ||
  //     document.msFullscreenElement
  //   );
  // }
});

//request video backup ===================================
function requestVideoBackup() {
  console.log("requestVideoBackup function is running");
  // console.log(`${loginStatus}`);
  if (loginStatus === true) {
    let message = {
      info: "request videobackup",
    };
    // chrome.runtime.sendMessage(message, (response) => {
    //   console.log("Check if working:", response);
    // });
    // console.log("backup request triggered");
  } else {
    console.log("exam not running");
  }
}

// disabled event function =============================
function disabledEvent(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  } else if (window.event) {
    window.event.cancelBubble = true;
  } else {
    e.preventDefault();
    return false;
  }
}

// Mouse right-click disable====================================
document.addEventListener("contextmenu", (event) => {
  if (loginStatus === true) {
    event.preventDefault();
  }
});


//disable content selection=================================
function disableSelection() {
    // Disable text selection on the entire document
    document.addEventListener('selectstart', disableEvent);
    document.addEventListener('mousedown', disableEvent);
}

function disableEvent(event) {
    // Prevent the default action of the event
    event.preventDefault();
}

// Example usage:
disableSelection();
