// html5-qrcode-demo.js

function docReady(fn) {
    // Check if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // Call on the next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
} 

docReady(function() {
    const resultContainer = document.getElementById('qr-reader-results');
    const qrReader = document.getElementById('qr-reader');
    const startScanButton = document.getElementById('start-scan-btn');

    let html5QrcodeScanner = null;
    let lastResult = null;
    let countResults = 0;

    // Function to handle successful scans
    function onScanSuccess(decodedText, decodedResult) {
        if (decodedText !== lastResult) {
            countResults++;
            lastResult = decodedText;
            console.log(`Scan result = ${decodedText}`, decodedResult);

            // Display the result in the results container
            resultContainer.innerHTML += `<div>[${countResults}] - ${decodedText}</div>`;

            // Optional: Stop scanning after a successful scan
            stopScanning();
        }
    }

    // Function to handle scan errors (optional)
    function onScanError(qrCodeError) {
        // You can choose to log errors or ignore them
        console.warn(`QR Code no match: ${qrCodeError}`);
    }

    // Function to start scanning
    function startScanning() {
        // Hide the start button and show the scanner
        startScanButton.style.display = 'none';
        qrReader.style.display = 'block';

        // Initialize the Html5QrcodeScanner
        html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader", { fps: 10, qrbox: 250 }, /* verbose= */ false);
        
        html5QrcodeScanner.render(onScanSuccess, onScanError);
    }

    // Function to stop scanning
    function stopScanning() {
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear().then(() => {
                console.log('Scanner stopped.');
                qrReader.style.display = 'none';
                startScanButton.style.display = 'block';
            }).catch(err => {
                console.error('Failed to clear Html5QrcodeScanner.', err);
            });
        }
    }

    // Event listener for the start scan button
    startScanButton.addEventListener('click', startScanning);
});
