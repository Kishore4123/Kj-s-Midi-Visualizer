let midiSelect;
let uploadBtn;
let audioBtn; 
let initialized = false;
let pitches = Array(127).fill(0);
let pitchesD = Array(127).fill(0);
let objs = new Set();
let inhib = Array(pitches.length).fill(0);
let colors = [];
let midiEvents = [];
let midiPlaying = false;
let midiStartTime = 0;

let synth;
let reverb;
let audioReady = false;
let drumKit; 

let video;
let handPose;
let hands = [];
let handStates = [false, false]; 
let triggerLine;

function preload() {
  console.log("Downloading MediaPipe AI...");
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  let containerDiv = document.getElementById('canvasContainer');
  let canvas = createCanvas(containerDiv.offsetWidth, containerDiv.offsetHeight);
  canvas.parent('canvasContainer');
  
  // THE FIX: We have completely removed the CSS Blur/Contrast filter
  // canvas.style('filter', 'blur(4px) contrast(300%)'); 
  
  video = createCapture(VIDEO, () => {
    console.log("Camera feed active!");
    handPose.detectStart(video, results => {
      hands = results;
    });
  });
  video.size(640, 480);
  video.hide(); 

  triggerLine = height * 0.6; 

  // Create MIDI Select in new container
  let midiContainer = document.getElementById('midiSelectContainer');
  midiSelect = createSelect();
  midiSelect.parent(midiContainer);
  midiSelect.style('width', '100%');
  midiSelect.style('padding', '12px');
  midiSelect.style('background', 'rgba(255, 255, 255, 0.05)');
  midiSelect.style('border', '2px solid rgba(0, 212, 255, 0.3)');
  midiSelect.style('color', '#00d4ff');
  midiSelect.style('border-radius', '6px');
  midiSelect.style('font-size', '13px');
  midiSelect.style('font-weight', '500');
  midiSelect.style('cursor', 'pointer');
  
  // Create File Upload in new container
  let uploadContainer = document.getElementById('uploadContainer');
  uploadBtn = createFileInput(handleMidiUpload);
  uploadBtn.parent(uploadContainer);
  uploadBtn.style('padding', '10px');
  uploadBtn.style('background', 'rgba(255, 255, 255, 0.05)');
  uploadBtn.style('border', '2px solid rgba(0, 212, 255, 0.3)');
  uploadBtn.style('color', '#a0a0a0');
  uploadBtn.style('border-radius', '6px');
  uploadBtn.style('font-size', '12px');
  uploadBtn.style('cursor', 'pointer');
  uploadBtn.style('width', '100%');
  
  // Create Audio Button in new container
  let audioContainer = document.getElementById('audioContainer');
  audioBtn = createButton('ENABLE AUDIO');
  audioBtn.parent(audioContainer);
  audioBtn.style('width', '100%');
  audioBtn.style('padding', '14px 16px');
  audioBtn.style('background', 'linear-gradient(135deg, #00d4ff 0%, #00a8cc 100%)');
  audioBtn.style('color', '#0a0a0a');
  audioBtn.style('border', 'none');
  audioBtn.style('border-radius', '6px');
  audioBtn.style('font-weight', 'bold');
  audioBtn.style('font-size', '13px');
  audioBtn.style('text-transform', 'uppercase');
  audioBtn.style('cursor', 'pointer');
  audioBtn.style('letter-spacing', '1.2px');
  audioBtn.style('transition', 'all 0.3s ease');
  audioBtn.mousePressed(initAudio);
  
  WebMidi.enable().then(() => {
    console.log("WebMidi Engine Online");
    WebMidi.addListener('connected', ({port}) => {
      if(port.type === 'input') midiSelect.option(port.name, port.id);
    });
    
    for (let port of WebMidi.inputs) {
      midiSelect.option(port.name, port.id);
    }
    updateListener();
  }).catch(err => {
    console.warn("MIDI not connected or blocked.", err);
  });
  
  midiSelect.changed(() => {
    storeItem('device', midiSelect.selected());
    updateListener();
  });
  
  resetColors();
  canvas.mousePressed(resetColors);
  
  initialized = true;
}

function windowResized() {
  let containerDiv = document.getElementById('canvasContainer');
  if (containerDiv) {
    resizeCanvas(containerDiv.offsetWidth, containerDiv.offsetHeight);
    triggerLine = height * 0.6;
  }
}

let listeners = [];
function updateListener() {
  for (let listener of listeners) listener.remove();
  listeners = [];
  let currentSelection = midiSelect.selected();
  if (currentSelection) {
    let inp = WebMidi.getInputById(currentSelection);
    if (inp) {
      listeners.push(...inp.addListener('noteon', noteon));
      listeners.push(...inp.addListener('noteoff', noteoff));
    }
  }
}

