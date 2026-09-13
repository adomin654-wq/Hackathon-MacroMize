"use client";
import "./mize-mascot.css";
import {useEffect,useRef,useState} from 'react';

/** A silent greeting with optional looping and a static reduced-motion fallback. */
export default function MizeMascot({label='Mize, your avocado guide',loop=false}:{label?:string;loop?:boolean}) {
 const video=useRef<HTMLVideoElement>(null);
 const [reduced,setReduced]=useState(true),[visible,setVisible]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>{setReduced(preference.matches);if(preference.matches){video.current?.pause();setVisible(false);}};
  update();preference.addEventListener('change',update);
  return()=>preference.removeEventListener('change',update);
 },[]);
 useEffect(()=>{
  if(reduced||failed)return;
  const play=()=>{const player=video.current;if(!player)return;if(document.hidden)player.pause();else if(loop||!player.ended)void player.play().catch(()=>setFailed(true));};
  play();document.addEventListener('visibilitychange',play);
  return()=>document.removeEventListener('visibilitychange',play);
 },[reduced,failed,loop]);
 return <span className="mize-mascot" role="img" aria-label={label}>
  <img src="/mize-wave.png" alt="" aria-hidden="true" style={{visibility:visible&&!reduced&&!failed?'hidden':'visible'}}/>
  {!reduced&&!failed&&<video ref={video} src="/mize-wave.mp4" poster="/mize-wave.png" muted playsInline autoPlay loop={loop} preload="metadata" aria-hidden="true" disablePictureInPicture onPlaying={()=>setVisible(true)} onError={()=>setFailed(true)} style={{visibility:visible?'visible':'hidden'}}/>}
 </span>;
}
