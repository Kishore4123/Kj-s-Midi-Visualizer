Interactive MIDI & AI Air Drum Visualizer
An immersive, browser-based audio-visual experience that combines live physical MIDI keyboard input with computer-vision "Air Drums." Built with p5.js, Tone.js, WebMidi, and ml5.js.

✨ Features
Live MIDI Integration: Plug and play with any standard USB MIDI controller. The visualizer automatically detects your hardware and translates keystrokes into real-time visual particles.

Harmonic Color Mapping: The visualizer mathematically analyzes the intervals of the chords you play, assigning specific color weights to different harmonic combinations.

String Ensemble Synthesizer: Built-in polyphonic synthesizer using Tone.js, featuring a rich, heavily reverberated "fatsawtooth" string tone.

AI Air Drums (MediaPipe): Uses your webcam and ml5.js to track your hands in 3D space. Strike downwards past the invisible trigger line to play custom drum samples.

Local Drum Sampler: Instantly loads local .mp3 files into a Tone.js Sampler for zero-latency drum hits.

PiP Skeleton Debugger: A stylish Picture-in-Picture (PiP) display in the top right corner shows the raw, real-time skeletal tracking of your hands.

📁 File Structure
For the application to run correctly, ensure all files are located in the same root directory:

Plaintext
/your-project-folder
├── index.html        # Main HTML file with library CDNs
├── sketch.js         # The core p5.js and logic script
├── style.css         # Basic canvas styling
├── kick-bass.mp3     # Drum sample (Left Screen Trigger)
├── snare.mp3         # Drum sample (Center Screen Trigger)
├── crash.mp3         # Drum sample (Right Screen Trigger)
├── tom-1.mp3         # Additional drum sample
├── tom-2.mp3         # Additional drum sample
├── tom-3.mp3         # Additional drum sample
└── tom-4.mp3         # Additional drum sample
🚀 Installation & Setup
Because this project requests access to your Webcam and loads local audio files, it cannot be run simply by double-clicking the HTML file. It must be run through a local web server to bypass strict browser security policies.

Option 1: VS Code Live Server (Recommended)

Open the project folder in Visual Studio Code.

Install the Live Server extension by Ritwick Dey.

Click Go Live in the bottom right corner of VS Code.

Option 2: Python Simple Server

Open your terminal/command prompt.

Navigate to your project folder.

Run the command: python -m http.server 8000

Open your browser and go to http://localhost:8000

🎮 How to Play
Grant Permissions: Upon loading, your browser will ask for permission to use your Camera and MIDI devices. Click Allow.

Enable the Audio Engine: Web browsers block audio from playing automatically. You must click the red "ENABLE AUDIO" button in the center of the screen to unlock the Tone.js AudioContext and load the drum samples.

Select Your Keyboard: Use the dropdown menu in the bottom left to ensure your specific MIDI keyboard is selected.

Play the Keys: Pressing keys on your MIDI controller will spawn colored particles and play the String Ensemble synthesizer.

Play the Air Drums: Raise your hands so they appear in the top-right PiP camera view. Swipe your index finger down past the middle of the screen to trigger the drums:

Left Third of Screen: Plays kick-bass.mp3

Middle Third of Screen: Plays snare.mp3

Right Third of Screen: Plays crash.mp3

🛠️ Built With
p5.js - Canvas rendering and math functions.

Tone.js - Web Audio API framework for synths and samplers.

WebMidi.js - Simplifies interaction with the browser's native MIDI API.

ml5.js - Friendly machine learning for the web (running MediaPipe HandPose).
