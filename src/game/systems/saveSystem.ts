import { openDB } from 'idb'
import { toSaveData } from '../../stores/gameStore'
import type { SaveData } from '../../types/game'

const db = () => openDB('codequest-saves',1,{upgrade(database){if(!database.objectStoreNames.contains('saves'))database.createObjectStore('saves')}})
export async function saveGame(state:Parameters<typeof toSaveData>[0]) { const database=await db(); await database.put('saves',toSaveData(state),'slot-1') }
export async function loadGame():Promise<SaveData|null>{try{const value=await (await db()).get('saves','slot-1') as SaveData|undefined;return value?.version===1?value:null}catch{return null}}
export async function resetGame(){try{await (await db()).delete('saves','slot-1')}catch{ /* first run */ }}
