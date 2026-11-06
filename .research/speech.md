# Speech-to-text options for Bulgarian/English classroom app (researched 2026-11-06)

**Source caveat.** The sandbox could only fetch `platform.claude.com` and `raw.githubusercontent.com`. MDN, caniuse and all vendor sites (OpenAI, Groq, Deepgram, AssemblyAI, Mistral, ElevenLabs, Azure) failed DNS. So:
- **[P]** = primary, fetched now (MDN source markdown and browser-compat-data from raw.githubusercontent.com; Anthropic docs).
- **[S]** = secondary, from web-search snippets only. Verify on the vendor page before committing. Prices drift.

## A. Web Speech API (SpeechRecognition / webkitSpeechRecognition)

Support per MDN browser-compat-data [P] (https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/SpeechRecognition.json):
- Chrome desktop: `webkit`-prefixed since v33; unprefixed `SpeechRecognition` from v139. Page must be served over a web server, not file://.
- Chrome Android and Edge: mirror Chrome.
- Safari macOS/iOS: `webkit` prefix, since 14.1.
- Firefox: BCD lists v160 (`SpeechRecognition`, `continuous`, `processLocally`). Treat Firefox as unreliable until you test it. Feature-detect.
- Chrome OS: not a separate BCD entry; Chrome desktop applies. A Chrome dev-list post [S] says on-device Web Speech was disabled on ChromeOS because the implementation was incomplete. Cloud mode is what ChromeOS gets.
- `continuous`: Chrome 33+. **Chrome Android: property can be set but has no effect** (crbug.com/41297427). Safari 17+ OK; Safari 14.1-16 returns multiple results when false (partial).
- `processLocally` (on-device): Chrome 139+ desktop only. Not Chrome Android, not Safari.

Privacy [P] (https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/api/speechrecognition/index.md): "On some browsers, like Chrome, ... a server-based recognition engine. Your audio is sent to a web service." This is not offline. `processLocally = true` keeps audio on the device but needs an installed language pack. Otherwise `start()` fails with `language-not-supported`. Check with `SpeechRecognition.available({langs:['bg-BG'], processLocally:true})` and `install()`. MDN's page does not name Google. Chrome's cloud engine is widely documented as Google's.

`lang='bg-BG'`: MDN does not publish a language list. Demo code [S] lists bg-BG for Chrome's cloud engine. On-device bg-BG is unconfirmed, so test it. Safari's language support depends on Siri/dictation languages and was not verifiable here.

Continuous limits: Chrome's session ends after silence or a few minutes (known behavior, not on MDN). Restart in the `onend` handler. Android can't do true continuous (above).

Alongside MediaRecorder on the same mic stream: the spec gives `SpeechRecognition` no way to take a MediaStream, so it opens its own mic. Behavior is browser-specific and was not verifiable here. Expect contention on mobile (especially iOS Safari). Test on real devices. Safer: one pipeline only.

## B. Server-side APIs (Bulgarian)

| Provider / model | Bulgarian | Price / audio min | Max file / duration | Latency | EU processing | ZDR | Src |
|---|---|---|---|---|---|---|---|
| OpenAI whisper-1 | yes (Whisper lang) | $0.006 | 25 MB | seconds (batch) | EU residency (eu.api.openai.com), new Projects only; endpoint eligibility unconfirmed | claimed with EU residency; approval needed | [S] |
| OpenAI gpt-4o-transcribe | yes (unconfirmed list) | ~$0.006 | 25 MB (assumed) | seconds | as above | as above | [S] |
| OpenAI gpt-4o-mini-transcribe | yes (unconfirmed) | ~$0.003 | 25 MB (assumed) | seconds | as above | as above | [S] |
| Groq whisper-large-v3-turbo | yes (Whisper) | $0.04/hr = $0.00067 | 25 MB free, 100 MB dev | very fast (>100x realtime) | not confirmed (US infra) | not confirmed | [S] |
| Deepgram nova-3 | **yes, `bg`** (added Nov 2025; improved Aug 2026). Docs page also lists bg under Nova-2: verify | ~$0.0043-0.0048 (sources conflict) | not found | streaming + batch | **yes: api.eu.deepgram.com** (GA 2025-12-03; Whisper models not on EU) | not confirmed | [S] |
| AssemblyAI Universal-2 | not confirmed (99-lang claim) | $0.15/hr = $0.0025 | not found | async | EU endpoint not confirmed | not confirmed | [S] |
| Mistral Voxtral Mini Transcribe (v2/3) | likely (24 EU langs claimed by one source; conflicting) | ~$0.003-0.0035 | not found | fast | Mistral is EU company; hosting region not confirmed | not confirmed | [S] |
| ElevenLabs Scribe v2 | likely (90+ langs; Bulgarian not confirmed) | $0.22/hr = $0.0037 (FAQ also says $0.40/hr) | 3 GB / 10 h (one blog) | batch | not confirmed | not confirmed | [S] |
| Google Cloud STT v2 Chirp 3 | **yes, bg-BG (Preview status)** | ~$0.016 (list) | not found | batch/streaming | regional endpoints exist; bg-BG region availability not confirmed | not confirmed | [S] |
| Azure AI Speech fast transcription | bg-BG not confirmed here (Azure Speech normally lists bg-BG) | $0.36/hr = $0.006 (East US) | not found | fast | yes, EU regions (West Europe etc.); price there not found | not confirmed | [S] |

