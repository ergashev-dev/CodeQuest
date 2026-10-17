import Phaser from 'phaser'
import { useEffect, useRef } from 'react'
import { WorldScene } from './scenes/WorldScene'

export function GameCanvas(){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{if(!ref.current)return;const game=new Phaser.Game({type:Phaser.AUTO,parent:ref.current,width:1280,height:720,backgroundColor:'#183c31',physics:{default:'arcade',arcade:{gravity:{x:0,y:0},debug:false}},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},fps:{target:60,smoothStep:true},render:{antialias:true,pixelArt:false,roundPixels:true,powerPreference:'high-performance'},scene:[WorldScene]});return()=>game.destroy(true)},[]);return <div id="game-container" ref={ref}/>}
