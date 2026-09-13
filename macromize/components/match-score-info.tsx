"use client";
import {useRef} from 'react';
import {matchScoreExplanation} from '../lib/match-score-info';
import './match-score-info.css';
export default function MatchScoreInfo({comparison}:{comparison?:string}){
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 return <><button ref={trigger} type="button" className="match-score-link" aria-haspopup="dialog" onClick={()=>dialog.current?.showModal()}>About the match score</button>
 <dialog ref={dialog} className="match-score-dialog" aria-labelledby="match-score-title" onClose={()=>trigger.current?.focus()}>
 <h2 id="match-score-title">How your match score works</h2>
 {matchScoreExplanation(comparison).map(text=><p key={text}>{text}</p>)}
 <button type="button" className="match-score-close" autoFocus onClick={()=>dialog.current?.close()}>Close</button>
 </dialog></>;
}
