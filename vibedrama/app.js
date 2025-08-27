(async () => {
  const config = await fetch('./config.json').then(r => r.json()).catch(() => ({}));

  const audio = document.getElementById('audio');
  const speakBtn = document.getElementById('speak');
  const playbackRate = document.getElementById('playbackRate');
  const volume = document.getElementById('volume');

  playbackRate.addEventListener('input', () => {
    audio.playbackRate = parseFloat(playbackRate.value);
  });

  volume.addEventListener('input', () => {
    audio.volume = parseFloat(volume.value);
    if (Tone.Master) {
      Tone.Master.volume.value = Tone.gainToDb(parseFloat(volume.value));
    }
  });

  let sfxInitialized = false;
  const sfx = {};

  async function initializeSFX() {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      sfx.wind = new Tone.Noise('brown').set({ volume: -30, fadeOut: 2 }).toDestination();
      sfx.drips = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: 'exponential' }
      }).toDestination();
      sfx.hum = new Tone.AMOscillator('F#2', 'sine', 'sine').set({ volume: -25, harmonicity: 0.5 }).toDestination();
      sfx.music = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'amsine', harmonicity: 1.01 },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 2 },
        volume: -15
      }).toDestination();
      sfx.reverb = new Tone.Reverb({ decay: 4, wet: 0.4 }).toDestination();
    } catch (err) {
      console.error('Failed to initialize Tone.js SFX', err);
    }
  }

  function handleSfx(action, sound, vol) {
    if (!Tone.context || Tone.context.state !== 'running') return;
    const volume = vol !== undefined ? vol : -30;
    switch (sound) {
      case 'wind':
        if (action === 'start' && sfx.wind.state !== 'started') {
          sfx.wind.set({ volume }).start();
        } else if (action === 'stop' && sfx.wind.state === 'started') {
          sfx.wind.stop();
        }
        break;
      case 'drips':
        if (action === 'start' && !sfx.dripsLoop) {
          sfx.drips.set({ volume });
          sfx.dripsLoop = new Tone.Loop(time => {
            sfx.drips.triggerAttackRelease('C4', '8n', time);
          }, '2.5s').start(0);
          Tone.Transport.start();
        } else if (action === 'stop' && sfx.dripsLoop) {
          sfx.dripsLoop.stop().dispose();
          delete sfx.dripsLoop;
        }
        break;
      case 'hum':
        if (action === 'start' && sfx.hum.state !== 'started') {
          sfx.hum.set({ volume }).start();
        } else if (action === 'stop' && sfx.hum.state === 'started') {
          sfx.hum.stop();
        }
        break;
      default:
        break;
    }
  }

  function normalizeText(text) {
    return text.trim().replace(/\s+/g, ' ');
  }

  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function speak() {
    const text = document.getElementById('text').value;
    const voice = document.getElementById('voice').value;
    const locale = document.getElementById('locale').value;
    const style = document.getElementById('style').value;
    const rate = document.getElementById('rate').value;
    const format = document.getElementById('format').value;

    if (!text.trim()) return;

    if (!config.STOCK_BASE?.startsWith('https://') || !config.API_SYNTH?.startsWith('https://')) {
      console.error('Config URLs must use HTTPS');
      return;
    }

    if (!sfxInitialized) {
      await initializeSFX();
      sfxInitialized = true;
      handleSfx('start', 'wind');
    }

    const normText = normalizeText(text);
    const ext = format === 'ogg' ? 'ogg' : 'mp3';
    const keyRaw = `${voice}|${locale}|${style}|${rate}|${format}|${normText}`;
    const key = await sha256(keyRaw) + `.${ext}`;
    const cachePath = `/vibedrama/audio-cache/${key}`;

    let response = await fetch(cachePath);
    if (!response.ok) {
      response = await fetch(`${config.STOCK_BASE}/${key}`);
      if (!response.ok) {
        response = await fetch(config.API_SYNTH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: normText, voice, locale, style, rate, format, key })
        });
        if (response.ok) {
          const synthBlob = await response.blob();
          const cache = await caches.open('vibedrama-audio');
          await cache.put(cachePath, new Response(synthBlob));
          playBlob(synthBlob);
          return;
        } else {
          console.error('TTS API failed');
          return;
        }
      } else {
        const cache = await caches.open('vibedrama-audio');
        await cache.put(cachePath, response.clone());
      }
    }

    const blob = await response.blob();
    playBlob(blob);
  }

  function playBlob(blob) {
    const url = URL.createObjectURL(blob);
    audio.src = url;
    audio.play();
  }

  speakBtn.addEventListener('click', speak);
})();
