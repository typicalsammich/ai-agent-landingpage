'use client';
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, ArrowUpRight, Headphones, Volume2, Check, RotateCcw } from 'lucide-react';
import { scenarios } from '@/lib/scenarios';
export function Wave({ compact = false }: { compact?: boolean }) { return <div className={`wave ${compact ? 'compact' : ''}`} aria-hidden="true">{Array.from({ length: 75 }, (_, i) => <i key={i} style={{ height: `${Math.round(10 + Math.abs(Math.sin(i * 1.7) * Math.sin(i * .19)) * 90)}%`, animationDelay: `${(i * .03).toFixed(2)}s` }} />)}</div>; }
const time = (n: number) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
export default function Studio() {
 const [selected, setSelected] = useState(0), [playing, setPlaying] = useState(false), [position, setPosition] = useState(0), [duration, setDuration] = useState(0), [speed, setSpeed] = useState(1), [volume, setVolume] = useState(.8), [active, setActive] = useState(-1), [error, setError] = useState(''), [loading, setLoading] = useState(false);
 const audio = useRef<HTMLAudioElement>(null), canvas = useRef<HTMLCanvasElement>(null), context = useRef<AudioContext | null>(null), analyser = useRef<AnalyserNode | null>(null), playingRef = useRef(false), generation = useRef(0);
 const scenario = scenarios[selected];
 useEffect(() => { playingRef.current = playing; }, [playing]);
 useEffect(() => { return () => { generation.current++; window.speechSynthesis?.cancel(); context.current?.close(); }; }, []);
 const stop = () => { generation.current++; window.speechSynthesis?.cancel(); audio.current?.pause(); setPlaying(false); setActive(-1); };
 const choose = (i: number) => { stop(); setSelected(i); setPosition(0); setDuration(0); setError(''); };
 const speak = (index: number, token: number) => {
  if (token !== generation.current) return;
  if (index >= scenario.transcript.length) { setPlaying(false); setActive(-1); return; }
  const segment = scenario.transcript[index]; const utterance = new SpeechSynthesisUtterance(segment.text);
  const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
  utterance.voice = voices[segment.speaker === 'ai' ? 0 : Math.min(1, voices.length - 1)] ?? null;
  utterance.rate = speed; utterance.volume = volume; setActive(index);
  utterance.onend = () => speak(index + 1, token);
  utterance.onerror = e => { if (e.error !== 'interrupted' && e.error !== 'canceled') { setError('Browser narration is unavailable. You can read the full demonstration transcript.'); setPlaying(false); } };
  window.speechSynthesis.speak(utterance);
 };
 const draw = () => { if (!analyser.current || !canvas.current) return; const data = new Uint8Array(analyser.current.frequencyBinCount); const paint = () => { if (!canvas.current || !analyser.current) return; analyser.current.getByteFrequencyData(data); const c = canvas.current.getContext('2d')!; c.clearRect(0, 0, 700, 180); c.fillStyle = '#56dfa0'; for (let i = 0; i < 70; i++) { const h = Math.max(2, data[i] / 255 * 160); c.fillRect(i * 10, (180 - h) / 2, 3, h); } if (playingRef.current) requestAnimationFrame(paint); }; requestAnimationFrame(paint); };
 const toggle = async () => {
  setError('');
  if (!scenario.audioUrl) {
   if (!('speechSynthesis' in window)) { setError('Your browser does not support narration. Read the demonstration transcript below.'); return; }
   if (playing) { window.speechSynthesis.pause(); setPlaying(false); }
   else { setPlaying(true); if (window.speechSynthesis.paused) window.speechSynthesis.resume(); else { generation.current++; speak(0, generation.current); } } return;
  }
  if (playing) { audio.current?.pause(); setPlaying(false); return; }
  try { setLoading(true); if (!context.current) { context.current = new AudioContext(); analyser.current = context.current.createAnalyser(); const source = context.current.createMediaElementSource(audio.current!); source.connect(analyser.current); analyser.current.connect(context.current.destination); } await context.current.resume(); await audio.current!.play(); setPlaying(true); playingRef.current = true; draw(); } catch { setError('Recording could not be loaded. Please try again or read the transcript.'); } finally { setLoading(false); }
 };
 return <section id="studio" className="section studio-section"><div className="section-top"><div><span className="eyebrow">01 / THE VOICE EXPERIENCE STUDIO</span><h2>Don’t just read about it.<br/><em>Hear it.</em></h2></div><p>A first impression you can listen to.<br/>Explore the conversations behind a better caller experience.</p></div>
 <div className="studio"><aside className="scenario-list"><span className="micro">CHOOSE A CONVERSATION</span>{scenarios.map((s, i) => <button key={s.id} className={i === selected ? 'scenario selected' : 'scenario'} onClick={() => choose(i)}><span className="scenario-num">0{i + 1}</span><span>{s.industry}<small>{['Emergency service','Appointment request','Service inquiry','Estimate request','Business questions','Lead capture'][i]}</small></span><ArrowUpRight size={15}/></button>)}</aside>
 <div className="player"><div className="player-top"><span className="badge"><span className="dot"/> {scenario.isDemonstration ? 'DEMONSTRATION' : 'APPROVED RECORDING'}</span><Headphones size={19}/></div><div className="disc"><div><span>V</span><i/></div></div><span className="micro">{scenario.industry.toUpperCase()} / VOICE DEMO</span><h3>{scenario.title}</h3><p>{scenario.description}</p>
 {scenario.audioUrl ? <canvas ref={canvas} width="700" height="180" aria-label="Audio frequency visualization"/> : <Wave compact/>}
 {scenario.audioUrl ? <><input aria-label="Seek recording" type="range" min="0" max={duration || 1} step=".1" value={position} onChange={e => { audio.current!.currentTime = Number(e.target.value); setPosition(Number(e.target.value)); }}/><div className="time"><span>{time(position)}</span><span>{time(duration)}</span></div></> : <div className="narration-note">Browser-narrated script · not a production voice recording</div>}
 <div className="transport"><button className="icon-button" aria-label="Restart demonstration" onClick={() => { stop(); if (audio.current) audio.current.currentTime = 0; setPosition(0); }}><RotateCcw size={17}/></button><button className="play" aria-label={playing ? 'Pause demonstration' : 'Play demonstration'} onClick={toggle} disabled={loading}>{playing ? <Pause fill="currentColor" size={20}/> : <Play fill="currentColor" size={20}/>}</button><label className="speed"><span className="sr-only">Playback speed</span><select value={speed} onChange={e => { setSpeed(Number(e.target.value)); if (audio.current) audio.current.playbackRate = Number(e.target.value); }}>{[.75,1,1.25,1.5].map(n => <option key={n} value={n}>{n}×</option>)}</select></label></div>
 <label className="volume"><Volume2 size={15}/><span className="sr-only">Volume</span><input type="range" min="0" max="1" step=".05" value={volume} onChange={e => { setVolume(Number(e.target.value)); if (audio.current) audio.current.volume = Number(e.target.value); }}/></label><p role="status" className="error">{loading ? 'Loading recording…' : error}</p>
 <audio ref={audio} src={scenario.audioUrl} preload="metadata" crossOrigin="anonymous" onLoadedMetadata={() => { setDuration(audio.current!.duration); audio.current!.volume = volume; audio.current!.playbackRate = speed; }} onTimeUpdate={() => { const t = audio.current!.currentTime; setPosition(t); setActive(scenario.transcript.findIndex(x => x.startTime !== undefined && t >= x.startTime && t < (x.endTime ?? Infinity))); }} onEnded={() => { setPlaying(false); setActive(-1); }} onError={() => scenario.audioUrl && setError('Recording unavailable. The transcript is still available.')}/>
 </div><aside className="transcript"><div className="transcript-head"><span className="micro">THE CONVERSATION</span><span className="live-label">{scenario.audioUrl ? 'TRANSCRIPT' : 'SCRIPT'}</span></div><div className="messages">{scenario.transcript.map((line, i) => <div key={i} className={`message ${line.speaker} ${active === i ? 'active' : ''}`}><span>{line.speaker === 'ai' ? 'V / AI RECEPTIONIST' : 'CALLER'}</span>{line.startTime !== undefined && scenario.audioUrl ? <button onClick={() => { audio.current!.currentTime = line.startTime!; }}>{line.text}</button> : <p>{line.text}</p>}</div>)}</div><div className="outcomes"><span className="micro">{scenario.isDemonstration ? 'ILLUSTRATIVE OUTCOME' : 'CALL OUTCOME'}</span>{scenario.outcomes.map(o => <div key={o}><Check size={14}/>{o}</div>)}</div></aside></div>
 <div className="section-foot"><span>Fictional businesses. Illustrative conversations. No customer data.</span><a href="#design">Make this your business’s voice <ArrowUpRight size={14}/></a></div></section>;
}


