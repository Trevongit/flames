# Flames VibeVoice Integration

This project demonstrates how to use [Microsoft VibeVoice](https://github.com/microsoft/VibeVoice) to generate dialogue for the audio drama pages.

## Prerequisites
- Node.js 18 or later
- Git
- At least 4 GB RAM and a few GB of disk space for model files

## Download and Build VibeVoice
```bash
# clone the VibeVoice repository
git clone https://github.com/microsoft/VibeVoice
cd VibeVoice

# install dependencies and build the Node.js backend
npm install
npm run build
```

## Obtain a Model
Download a VibeVoice model checkpoint and place it on disk.  Check the project README for the latest list of available models.

## Run the Inference Service
```bash
# from the VibeVoice repository
node server.js --model /path/to/model
```
The server listens on `http://localhost:3000/tts` by default and returns raw PCM or MP3 audio for the provided text.

## Using in This Project
`dramaplay1a.html` calls the local VibeVoice endpoint.  The returned audio is converted to a `Blob` for playback and cached in `localStorage`.

Start the server as shown above and open `dramaplay1a.html` in a browser to hear generated speech.
