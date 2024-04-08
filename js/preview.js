// document.addEventListener("DOMContentLoaded", () => {
//   const recordingList = document.getElementById("recording-list");

//   function displayRecordings() {
//     const transaction = db.transaction(["recordings"], "readonly");
//     const objectStore = transaction.objectStore("recordings");
//     const request = objectStore.getAll();

//     request.onerror = function (event) {
//       console.error("Error fetching recordings:", event.target.errorCode);
//     };

//     request.onsuccess = function (event) {
//       const recordings = event.target.result;
//       recordingList.innerHTML = ""; // Clear previous recordings

//       const files = recordings.map((recording, index) => ({
//         name: `recording-${index + 1}.webm`,
//         content: recording
//       }));

//       // Create password-protected ZIP file
//       const password = 'yourPassword'; // Set your desired password
//       createPasswordProtectedZip(files, password)
//         .then(zipBlob => {
//           // Create download link for the ZIP file
//           const downloadLink = document.createElement("a");
//           downloadLink.href = URL.createObjectURL(zipBlob);
//           downloadLink.download = 'recordings.zip';
//           downloadLink.innerText = 'Download all recordings as ZIP';

//           // Append the download link to the recording list
//           const recordingItem = document.createElement("li");
//           recordingItem.appendChild(downloadLink);
//           recordingList.appendChild(recordingItem);
//         })
//         .catch(error => {
//           console.error('Error creating password-protected ZIP file:', error);
//         });
//     };
//   }

//   // Display recordings when DOM is loaded
//   setInterval(() => {
//     displayRecordings();
//   }, 2000);

//   clearInterval();
// });


document.addEventListener("DOMContentLoaded", () => {
  const recordingList = document.getElementById("recording-list");

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

      recordings.forEach(function (recording, index) {
        const recordingItem = document.createElement("li");
        const downloadLink = document.createElement("a");

        downloadLink.href = URL.createObjectURL(recording);
        downloadLink.download = `recording-${index}.webm`;
        downloadLink.innerText = `Recording ${index + 1}`;

        recordingItem.appendChild(downloadLink);
        recordingList.appendChild(recordingItem);
      });
    };
  }

  // Display recordings when DOM is loaded
  setInterval(() => {
    displayRecordings();
  }, 2000);

  clearInterval();
});
