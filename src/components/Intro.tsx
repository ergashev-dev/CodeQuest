import { useEffect, useState } from 'react'
const lines=[
  'Qadim zamonda CodeWorld yaratuvchanlik tili bilan yashar edi.',
  'Har bir mashina, har bir sehr va qadimiy darvoza kod qoidalariga bo‘ysunardi.',
  'Ammo bir kuni Bug King dunyo manbasini zaharladi.',
  'Qadimiy tizimlar quladi. Endi muvozanatni faqat yangi Kod Qahramoni tiklay oladi.'
]
export function Intro({onSkip}:{onSkip:()=>void}){const[index,setIndex]=useState(0);useEffect(()=>{const timer=setInterval(()=>setIndex(i=>{if(i===lines.length-1){clearInterval(timer);setTimeout(onSkip,1800);return i}return i+1}),2600);return()=>clearInterval(timer)},[onSkip]);return <section className="cinematic"><div className="fog"/><div className="crystal"/><p key={index} className="narration">{lines[index]}</p><button className="skip" onClick={onSkip}>INTRO’NI O‘TKAZISH →</button></section>}
