import { useEffect, useState } from 'react'
import { CharacterCreator } from './components/CharacterCreator'
import { CodeTerminal } from './components/CodeTerminal'
import { HUD } from './components/HUD'
import { Intro } from './components/Intro'
import { GameCanvas } from './game/GameCanvas'
import { loadGame, resetGame, saveGame } from './game/systems/saveSystem'
import { useGameStore } from './stores/gameStore'
import type { Screen } from './types/game'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [hasSave, setHasSave] = useState(false)
  const terminalOpen = useGameStore((state) => state.terminalOpen)
  const paused = useGameStore((state) => state.paused)
  const setPaused = useGameStore((state) => state.setPaused)

  useEffect(() => {
    void loadGame().then((save) => {
      setHasSave(Boolean(save))
      if (save) useGameStore.getState().hydrate(save)
    })
  }, [])

  const beginNew = async () => {
    await resetGame()
    useGameStore.getState().reset()
    setScreen('intro')
  }

  return (
    <main className={`app-shell screen-${screen}`}>
      {screen === 'landing' && (
        <section className="landing">
          <div className="sky-glow" /><div className="mountains mountain-back" /><div className="mountains mountain-front" />
          <div className="hero-silhouette"><span className="sword-glint" /></div>
          <div className="landing-copy">
            <p className="eyebrow">KOD — BU SEHR. MANTIQ — QUROL.</p>
            <h1><span>CODE</span>QUEST</h1>
            <p className="tagline">Unutilgan dunyoni uyg‘ot. Dasturlash kuchini egalla.</p>
            <div className="landing-actions">
              <button className="fantasy-button primary" onClick={beginNew}>Yangi sarguzasht</button>
              <button className="fantasy-button" disabled={!hasSave} onClick={() => setScreen('game')}>Davom etish</button>
            </div>
            <div className="feature-runes"><span>⚔ Real-time jang</span><span>{'{ }'} Haqiqiy JavaScript</span><span>✦ Ochiq dunyo</span></div>
          </div>
          <div className="scroll-cue">GREENHAVEN CHAQIRMOQDA <i /></div>
        </section>
      )}
      {screen === 'intro' && <Intro onSkip={() => setScreen('creator')} />}
      {screen === 'creator' && <CharacterCreator onComplete={() => setScreen('game')} />}
      {screen === 'game' && (
        <section className="game-screen">
          <GameCanvas /><HUD />
          {terminalOpen && <CodeTerminal />}
          {paused && (
            <div className="modal-backdrop"><div className="parchment-panel pause-panel">
              <p className="eyebrow">SARGUZASHT TO‘XTATILDI</p><h2>Pauza</h2>
              <button className="fantasy-button primary" onClick={() => setPaused(false)}>Davom etish</button>
              <button className="fantasy-button" onClick={() => void saveGame(useGameStore.getState()).then(() => setHasSave(true))}>Saqlash</button>
              <button className="fantasy-button" onClick={() => { setPaused(false); setScreen('landing') }}>Bosh menyu</button>
            </div></div>
          )}
        </section>
      )}
    </main>
  )
}
