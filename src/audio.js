/* eslint-disable no-unused-vars */
import { randFloatSpread } from './math.js';

var AudioContext = window.AudioContext || window.webkitAudioContext;
var OfflineAudioContext =
  window.OfflineAudioContext || window.webkitOfflineAudioContext;

var audioContext = new AudioContext();
var { sampleRate } = audioContext;

// A4 is 69.
var toFreq = note => 2 ** ((note - 69) / 12) * 440;

var playSound = (sound, destination = audioContext.destination) => {
  var source = audioContext.createBufferSource();
  source.buffer = sound;
  source.connect(destination);
  source.start();
};

var generateAudioBuffer = (fn, duration, volume) => {
  var length = duration * sampleRate;

  var buffer = audioContext.createBuffer(1, length, sampleRate);
  var channel = buffer.getChannelData(0);
  for (var i = 0; i < length; i++) {
    channel[i] = fn(i / sampleRate, i, channel) * volume;
  }

  return buffer;
};

var noteNames = [
  'c',
  'cs',
  'd',
  'ds',
  'e',
  'f',
  'fs',
  'g',
  'gs',
  'a',
  'as',
  'b',
];

var toNoteString = note => {
  var name = noteNames[note % 12];
  var octave = Math.floor(note / 12) - 1;
  return name + octave;
};

var generateNotes = (fn, duration, volume) => {
  var notes = {};

  var createNoteProperty = note => {
    var sound;

    var descriptor = {
      get() {
        if (!sound) {
          sound = generateAudioBuffer(fn(toFreq(note)), duration, volume);
        }

        return sound;
      },
    };

    Object.defineProperty(notes, note, descriptor);
    Object.defineProperty(notes, toNoteString(note), descriptor);
  };

  // From A1 (21) to A7 (105).
  for (var i = 21; i <= 105; i++) {
    createNoteProperty(i);
  }

  return notes;
};

var wet = audioContext.createGain();
wet.gain.value = 0.3;
wet.connect(audioContext.destination);

var dry = audioContext.createGain();
dry.gain.value = 1 - wet.gain.value;
dry.connect(audioContext.destination);

var convolver = audioContext.createConvolver();
convolver.connect(wet);

var master = audioContext.createGain();
master.gain.value = 0.8;
master.connect(dry);
master.connect(convolver);

var impulseResponse = (t, i, a) => {
  return (2 * Math.random() - 1) * Math.pow(a.length, -i / a.length);
};

var impulseResponseBuffer = generateAudioBuffer(impulseResponse, 2, 1);

// Cheap hack for reverb.
var renderLowPassOffline = (
  convolver,
  startFrequency,
  endFrequency,
  duration,
) => {
  var offlineCtx = new OfflineAudioContext(
    1,
    impulseResponseBuffer.length,
    sampleRate,
  );

  var offlineFilter = offlineCtx.createBiquadFilter();
  offlineFilter.type = 'lowpass';
  offlineFilter.Q.value = 0.0001;
  offlineFilter.frequency.value = startFrequency;
  offlineFilter.frequency.linearRampToValueAtTime(endFrequency, duration);
  offlineFilter.connect(offlineCtx.destination);

  var offlineBufferSource = offlineCtx.createBufferSource();
  offlineBufferSource.buffer = impulseResponseBuffer;
  offlineBufferSource.connect(offlineFilter);
  offlineBufferSource.start();

  var render = offlineCtx.startRendering();

  // https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext/startRendering
  if (render !== undefined) {
    // Promises.
    render.then(buffer => (convolver.buffer = buffer));
  } else {
    // Callbacks.
    offlineCtx.oncomplete = event => (convolver.buffer = event.renderedBuffer);
  }
};

// A4 to A3.
renderLowPassOffline(convolver, 1760, 220, 1);

// Oscillators
// f: frequency, t: parameter.
var sin = f => t => Math.sin(t * 2 * Math.PI * f);

var saw = f => t => {
  var n = ((t % (1 / f)) * f) % 1;
  return -1 + 2 * n;
};

var tri = f => t => {
  var n = ((t % (1 / f)) * f) % 1;
  return n < 0.5 ? -1 + 2 * (2 * n) : 1 - 2 * (2 * n);
};

var square = f => t => {
  var n = ((t % (1 / f)) * f) % 1;
  return n > 0.5 ? 1 : -1;
};

var decay = d => () => t => Math.exp(-t * d);

// Brown noise.
// https://github.com/Tonejs/Tone.js/blob/master/Tone/source/Noise.js
var noise = () => {
  var value = 0;

  return () => {
    var step = (value + 0.02 * randFloatSpread(1)) / 1.02;
    value += step;

    // Limit to [-1, 1].
    if (-1 > value || value > 1) {
      value -= step;
    }

    return value * 3.5;
  };
};

// Operators
var add = (a, b) => f => {
  var af = a(f);
  var bf = b(f);

  return t => af(t) + bf(t);
};

var mul = (a, b) => f => {
  var af = a(f);
  var bf = b(f);

  return t => af(t) * bf(t);
};

var zero = () => () => 0;
var one = () => () => 1;

var scale = (fn, n) => f => {
  var fnf = fn(f);
  return t => n * fnf(t);
};

var steps = (f, d) => f * 2 ** (d / 12);

var detune = (fn, d) => f => fn(steps(f, d));

// Sequencer
var d = ms => new Promise(resolve => setTimeout(resolve, ms));

var synthFn = mul(
  add(add(sin, detune(sin, 0.1)), detune(sin, -0.1)),
  decay(16),
);
var drumFn = mul(mul(sin, noise), decay(32));
var snareFn = mul(mul(sin, () => () => randFloatSpread(0.8)), decay(24));
var spaceFn = mul(add(sin, detune(sin, 7)), decay(1));

var synth0 = generateNotes(synthFn, 2, 0.2);
var synth1 = generateNotes(synthFn, 2, 0.2);
var drum0 = generateNotes(drumFn, 2, 0.5);
var snare0 = generateNotes(snareFn, 2, 1);
var space0 = generateNotes(spaceFn, 6, 0.3);

var W = 1000;
var H = W / 2;
var Q = H / 2;
var E = Q / 2;
var S = E / 2;
var T = S / 2;

var play = sound => playSound(sound, master);

export var playSuccess = () => play(space0.e3);
export var playFire = () => play(synth1.a3);
export var playHit = () => play(snare0.a3);
export var playBells = () => play(space0.a2);

var startPlaying = async () => {
  audioContext.resume();
};

var onClick = () => {
  audioContext.resume();
  startPlaying();
  document.removeEventListener('click', onClick);
};

document.addEventListener('click', onClick);