async function initAudio() {
  if (audioReady) return; 
  
  try {
    await Tone.start();
    console.log("AudioContext unlocked.");
    
    reverb = new Tone.Freeverb({ roomSize: 0.9, dampening: 2000 }).toDestination();
    
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
      envelope: { attack: 0.4, decay: 0.2, sustain: 0.9, release: 1.5 }
    }).connect(reverb);
    Tone.Destination.volume.value = -10; 

    drumKit = new Tone.Sampler({
      urls: {
        "C1": "kick-bass.mp3",
        "D1": "snare.mp3",
        "E1": "crash.mp3",
        "F1": "tom-1.mp3",
        "G1": "tom-2.mp3",
        "A1": "tom-3.mp3",
        "B1": "tom-4.mp3"
      },
      onload: () => {
        console.log("All Local Drum Files Loaded Successfully!");
      }
    }).toDestination();
    
    audioReady = true;
    audioBtn.html('🔊 AUDIO ACTIVE');
    audioBtn.style('background', 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)');
    audioBtn.style('color', '#0a0a0a');
    audioBtn.style('box-shadow', '0 4px 15px rgba(0, 255, 136, 0.3)');
    
    synth.triggerAttackRelease("C4", 0.5, Tone.now());
    
  } catch (err) {
    console.error("Audio Init Failed:", err);
  }
}

function playDrum(type, x, y) {
  if (!audioReady || !drumKit.loaded) return;

  if (type === 'kick') drumKit.triggerAttackRelease("C1", 1);
  else if (type === 'snare') drumKit.triggerAttackRelease("D1", 1);
  else if (type === 'crash') drumKit.triggerAttackRelease("E1", 1);

  for(let i = 0; i < 15; i++) {
    objs.add({
      c: color(255), 
      x: x + random(-30, 30), 
      y: y + random(-30, 30), 
      r: random(20, 60)
    });
  }
}

function handleMidiUpload(file) {
  if (file.name.endsWith('.mid') || file.name.endsWith('.midi')) {
    let reader = new FileReader();
    reader.onload = function(e) {
      const parsedMidi = new Midi(e.target.result);
      midiEvents = [];
      parsedMidi.tracks.forEach(track => {
        track.notes.forEach(note => {
          midiEvents.push({ time: note.time * 1000, type: 'on', number: note.midi, velocity: note.velocity || 0.8 });
          midiEvents.push({ time: (note.time + note.duration) * 1000, type: 'off', number: note.midi });
        });
      });
      midiEvents.sort((a, b) => a.time - b.time);
      pitches.fill(0); pitchesD.fill(0);
      midiPlaying = true; midiStartTime = millis();
    };
    reader.readAsArrayBuffer(file.file);
  }
}


function resetColors() {
  colors = Array(7).fill().map((_, i) => Array(8).fill().map(_ => 
    [random()*random(0.5, 1)*255, random()*random(0.5, 1)*255, random()*random(0.5, 1)*255, random()+random()]
  ));
}

function noteon(e) {
  if (!e.note) return;
  let rawVel = e.value !== undefined ? e.value : (e.velocity || 0.5);
  let vel = rawVel > 1 ? rawVel / 127 : rawVel; 
  pitches[e.note.number] = vel;
  
  if (audioReady && synth) {
    let hz = Tone.Frequency(e.note.number, "midi").toFrequency();
    synth.triggerAttack(hz, Tone.now(), vel);
  }
}

function noteoff(e) {
  if (!e.note) return;
  pitches[e.note.number] = 0;
  
  if (audioReady && synth) {
    let hz = Tone.Frequency(e.note.number, "midi").toFrequency();
    synth.triggerRelease(hz, Tone.now());
  }
}

