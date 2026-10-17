import Phaser from 'phaser'
import { gameEvents } from '../events'
import { saveGame } from '../systems/saveSystem'
import { useGameStore } from '../../stores/gameStore'

type EnemyMode='idle'|'chase'|'attack'|'dead'
export class WorldScene extends Phaser.Scene{
  private player!:Phaser.Physics.Arcade.Sprite;private enemy!:Phaser.Physics.Arcade.Sprite;private gate!:Phaser.GameObjects.Container;private crystal!:Phaser.GameObjects.Container
  private cursors!:Phaser.Types.Input.Keyboard.CursorKeys;private keys!:Record<'w'|'a'|'s'|'d'|'shift'|'e'|'esc',Phaser.Input.Keyboard.Key>
  private obstacles!:Phaser.Physics.Arcade.StaticGroup;private mode:EnemyMode='idle';private lastAttack=0;private dashReady=0;private enemyHp=3;private facing=new Phaser.Math.Vector2(1,0);private promptTarget:''|'npc'|'terminal'|'checkpoint'=''
  private crystalHandler=()=>this.restoreWorldEffect()
  constructor(){super('world')}
  create(){
    this.makeTextures();this.physics.world.setBounds(0,0,2400,1600);this.cameras.main.setBounds(0,0,2400,1600);this.drawWorld();
    this.obstacles=this.physics.add.staticGroup();this.addBoundaries();this.addVillage();
    const state=useGameStore.getState();this.player=this.physics.add.sprite(state.position.x,state.position.y,'hero').setCollideWorldBounds(true).setDepth(20);this.player.body!.setSize(38,44).setOffset(13,18)
    this.enemy=this.physics.add.sprite(1120,760,'slime').setDepth(18);this.enemy.body!.setSize(54,38).setOffset(5,20);if(state.enemyDefeated)this.enemy.disableBody(true,true)
    this.physics.add.collider(this.player,this.obstacles);this.physics.add.collider(this.enemy,this.obstacles)
    this.cameras.main.startFollow(this.player,true,.08,.08);this.cameras.main.setZoom(1.1)
    this.cursors=this.input.keyboard!.createCursorKeys();this.keys=this.input.keyboard!.addKeys({w:'W',a:'A',s:'S',d:'D',shift:'SHIFT',e:'E',esc:'ESC'}) as typeof this.keys
    this.input.on('pointerdown',()=>this.attack());this.keys.e.on('down',()=>this.interact());this.keys.esc.on('down',()=>{const s=useGameStore.getState();if(!s.terminalOpen)s.setPaused(!s.paused)})
    gameEvents.addEventListener('crystal-restored',this.crystalHandler);if(state.crystalRestored)this.restoreWorldEffect()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{gameEvents.removeEventListener('crystal-restored',this.crystalHandler);useGameStore.getState().setInteraction('')})
    this.time.addEvent({delay:5000,loop:true,callback:()=>{const s=useGameStore.getState();s.setPosition({x:Math.round(this.player.x),y:Math.round(this.player.y)});void saveGame(s)}})
  }
  private makeTextures(){
    const g=this.make.graphics({x:0,y:0},false)
    g.fillStyle(0x1c5b46).fillCircle(32,38,25);g.fillStyle(0xe0ae81).fillCircle(32,18,15);g.fillStyle(0x2d211a).fillEllipse(32,10,30,17);g.fillStyle(0xe8d185).fillTriangle(55,23,60,58,49,50);g.generateTexture('hero',64,68);g.clear()
    g.fillStyle(0x4ab47e).fillEllipse(32,39,58,40);g.fillStyle(0x75d09b).fillCircle(18,26,15);g.fillStyle(0x102a23).fillCircle(22,32,4).fillCircle(42,32,4);g.generateTexture('slime',64,64);g.clear()
    g.fillStyle(0x275943).fillCircle(36,48,32);g.fillStyle(0x173b2e).fillTriangle(4,37,36,0,68,37);g.fillStyle(0x4b2f1e).fillRect(30,43,12,36);g.generateTexture('tree',72,80);g.clear()
    g.fillStyle(0x918064).fillRoundedRect(2,2,76,60,12);g.fillStyle(0x61533f).fillRoundedRect(8,9,64,48,9);g.generateTexture('rock',80,64);g.destroy()
  }
  private drawWorld(){
    this.add.rectangle(1200,800,2400,1600,0x2f7655).setDepth(-10)
    const path=this.add.graphics().setDepth(-8);path.lineStyle(150,0xb8a16c,1);path.beginPath();path.moveTo(200,900);path.lineTo(800,700);path.lineTo(1400,820);path.lineTo(2200,520);path.strokePath();path.lineStyle(8,0xd8c58d,.45);path.strokePath()
    const water=this.add.graphics().setDepth(-7);water.fillStyle(0x388e91,.9);water.fillRoundedRect(0,80,2400,240,80);for(let x=20;x<2400;x+=70){water.lineStyle(2,0x9cddcf,.35);water.beginPath();water.moveTo(x,160+Math.sin(x)*20);water.lineTo(x+42,160+Math.sin(x)*20);water.strokePath()}
    for(let i=0;i<170;i++){const x=Phaser.Math.Between(20,2380),y=Phaser.Math.Between(350,1570);if((x>250&&x<1550&&y>500&&y<1100))continue;this.add.circle(x,y,Phaser.Math.Between(2,5),i%3===0?0xe7c35b:0x8dca67,Phaser.Math.FloatBetween(.35,.8)).setDepth(-5)}
    this.add.text(1070,390,'GREENHAVEN',{fontFamily:'Cinzel',fontSize:'38px',color:'#e8d69b',stroke:'#244634',strokeThickness:8}).setDepth(1).setAlpha(.7)
  }
  private addBoundaries(){
    for(let x=40;x<2380;x+=110){if(x>980&&x<1260)continue;this.obstacles.create(x,345,'tree').setDepth(10)}
    for(let y=410;y<1550;y+=115){this.obstacles.create(45,y,'tree').setDepth(10);this.obstacles.create(2350,y,'tree').setDepth(10)}
    ;[[410,560],[520,500],[1640,1040],[1750,1120],[2020,760],[300,1280],[820,1320]].forEach(([x,y])=>this.obstacles.create(x,y,'rock').setDepth(10))
  }
  private addVillage(){
    const house=(x:number,y:number,color:number)=>{const base=this.add.rectangle(x,y,210,150,color).setStrokeStyle(5,0x563d27).setDepth(5);this.physics.add.existing(base,true);this.obstacles.add(base);this.add.triangle(x,y-105,0,120,110,0,220,120,0x6a382c).setStrokeStyle(5,0x3d271f).setDepth(6);this.add.rectangle(x,y+28,45,70,0x33251c).setDepth(7)}
    house(420,740,0xe0c48f);house(720,520,0xc9b47e);house(1850,620,0xd6ba7f)
    for(let i=0;i<15;i++)this.obstacles.create(Phaser.Math.Between(1400,2200),Phaser.Math.Between(980,1450),'tree').setDepth(10)
    const npc=this.add.container(820,860).setDepth(15);npc.add([this.add.circle(0,-27,18,0xd8aa7f),this.add.rectangle(0,18,48,70,0x653c82).setStrokeStyle(3,0xd4ba77),this.add.triangle(0,-67,-24,-26,0,-84,24,-26,0x4b315e)]);npc.setData('kind','npc')
    this.add.text(820,916,'ELDER SYNTAX',{fontFamily:'Cinzel',fontSize:'12px',color:'#f0d993',backgroundColor:'#10251ecc',padding:{x:8,y:4}}).setOrigin(.5).setDepth(16)
    this.crystal=this.add.container(1280,610).setDepth(12);const glow=this.add.circle(0,0,55,0x63e2bc,.18);const gem=this.add.polygon(0,0,[0,-54,32,-12,20,46,-20,46,-32,-12],0x5f4e77).setStrokeStyle(4,0xa484bd);this.crystal.add([glow,gem]);this.tweens.add({targets:glow,scale:1.35,alpha:.05,yoyo:true,repeat:-1,duration:1300});this.crystal.setData('kind','terminal')
    this.gate=this.add.container(1450,610).setDepth(11);const l=this.add.rectangle(-55,0,35,170,0x776a58).setStrokeStyle(4,0xb6a26e);const r=this.add.rectangle(55,0,35,170,0x776a58).setStrokeStyle(4,0xb6a26e);const door=this.add.rectangle(0,15,80,135,0x342b34).setStrokeStyle(4,0x956e9f);this.gate.add([l,r,door]);this.physics.add.existing(door,true);this.obstacles.add(door);door.setData('gateDoor',true)
    const checkpoint=this.add.star(610,960,8,18,42,0xe9c76c).setStrokeStyle(4,0xffefab).setDepth(9);checkpoint.setData('kind','checkpoint');this.tweens.add({targets:checkpoint,angle:360,duration:9000,repeat:-1})
    this.registry.set('interactables',[npc,this.crystal,checkpoint])
    for(let i=0;i<20;i++){const firefly=this.add.circle(Phaser.Math.Between(900,1600),Phaser.Math.Between(430,1000),2,0xd7ff9b).setDepth(30);this.tweens.add({targets:firefly,x:`+=${Phaser.Math.Between(-60,60)}`,y:`+=${Phaser.Math.Between(-60,60)}`,alpha:.2,yoyo:true,repeat:-1,duration:Phaser.Math.Between(1500,3200)})}
  }
  update(time:number){
    const s=useGameStore.getState();if(s.paused||s.terminalOpen){this.player.setVelocity(0);this.enemy?.setVelocity(0);return}
    const direction=new Phaser.Math.Vector2(Number(this.keys.d.isDown||this.cursors.right.isDown)-Number(this.keys.a.isDown||this.cursors.left.isDown),Number(this.keys.s.isDown||this.cursors.down.isDown)-Number(this.keys.w.isDown||this.cursors.up.isDown)).normalize();if(direction.lengthSq()>0)this.facing.copy(direction)
    const speed=this.keys.shift.isDown?270:190;this.player.setVelocity(direction.x*speed,direction.y*speed);this.player.setFlipX(this.facing.x<0);this.player.setDepth(Math.floor(this.player.y/10)+20)
    if(Phaser.Input.Keyboard.JustDown(this.cursors.space!)&&time>this.dashReady){this.player.setVelocity(this.facing.x*620,this.facing.y*620);this.dashReady=time+950;this.cameras.main.flash(90,110,220,175,false)}
    this.updateEnemy(time);this.findInteraction()
  }
  private updateEnemy(time:number){if(!this.enemy.active||this.mode==='dead')return;const distance=Phaser.Math.Distance.BetweenPoints(this.player,this.enemy);if(distance<300)this.mode='chase';else if(distance>420)this.mode='idle';if(this.mode==='chase'){this.physics.moveToObject(this.enemy,this.player,105);if(distance<62){this.mode='attack';this.enemy.setVelocity(0)}}if(this.mode==='attack'&&time>this.lastAttack+850){useGameStore.getState().damage(8);this.lastAttack=time;this.cameras.main.shake(90,.008);this.time.delayedCall(260,()=>{if(this.enemy.active)this.mode='chase'})}this.enemy.setDepth(Math.floor(this.enemy.y/10)+18)}
  private attack(){const s=useGameStore.getState();if(s.paused||s.terminalOpen||this.time.now<this.lastAttack+250)return;this.lastAttack=this.time.now;const slash=this.add.arc(this.player.x+this.facing.x*46,this.player.y+this.facing.y*46,43,0,260,false,0xf5dd8b,.72).setDepth(99);slash.rotation=this.facing.angle()-1.4;this.tweens.add({targets:slash,alpha:0,scale:1.35,duration:180,onComplete:()=>slash.destroy()});if(this.enemy.active&&Phaser.Math.Distance.BetweenPoints(this.player,this.enemy)<95){this.enemyHp--;this.enemy.setTintFill(0xffffff);this.tweens.add({targets:this.enemy,x:this.enemy.x+this.facing.x*30,y:this.enemy.y+this.facing.y*30,duration:100,onComplete:()=>this.enemy.clearTint()});if(this.enemyHp<=0){this.mode='dead';this.enemy.disableBody(true,true);s.defeatEnemy()}}}
  private findInteraction(){let nearest:Phaser.GameObjects.GameObject|null=null,min=105;for(const obj of this.registry.get('interactables') as Phaser.GameObjects.GameObject[]){const p=obj as unknown as {x:number;y:number;active:boolean};if(p.active===false)continue;const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,p.x,p.y);if(d<min){min=d;nearest=obj}}const kind=nearest?.getData('kind') as typeof this.promptTarget|undefined;this.promptTarget=kind??'';useGameStore.getState().setInteraction(kind==='npc'?'Elder Syntax bilan gaplashish':kind==='terminal'?'Kristall terminalini ochish':kind==='checkpoint'?'Checkpointni faollashtirish':'')}
  private interact(){const s=useGameStore.getState();if(this.promptTarget==='terminal'){s.setTerminalOpen(true)}else if(this.promptTarget==='npc'){s.setToast(s.crystalRestored?`Ajoyib, ${s.name}! Koding Greenhavenni yana yoritdi.`:`${s.name}, kristallni uyg‘otish uchun o‘zgaruvchilar kuchini ishlat.`)}else if(this.promptTarget==='checkpoint'){s.setPosition({x:this.player.x,y:this.player.y});s.setToast('Checkpoint saqlandi');void saveGame(s)}}
  private restoreWorldEffect(){const door=this.gate?.list.find(o=>o.getData('gateDoor')) as Phaser.GameObjects.Rectangle|undefined;if(door?.active){(door.body as Phaser.Physics.Arcade.StaticBody)?.destroy();this.tweens.add({targets:door,alpha:0,y:-120,duration:900,onComplete:()=>door.destroy()})}const gem=this.crystal?.list[1] as Phaser.GameObjects.Polygon|undefined;gem?.setFillStyle(0x63e2bc);this.cameras.main.flash(500,80,220,180,false)}
}
