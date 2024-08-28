// Declare functions first
function toggleBackgroundControls() {
  const bgType = document.getElementById('bgType').value;
  document.getElementById('solidColorControl').style.display = bgType === 'solid' ? 'block' : 'none';
  document.getElementById('gradientControl').style.display = bgType === 'gradient' ? 'block' : 'none';
  document.getElementById('customGradientControl').style.display = 
    (bgType === 'gradient' && document.getElementById('gradientSelect').value === 'custom') ? 'block' : 'none';
  updateImage();
}

function updateImage() {
  const img = document.getElementById('capturedImage');
  const bgType = document.getElementById('bgType').value;
  const padding = document.getElementById('padding').value + 'px';
  
  if (bgType === 'solid') {
    const bgColor = document.getElementById('bgColor').value;
    img.style.background = bgColor;
  } else {
    const gradientType = document.getElementById('gradientSelect').value;
    let gradient;
    
    switch (gradientType) {
      case 'blue-purple':
        gradient = 'linear-gradient(to right, #4e54c8, #8f94fb)';
        break;
      case 'green-blue':
        gradient = 'linear-gradient(to right, #11998e, #38ef7d)';
        break;
      case 'orange-pink':
        gradient = 'linear-gradient(to right, #ff9966, #ff5e62)';
        break;
      case 'custom':
        const color1 = document.getElementById('gradientColor1').value;
        const color2 = document.getElementById('gradientColor2').value;
        gradient = `linear-gradient(to right, ${color1}, ${color2})`;
        break;
    }
    
    img.style.background = gradient;
  }
  
  img.style.padding = padding;
}

// Add these functions at the beginning of the file
function checkSpeechRecognitionSupport() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

function createSpeechRecognitionObject() {
  return new (window.webkitSpeechRecognition || window.SpeechRecognition)();
}

// Add this to your existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded and parsed');

  document.getElementById('captureBtn').addEventListener('click', async () => {
    console.log('Capture button clicked');
    try {
      const response = await chrome.runtime.sendMessage({action: "captureScreenshot"});
      console.log('Received response from background script:', response);
      if (response && response.imageDataUrl) {
        const img = document.getElementById('capturedImage');
        img.src = response.imageDataUrl;
        document.getElementById('editor').style.display = 'block';
        toggleBackgroundControls(); // Initialize controls
      } else {
        console.error('No image data received from background script');
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
    }
  });

  document.getElementById('bgType').addEventListener('change', toggleBackgroundControls);
  document.getElementById('bgColor').addEventListener('input', updateImage);
  document.getElementById('gradientSelect').addEventListener('change', updateImage);
  document.getElementById('gradientColor1').addEventListener('input', updateImage);
  document.getElementById('gradientColor2').addEventListener('input', updateImage);
  document.getElementById('padding').addEventListener('input', updateImage);

  document.getElementById('gradientSelect').addEventListener('change', function() {
    document.getElementById('customGradientControl').style.display = 
      this.value === 'custom' ? 'block' : 'none';
    updateImage();
  });

  document.getElementById('saveBtn').addEventListener('click', () => {
    console.log('Save button clicked');
    const canvas = document.createElement('canvas');
    const img = document.getElementById('capturedImage');
    const padding = parseInt(document.getElementById('padding').value);
    
    // Set canvas size to match the actual image size plus padding
    canvas.width = img.naturalWidth + (padding * 2);
    canvas.height = img.naturalHeight + (padding * 2);
    
    const ctx = canvas.getContext('2d');
    
    const bgType = document.getElementById('bgType').value;
    if (bgType === 'solid') {
      ctx.fillStyle = document.getElementById('bgColor').value;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const gradientType = document.getElementById('gradientSelect').value;
      let gradient;
      
      switch (gradientType) {
        case 'blue-purple':
          gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, '#4e54c8');
          gradient.addColorStop(1, '#8f94fb');
          break;
        case 'green-blue':
          gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, '#11998e');
          gradient.addColorStop(1, '#38ef7d');
          break;
        case 'orange-pink':
          gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, '#ff9966');
          gradient.addColorStop(1, '#ff5e62');
          break;
        case 'custom':
          gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, document.getElementById('gradientColor1').value);
          gradient.addColorStop(1, document.getElementById('gradientColor2').value);
          break;
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw the full image onto the canvas
    ctx.drawImage(img, padding, padding, img.naturalWidth, img.naturalHeight);

    const link = document.createElement('a');
    link.download = 'screenshot.png';
    link.href = canvas.toDataURL();
    link.click();
  });

  const voiceCaptureBtn = document.getElementById('voiceCaptureBtn');
  const voiceOutput = document.getElementById('voiceOutput');

  if (checkSpeechRecognitionSupport()) {
    const recognition = createSpeechRecognitionObject();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let isRecording = false;

    voiceCaptureBtn.addEventListener('click', () => {
      if (!isRecording) {
        recognition.start();
        voiceCaptureBtn.textContent = 'Stop Voice Capture';
        voiceCaptureBtn.classList.add('recording');
      } else {
        recognition.stop();
        voiceCaptureBtn.textContent = 'Start Voice Capture';
        voiceCaptureBtn.classList.remove('recording');
      }
      isRecording = !isRecording;
    });

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      voiceOutput.innerHTML = finalTranscript + '<i style="color: #999;">' + interimTranscript + '</i>';
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      voiceOutput.textContent = 'Error: ' + event.error;
    };

    recognition.onend = () => {
      isRecording = false;
      voiceCaptureBtn.textContent = 'Start Voice Capture';
      voiceCaptureBtn.classList.remove('recording');
    };
  } else {
    voiceCaptureBtn.disabled = true;
    voiceCaptureBtn.textContent = 'Voice Capture Not Supported';
    voiceOutput.textContent = 'Your browser does not support the Web Speech API. Please use a compatible browser like Chrome.';
  }
});

// ... rest of the existing code ...