function draw() {
  if (!initialized) return;

  // Background must be drawn FIRST every frame
  background(20);

  // --- AIR DRUM HIT DETECTION ---
  if (hands && hands.length > 0) {
    for (let i = 0; i < min(hands.length, 2); i++) {
      if (hands[i].keypoints) {
        let indexTip = hands[i].keypoints[8]; 
        
        let mappedX = map(indexTip.x, 0, video.width, 0, width);
        let mappedY = map(indexTip.y, 0, video.height, 0, height);

        // Draw opaque white tracker dot
        fill(255);
        noStroke();
        ellipse(mappedX, mappedY, 20, 20);

        if (mappedY > triggerLine && !handStates[i]) {
          handStates[i] = true; 
          
          if (mappedX < width / 3) playDrum('kick', mappedX, mappedY);
          else if (mappedX < (width / 3) * 2) playDrum('snare', mappedX, mappedY);
          else playDrum('crash', mappedX, mappedY);
          
        } else if (mappedY < triggerLine - 40) {
          handStates[i] = false; 
        }
      }
    }
  }

  // --- MIDI PLAYBACK ---
  if (midiPlaying) {
    let currentPlaybackTime = millis() - midiStartTime;
    while (midiEvents.length > 0 && midiEvents[0].time <= currentPlaybackTime) {
      let event = midiEvents.shift();
      if (event.type === 'on') {
        pitches[event.number] = event.velocity;
        if (audioReady && synth) {
          let hz = Tone.Frequency(event.number, "midi").toFrequency();
          synth.triggerAttack(hz, Tone.now(), event.velocity);
        }
      } else if (event.type === 'off') {
        pitches[event.number] = 0;
        if (audioReady && synth) {
          let hz = Tone.Frequency(event.number, "midi").toFrequency();
          synth.triggerRelease(hz, Tone.now());
        }
      }
    }
    if (midiEvents.length === 0) midiPlaying = false;
  }

  // --- MATH ---
  let notes = Array(12).fill(0);
  for (let i = 0; i < pitches.length; i ++) {
    pitches[i] *= 0.99;
    pitchesD[i] += pitches[i];
    pitchesD[i] *= 0.94;
    notes[i % 12] += pitchesD[i];
  }
  
  let intervals = Array(colors.length).fill().map(x => Array(12).fill(0));
  for (let k = 0; k < intervals.length; k ++) {
    for (let i = 0; i < 12; i ++) {
      for (let j = 0; j < 12; j ++) {
        intervals[k][(j - i + 12) % 12] += (notes[i] * notes[(i + k + 1) % 12] * notes[j]) ** (1/3);
      }
    }
  }
  
  let totalWeight = colors.reduce((e, x, i) => e + x.reduce((e, x, j) => e + x[3] * intervals[i][j], 0), 0);
  let col = Array(3).fill().map((_, c) => totalWeight > 0.01 ? colors.reduce((e, x, i) => e + x.reduce((e, x, j) => e + x[c] * x[3] * intervals[i][j] / totalWeight, 0), 0) : 100).map(x => x * 0.9);
  col = color(...col);
  
  for (let i = 0; i < pitches.length; i ++) {
    inhib[i] -= pitches[i];
    inhib[i] = min(inhib[i], pitches[i] * 6);
    while (inhib[i] < 0) {
      inhib[i] += 6;
      let x = (i + random(0.2)) / pitches.length;
      x = (x - 0.5);
      x = exp(x * 5) / (1 + exp(x * 5));
      x = x * width;
      objs.add({c: col, x: x, y: -20, r: sqrt(pitches[i]) * 40});
    }
  }
  
  // --- RENDERING PARTICLES ---
  blendMode(ADD);
  noStroke();
  for (let o of objs) {
    fill(o.c);
    ellipse(o.x, o.y, o.r * 0.7, o.r);
    o.y += random(1, 2);
    o.x += random(-1, 1) * 0.3;
    if (o.y > height + 30) {
      objs.delete(o);
    }
  }
  
  // Return to normal blending
  blendMode(BLEND);

  // --- RENDERING UI OVERLAY ---
  // The trigger line (solid white)
  stroke(255);
  strokeWeight(2);
  line(0, triggerLine, width, triggerLine);
  
  // --- MINI HAND VISUALIZER (TOP RIGHT) ---
  let pipW = 200; 
  let pipH = 150; 
  let pipX = width - pipW - 20;
  let pipY = 20;

  // Solid dark gray box
  fill(40);
  stroke(255);
  strokeWeight(2);
  rect(pipX, pipY, pipW, pipH, 10);

  if (hands && hands.length > 0) {
    let bonePairs = [
      [0,1], [1,2], [2,3], [3,4],       
      [0,5], [5,6], [6,7], [7,8],       
      [5,9], [9,10], [10,11], [11,12],  
      [9,13], [13,14], [14,15], [15,16], 
      [13,17], [17,18], [18,19], [19,20], 
      [0,17]                            
    ];

    for (let i = 0; i < hands.length; i++) {
      if (hands[i].keypoints) {
        
        // Solid Neon Green Bones
        stroke(0, 255, 0); 
        strokeWeight(3);
        for (let j = 0; j < bonePairs.length; j++) {
          let pA = hands[i].keypoints[bonePairs[j][0]];
          let pB = hands[i].keypoints[bonePairs[j][1]];

          let xA = map(pA.x, 0, video.width, pipX, pipX + pipW);
          let yA = map(pA.y, 0, video.height, pipY, pipY + pipH);
          let xB = map(pB.x, 0, video.width, pipX, pipX + pipW);
          let yB = map(pB.y, 0, video.height, pipY, pipY + pipH);

          line(xA, yA, xB, yB);
        }

        // Solid Red Joints
        noStroke();
        fill(255, 0, 0); 
        for (let j = 0; j < hands[i].keypoints.length; j++) {
          let pt = hands[i].keypoints[j];
          let x = map(pt.x, 0, video.width, pipX, pipX + pipW);
          let y = map(pt.y, 0, video.height, pipY, pipY + pipH);
          ellipse(x, y, 6, 6);
        }
      }
    }
  }
}