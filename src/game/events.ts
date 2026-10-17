export const gameEvents = new EventTarget()
export const emitGameEvent = (name:string, detail?:unknown) => gameEvents.dispatchEvent(new CustomEvent(name,{detail}))
