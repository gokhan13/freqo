import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioEngine } from '../../src/audio';
import { makeQuestion } from '../../src/model';

// A deterministic transport fake: buffers are real PCM from the application,
// but lifecycle events and the audio clock are controlled independently of timers.
type Source = { buffer: unknown; loop: boolean; onended: (()=>void)|null; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> };
const contexts: Context[] = [], engines: AudioEngine[] = [];
class Context {
  currentTime=0; sampleRate=8000; state='running'; destination={}; sources: Source[]=[];
  constructor(){contexts.push(this);}
  async resume() {}
  addEventListener() {}
  createGain(){return {gain:{value:1,setTargetAtTime:vi.fn(),cancelScheduledValues:vi.fn()},connect:vi.fn(),disconnect:vi.fn()};}
  createBuffer(channels:number,length:number,rate:number){
    const data=Array.from({length:channels},()=>new Float32Array(length));
    return {duration:length/rate,length,numberOfChannels:channels,sampleRate:rate,copyToChannel:(input:Float32Array,channel:number)=>data[channel].set(input),getChannelData:(channel:number)=>data[channel]};
  }
  createBufferSource(){const source:Source={buffer:null,loop:false,onended:null,connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn()};this.sources.push(source);return source;}
}
function engine(){vi.stubGlobal('AudioContext',Context);const e=new AudioEngine();engines.push(e);return e;}
afterEach(()=>{engines.splice(0).forEach(e=>e.stop());contexts.length=0;vi.useRealTimers();vi.unstubAllGlobals();});

describe('audio lifecycle contracts',()=>{
  it('marks natural completion before idle, so exam and tap consumers do not classify it as cancellation',async()=>{
    const e=engine();let played=false,completed=false,interrupted=false;
    e.subscribe(s=>{if(s==='playing')played=true;if(s==='idle'&&played&&!completed)interrupted=true;});
    expect(await e.play(makeQuestion('direction-1',123,0),'a',()=>{completed=true;})).toBe(true);
    contexts[0].sources[0].onended!();
    expect(completed).toBe(true);expect(interrupted).toBe(false);expect(e.status).toBe('idle');
  });
  it('allows immediate playback from a completion callback and ignores a stale second completion',async()=>{
    const e=engine(),q=makeQuestion('memory-1',123,0),done=vi.fn();let next:Promise<boolean>|undefined;
    await e.play(q,'a',()=>{next=e.play(q,'b',done);});
    const ended=contexts[0].sources[0].onended!;ended();ended();
    expect(await next).toBe(true);expect(e.status).toBe('playing');
    const b=contexts[0].sources.at(-1)!;expect(b.stop).not.toHaveBeenCalled();
    b.onended!();expect(done).toHaveBeenCalledTimes(1);expect(e.status).toBe('idle');
  });
  it('credits each audible variant using audio time, never elapsed timer time, and cancels pending credit on stop',async()=>{
    vi.useFakeTimers();const e=engine(),q=makeQuestion('loudness-1',123,0),a=vi.fn(),b=vi.fn();
    await e.play(q,'a',a);const context=contexts[0];
    vi.advanceTimersByTime(2000);expect(a).not.toHaveBeenCalled();
    context.currentTime=1.1;vi.advanceTimersByTime(50);expect(a).toHaveBeenCalledTimes(1);
    await e.play(q,'b',b);vi.advanceTimersByTime(2000);expect(b).not.toHaveBeenCalled();
    context.currentTime=2;vi.advanceTimersByTime(50);expect(b).not.toHaveBeenCalled();
    context.currentTime=2.2;vi.advanceTimersByTime(50);expect(b).toHaveBeenCalledTimes(1);
    await e.play(q,'a',a);e.stop();context.currentTime=10;vi.advanceTimersByTime(2000);
    expect(a).toHaveBeenCalledTimes(1);expect(b).toHaveBeenCalledTimes(1);
  });
});
