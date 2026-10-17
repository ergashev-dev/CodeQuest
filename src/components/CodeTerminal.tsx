import { useEffect, useRef, useState } from 'react'
import { runSandbox } from '../coding/runtime/runSandbox'
import { emitGameEvent } from '../game/events'
import { saveGame } from '../game/systems/saveSystem'
import { useGameStore } from '../stores/gameStore'

const starter = `// Kristall uchun yetarli quvvat belgilang
const crystalPower = 0;

// Quvvat 100 bo‘lsa darvozani oching
const gateUnlocked = false;`

export function CodeTerminal() {
  const [code,setCode]=useState(starter)
  const [hint,setHint]=useState(false)
  const [output,setOutput]=useState('Kod tayyor. Qiymatlarni o‘zgartirib, sinovni boshlang.')
  const [status,setStatus]=useState<'idle'|'success'|'error'>('idle')
  const [busy,setBusy]=useState(false)
  const editorRef=useRef<HTMLTextAreaElement>(null)
  const close=()=>useGameStore.getState().setTerminalOpen(false)

  useEffect(()=>{editorRef.current?.focus()},[])

  const run=async()=>{
    setBusy(true);setStatus('idle');setOutput('QuickJS xavfsiz muhitni tayyorlamoqda…')
    const result=await runSandbox(code)
    setBusy(false)
    if(result.ok){
      setStatus('success');setOutput('Barcha sinovlar o‘tdi! Kristall va darvoza uyg‘ondi.')
      useGameStore.getState().restoreCrystal();emitGameEvent('crystal-restored')
      await saveGame(useGameStore.getState());setTimeout(close,1200)
    }else{setStatus('error');setOutput(result.error??'Yechim hali to‘g‘ri emas.')}
  }

  return <div className="modal-backdrop" onKeyDown={event=>event.stopPropagation()} onKeyUp={event=>event.stopPropagation()}>
    <div className="terminal">
      <aside className="terminal-brief">
        <p className="eyebrow">SEHRLI TERMINAL · JS 01</p><h2>Uyg‘onish kristalli</h2>
        <p>Kristallni qayta yoqish uchun ikkita haqiqiy JavaScript o‘zgaruvchisini to‘g‘ri qiymat bilan belgilang.</p>
        <ul><li><code>crystalPower</code> qiymati <strong>100</strong></li><li><code>gateUnlocked</code> qiymati <strong>true</strong></li></ul>
        {hint&&<div className="hint-box">2-qatordagi <code>0</code> o‘rniga <code>100</code>, oxirgi qatordagi <code>false</code> o‘rniga <code>true</code> yozing.</div>}
      </aside>
      <section className="terminal-editor">
        <div className="editor-bar"><span>✦ crystal-awakening.js</span><span>JavaScript · QuickJS sandbox</span><button className="skip" style={{position:'static'}} onClick={close}>YOPISH ×</button></div>
        <div className="code-editor-wrap">
          <div className="line-numbers" aria-hidden="true">{code.split('\n').map((_,index)=><span key={index}>{index+1}</span>)}</div>
          <textarea ref={editorRef} data-testid="code-input" aria-label="JavaScript kod muharriri" className="code-input" value={code} onChange={event=>setCode(event.target.value)} spellCheck={false} autoCapitalize="off" autoCorrect="off" />
        </div>
        <div role="status" className={`output ${status}`}>{output}</div>
        <div className="editor-actions">
          <button onClick={()=>{setCode(starter);setStatus('idle');setOutput('Boshlang‘ich kod qayta tiklandi.');setTimeout(()=>editorRef.current?.focus(),0)}}>Qayta tiklash</button>
          <button onClick={()=>setHint(value=>!value)}>Maslahat</button>
          <button className="run" disabled={busy} onClick={run}>{busy?'TEKSHIRILMOQDA…':'▶ KODNI ISHGA TUSHIRISH'}</button>
        </div>
      </section>
    </div>
  </div>
}
