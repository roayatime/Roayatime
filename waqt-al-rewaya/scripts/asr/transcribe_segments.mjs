// Usage (from scripts/asr after `npm install --ignore-scripts`):
//   ffmpeg -i ../../source/test1.m4a -ac 1 -ar 16000 -f f32le in16k.f32
//   node transcribe_segments.mjs "[[9.4,12.4],[13.6,14.2]]" Xenova/whisper-small ./node_modules/sts-whisper-small/models/ 5
// Args: JSON list of [start,end] seconds, model id, local model root, beam count.
import { pipeline, env } from '@huggingface/transformers';
import fs from 'fs';
env.allowRemoteModels = false;
const [model, root, beams] = [process.argv[3], process.argv[4], +process.argv[5]];
env.localModelPath = root;
const buf = fs.readFileSync('in16k.f32');
const audio = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
const segs = JSON.parse(process.argv[2]);
const asr = await pipeline('automatic-speech-recognition', model, { dtype: 'q8', device: 'cpu' });
for (const [a,b] of segs) {
  const s = audio.slice(Math.max(0,Math.round((a-0.3)*16000)), Math.round((b+0.3)*16000));
  const out = await asr(s, { language: 'arabic', task: 'transcribe', num_beams: beams });
  console.log(`${a.toFixed(2)}-${b.toFixed(2)}\t${out.text}`);
}