URLs:
- OpenAI pricing and residency: https://openai.com/index/introducing-data-residency-in-europe/ ; https://cekura.ai/blogs/whisper-api-pricing
- Groq: https://groq.com/pricing ; https://dev.to/build996/free-whisper-api-groq-deepgram-assemblyai-compared-562m
- Deepgram: https://developers.deepgram.com/reference/regional-endpoints ; https://deepgram.com/blog/deepgram-expands-nova-3-with-11-new-languages-across-europe-and-asia ; https://developers.deepgram.com/changelog/2026/8/7
- AssemblyAI: https://www.assemblyai.com/pricing.md
- Mistral: https://the-decoder.com/voxtral-transcribe-2-offers-speech-recognition-at-0-003-per-minute/
- ElevenLabs: https://developer.puter.com/tutorials/elevenlabs-api-pricing/
- Google: https://cloud.google.com/speech-to-text/v2/docs/chirp_3-model ; https://cloud.google.com/speech-to-text/pricing
- Azure: https://azure.microsoft.com/en-gb/pricing/details/speech/

Open items to verify on vendor pages: OpenAI gpt-4o-* file limits and whether `/audio/transcriptions` is EU-residency and ZDR eligible; Mistral and ElevenLabs Bulgarian lists; any vendor's ZDR terms.

## C. Claude API audio input

**No.** Fetched https://platform.claude.com/docs/en/build-with-claude/overview [P]: the feature list has Vision (images) and PDF support, and no audio. The Messages API reference (https://platform.claude.com/docs/en/api/messages/create.md) has zero mentions of "audio"; request content blocks are text, image, document, search_result, tool_use/tool_result, thinking, container_upload. Claude cannot transcribe speech, so pair a separate STT service with Claude for grading/feedback on the transcript.

## D. MediaRecorder

- Support [P] (browser-compat-data MediaRecorder.json): Chrome 47+, Edge, Firefox 25+, Safari macOS 14.1+, **Safari iOS 14+** (Chrome Android mirrors Chrome). So yes, iOS Safari supports it.
- MIME types [S/MDN example list]: Chrome/Edge/Firefox: `audio/webm;codecs=opus` (Firefox also `audio/ogg;codecs=opus`). Safari up to 18.3: `audio/mp4` (AAC) only. Safari 18.4+ (Mar 2025): also `audio/webm;codecs=opus` and Ogg [S: WebKit release summaries via search]. Chrome may produce mp4 only where an OS encoder exists.
- Detect [P] (https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/api/mediarecorder/istypesupported_static/index.md):
  ```js
  const mime = ['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus']
    .find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
  const rec = new MediaRecorder(stream, mime ? {mimeType: mime} : undefined);
  // after recording, use rec.mimeType for the Blob type and upload extension
  ```
  Also feature-detect `'MediaRecorder' in window`. All listed server APIs accept webm/opus and mp4/aac (verify per vendor).

## Recommendation

- **Cheapest reliable with Bulgarian + EU processing:** Deepgram Nova-3 on `api.eu.deepgram.com` (`language=bg`, ~$0.0045/min, EU hosting stated in Deepgram's regional-endpoint docs). Check the bg quality on teen speech and the EU price. Runner-ups: Mistral Voxtral Mini (~$0.0035/min, EU vendor; confirm Bulgarian and region), OpenAI gpt-4o-mini-transcribe via eu.api.openai.com (~$0.003/min, new EU Projects only; confirm endpoint eligibility). Groq is cheapest per minute ($0.00067) and fast but has no confirmed EU region, so it is a poor fit for minors' data.
- **Best free / browser-only:** Web Speech API (Chrome/Edge/Safari) with `lang` en-US / bg-BG, `processLocally` when `available()` says yes, and a fallback of a typed answer or server STT when it is unsupported (Firefox, Chrome Android continuous). Privacy: default mode sends audio to a cloud service, which needs consent for under-18s (GDPR). Do not run it concurrently with MediaRecorder without device testing.
- Pipeline: MediaRecorder (pick the mime via `isTypeSupported`) -> upload -> EU STT -> transcript -> Claude (text only) for feedback.
