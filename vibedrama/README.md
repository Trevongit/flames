# VibeDrama

This folder contains a small web app that plays text-to-speech (TTS) audio with a stock-first lookup strategy and offline caching.

## Setup

1. Copy `config.example.json` to `config.json` and fill in the values:
   - `STOCK_BASE`: HTTPS URL of the CDN bucket containing pre-generated audio files.
   - `API_SYNTH`: HTTPS endpoint that will synthesize audio when a stock file is not found.

No secrets should be committed to source control.

## CDN headers

Objects served from `STOCK_BASE` must include the following headers:

```
Content-Type: audio/mpeg (or audio/ogg)
Cache-Control: public, max-age=31536000, immutable
Accept-Ranges: bytes
Access-Control-Allow-Origin: https://<username>.github.io
```

Example bucket policy snippet (AWS S3 style):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket/*",
      "Condition": {
        "StringEquals": {"aws:Referer": "https://<username>.github.io"}
      }
    }
  ]
}
```

## Running on GitHub Pages

Place the contents of this repository in a GitHub Pages site and visit `https://<username>.github.io/vibedrama/vibedrama.html`.
The service worker is registered with scope `/vibedrama/`, so make sure the page is served from that path.

When online, the app checks the local cache, then the stock CDN, and finally the API endpoint to obtain audio. Once an item is played it is cached locally so it can be replayed offline.
