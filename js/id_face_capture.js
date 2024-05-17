// redirection function============================================
const submit = document.getElementById("image-submit");

function redirect() {
  transferFile();
  setTimeout(() => {
    window.location = "./recording.html";
  }, 5000);
}

const imagesArray = [];

submit.onclick = redirect;

function transferFile(){
  let message = {
    info: "Data received",
    data: imagesArray
  };
  chrome.runtime.sendMessage(message, (response) => {
    console.log("message received from background.js",response);
  })
}


// capture and save picture============================================
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  })
  .then((stream) => {
    document.getElementById("live").srcObject = stream;
  })
  .catch((error) => {
    console.error("Error accessing media devices.", error);
  });

document.addEventListener("DOMContentLoaded", function () {
  // const imagesArray = [];

  function captureAndUploadImage(blobCallback) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia is not supported in this browser");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (stream) {
        var video = document.getElementById("live");
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = function () {
          var canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          var ctx = canvas.getContext("2d");

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(function (blob) {
            blobCallback(blob);
          }, "image/png");
        };
      })
      .catch(function (error) {
        console.error("Error accessing the camera:", error);
      });
  }

  document
    .getElementById("image-capture")
    .addEventListener("click", function () {
      captureAndUploadImage(function (blob) {
        // Add blob to the array
        imagesArray.push(blob);
        console.log(imagesArray);
        // Display preview
        displayImagePreview(blob);
      });
    });

  document
    .getElementById("image-upload")
    .addEventListener("click", function () {
      var fileInput = document.getElementById("input-file");
      // Check if a file is selected
      if (fileInput.files.length === 0) {
        console.error("No file selected");
        return;
      }

      var file = fileInput.files[0];
      var reader = new FileReader();

      reader.onload = function (event) {
        var dataUrl = event.target.result;
        var img = new Image();

        img.onload = function () {
          // Create a canvas element to draw the image
          var canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          var ctx = canvas.getContext("2d");

          // Draw the image onto the canvas
          ctx.drawImage(img, 0, 0);

          // Convert the canvas content to a Blob
          canvas.toBlob(function (blob) {
            imagesArray.push(blob);
            console.log(imagesArray);
            displayImagePreview(blob);
          }, "image/png");
        };

        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      fileInput.value = '';
    });

  function displayImagePreview(blob) {
    // Create elements for image preview
    var imgContainer = document.createElement("div");
    imgContainer.classList.add("image-container");
    var img = document.createElement("img");
    img.src = URL.createObjectURL(blob);
    var deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "X";

    // Delete button functionality
    deleteBtn.onclick = function () {
      // Remove image container from DOM
      imgContainer.parentNode.removeChild(imgContainer);
      // Remove blob from array
      var index = imagesArray.indexOf(blob);
      if (index !== -1) {
        imagesArray.splice(index, 1);
      }
    };

    // Append elements to the preview container
    imgContainer.appendChild(img);
    imgContainer.appendChild(deleteBtn);
    document.getElementById("images").appendChild(imgContainer);
  }

  document
    .getElementById("image-submit")
    .addEventListener("click", function () {
      // Example: submit the imagesArray containing all the blobs
      console.log(imagesArray);
      // Now you can send these blobs to your server for further processing, storage, etc.
      // Clear the array after submission if needed
    //   imagesArray.length = 0;
    });
});
