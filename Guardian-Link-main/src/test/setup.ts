/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom';

// Mock Web APIs that are not available in jsdom
global.MediaRecorder = class MockMediaRecorder {
  static isTypeSupported = () => true;
  start = vi.fn();
  stop = vi.fn();
  pause = vi.fn();
  resume = vi.fn();
  requestData = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
  state = 'inactive';
  stream = null;
  mimeType = '';
  videoBitsPerSecond = 0;
  audioBitsPerSecond = 0;
  ondataavailable = null;
  onerror = null;
  onpause = null;
  onresume = null;
  onstart = null;
  onstop = null;
} as any;

// Mock Web Speech API
global.SpeechRecognition = class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'en-US';
  maxAlternatives = 1;
  serviceURI = '';
  grammars = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
  onaudiostart = null;
  onaudioend = null;
  onend = null;
  onerror = null;
  onnomatch = null;
  onresult = null;
  onsoundstart = null;
  onsoundend = null;
  onspeechstart = null;
  onspeechend = null;
  onstart = null;
} as any;

global.webkitSpeechRecognition = global.SpeechRecognition;

// Mock Web Audio API
global.AudioContext = class MockAudioContext {
  state = 'running';
  sampleRate = 44100;
  currentTime = 0;
  destination = {} as any;
  listener = {} as any;
  createAnalyser = vi.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    minDecibels: -100,
    maxDecibels: -30,
    smoothingTimeConstant: 0.8,
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
    getFloatFrequencyData: vi.fn(),
    getFloatTimeDomainData: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn()
  }));
  createGain = vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn(),
    disconnect: vi.fn()
  }));
  createMediaStreamSource = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn()
  }));
  close = vi.fn();
  resume = vi.fn();
  suspend = vi.fn();
} as any;

global.webkitAudioContext = global.AudioContext;

// Mock getUserMedia
global.navigator.mediaDevices = {
  getUserMedia: vi.fn(() => Promise.resolve({
    getTracks: () => [],
    getAudioTracks: () => [],
    getVideoTracks: () => [],
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  } as any))
} as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.localStorage = localStorageMock;

// Mock IndexedDB
global.indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  cmp: vi.fn()
} as any;

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock Worker
global.Worker = class MockWorker {
  constructor(public url: string) {}
  postMessage = vi.fn();
  terminate = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
  onmessage = null;
  onerror = null;
} as any;