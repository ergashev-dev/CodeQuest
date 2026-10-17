import { create } from 'zustand'
import type { Appearance, Position, SaveData } from '../types/game'

const initial = { name:'Qahramon', appearance:{skin:'#d6a074',hair:'#352319',outfit:'#24634e'}, health:100, mana:70, xp:0, level:1, coins:24, crystalRestored:false, enemyDefeated:false, position:{x:640,y:500} }
interface GameState extends SaveData {
  terminalOpen:boolean; paused:boolean; interaction:string; toast:string;
  setCharacter:(name:string,appearance:Appearance)=>void; setTerminalOpen:(open:boolean)=>void; setPaused:(paused:boolean)=>void;
  setInteraction:(text:string)=>void; setToast:(text:string)=>void; setPosition:(position:Position)=>void;
  damage:(amount:number)=>void; restoreCrystal:()=>void; defeatEnemy:()=>void; hydrate:(save:SaveData)=>void; reset:()=>void;
}
export const useGameStore = create<GameState>((set) => ({
  version:1,...initial,terminalOpen:false,paused:false,interaction:'',toast:'',
  setCharacter:(name,appearance)=>set({name:name.trim()||'Qahramon',appearance}), setTerminalOpen:(terminalOpen)=>set({terminalOpen}),
  setPaused:(paused)=>set({paused}),setInteraction:(interaction)=>set({interaction}),setToast:(toast)=>set({toast}),setPosition:(position)=>set({position}),
  damage:(amount)=>set((s)=>({health:Math.max(0,s.health-amount)})),
  restoreCrystal:()=>set((s)=>({crystalRestored:true,xp:Math.max(s.xp,60),coins:s.crystalRestored?s.coins:s.coins+30,toast:'Kristall uyg‘ondi! +60 XP  +30 tanga'})),
  defeatEnemy:()=>set((s)=>({enemyDefeated:true,xp:s.enemyDefeated?s.xp:s.xp+25,coins:s.enemyDefeated?s.coins:s.coins+8,toast:'O‘rmon shilimshig‘i yengildi! +25 XP'})),
  hydrate:(save)=>set({...save}), reset:()=>set({version:1,...initial,terminalOpen:false,paused:false,interaction:'',toast:''}),
}))
export const toSaveData = (state:GameState):SaveData => ({version:1,name:state.name,appearance:state.appearance,health:state.health,mana:state.mana,xp:state.xp,level:state.level,coins:state.coins,crystalRestored:state.crystalRestored,enemyDefeated:state.enemyDefeated,position:state.position})
