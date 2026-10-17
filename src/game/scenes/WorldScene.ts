import Phaser from 'phaser'
import { useGameStore } from '../../stores/gameStore'
import { gameEvents } from '../events'
import { saveGame } from '../systems/saveSystem'

type EnemyMode = 'idle' | 'patrol' | 'chase' | 'attack' | 'recover' | 'dead'
type TargetKind = '' | 'npc' | 'terminal' | 'checkpoint'

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private enemy!: Phaser.Physics.Arcade.Sprite
  private enemyBar!: Phaser.GameObjects.Graphics
  private crystal!: Phaser.GameObjects.Container
  private gateDoor!: Phaser.GameObjects.Rectangle
  private obstacles!: Phaser.Physics.Arcade.StaticGroup
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'w'|'a'|'s'|'d'|'shift'|'e'|'esc', Phaser.Input.Keyboard.Key>
  private facing = new Phaser.Math.Vector2(1, 0)
  private moveDirection = new Phaser.Math.Vector2()
  private enemyMode: EnemyMode = 'patrol'
  private enemyHp = 4
  private enemyTarget = new Phaser.Math.Vector2(1120, 760)
  private promptTarget: TargetKind = ''
  private playerAttackReady = 0
  private enemyAttackReady = 0
  private damageReady = 0
  private dashUntil = 0
  private dashReady = 0
  private attackUntil = 0
  private footstepReady = 0
  private dying = false
  private crystalHandler = () => this.restoreWorldEffect(true)

  constructor() { super('world') }

  preload() {
    this.load.spritesheet('hero-sheet','/assets/characters/hero-spritesheet-source.png',{frameWidth:384,frameHeight:256})
  }

  create() {
    this.makeTextures()
    this.physics.world.setBounds(0, 0, 2400, 1600)
    this.cameras.main.setBounds(0, 0, 2400, 1600)
    this.drawTerrain()
    this.obstacles = this.physics.add.staticGroup()
    this.addBoundaries()
    this.addVillage()

    const state = useGameStore.getState()
    this.anims.create({key:'hero-idle',frames:this.anims.generateFrameNumbers('hero-sheet',{start:0,end:3}),frameRate:6,repeat:-1})
    this.anims.create({key:'hero-walk',frames:this.anims.generateFrameNumbers('hero-sheet',{start:4,end:7}),frameRate:8,repeat:-1})
    this.anims.create({key:'hero-attack',frames:this.anims.generateFrameNumbers('hero-sheet',{start:8,end:11}),frameRate:12,repeat:0})
    this.anims.create({key:'hero-dash',frames:this.anims.generateFrameNumbers('hero-sheet',{start:12,end:15}),frameRate:14,repeat:0})
    this.player = this.physics.add.sprite(state.position.x, state.position.y, 'hero-sheet',0).setScale(.31).setCollideWorldBounds(true)
    this.player.body!.setSize(104, 112).setOffset(140, 96)
    this.player.play('hero-idle')
    this.player.setDepth(this.player.y)
    this.add.ellipse(this.player.x, this.player.y + 29, 54, 18, 0x08140f, .32).setName('player-shadow').setDepth(this.player.depth - 1)

    this.enemy = this.physics.add.sprite(1120, 760, 'slime').setDepth(760)
    this.enemy.body!.setSize(58, 40).setOffset(11, 31)
    this.enemyBar = this.add.graphics().setDepth(2000)
    if (state.enemyDefeated) this.enemy.disableBody(true, true)

    this.physics.add.collider(this.player, this.obstacles)
    this.physics.add.collider(this.enemy, this.obstacles)
    this.physics.add.collider(this.player, this.enemy)
    this.cameras.main.startFollow(this.player, true, .075, .075)
    this.cameras.main.setZoom(1.12)
    this.cameras.main.roundPixels = false

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys({ w:'W', a:'A', s:'S', d:'D', shift:'SHIFT', e:'E', esc:'ESC' }) as typeof this.keys
    this.input.on('pointerdown', () => this.attack())
    this.keys.e.on('down', () => this.interact())
    this.keys.esc.on('down', () => { const s=useGameStore.getState(); if (!s.terminalOpen) s.setPaused(!s.paused) })
    gameEvents.addEventListener('crystal-restored', this.crystalHandler)
    if (state.crystalRestored) this.restoreWorldEffect(false)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameEvents.removeEventListener('crystal-restored', this.crystalHandler)
      useGameStore.getState().setInteraction('')
    })
    this.time.addEvent({ delay:5000, loop:true, callback:() => {
      if (this.dying) return
      const s=useGameStore.getState(); s.setPosition({x:Math.round(this.player.x),y:Math.round(this.player.y)}); void saveGame(s)
    }})
  }

  private makeTextures() {
    const g = this.make.graphics({x:0,y:0}, false)

    g.fillStyle(0x07130f,.28).fillEllipse(40,66,70,18)
    g.fillStyle(0x25734d).fillEllipse(40,50,72,48)
    g.fillStyle(0x53b77a).fillEllipse(40,41,66,43)
    g.fillStyle(0x83d399,.7).fillEllipse(29,35,26,14)
    g.fillStyle(0xf0f7dc).fillCircle(28,45,7).fillCircle(52,45,7)
    g.fillStyle(0x13251d).fillCircle(30,46,3).fillCircle(50,46,3)
    g.lineStyle(2,0x183a29).beginPath().arc(40,54,10,.2,2.9).strokePath()
    g.generateTexture('slime',80,78); g.clear()

    g.fillStyle(0x07130f,.24).fillEllipse(48,93,78,18)
    g.fillStyle(0x5a3b25).fillRoundedRect(40,52,15,43,5)
    g.fillStyle(0x173c2b).fillCircle(48,45,38).fillCircle(25,58,27).fillCircle(70,59,29)
    g.fillStyle(0x2e6945).fillCircle(43,33,30).fillCircle(68,46,23)
    g.fillStyle(0x4b8c58,.7).fillCircle(32,28,13).fillCircle(57,20,15)
    g.generateTexture('tree',96,104); g.clear()

    g.fillStyle(0x0a1611,.22).fillEllipse(46,62,84,16)
    g.fillStyle(0x766e5d).fillRoundedRect(4,8,84,52,17)
    g.fillStyle(0x9a917b).fillRoundedRect(10,7,70,38,15)
    g.lineStyle(3,0x625a4b).lineBetween(24,13,16,38).lineBetween(62,9,73,33)
    g.generateTexture('rock',92,72); g.clear()

    g.fillStyle(0x7fbb64).fillCircle(10,14,6).fillCircle(21,10,7).fillCircle(30,15,6)
    g.fillStyle(0x365e39).fillRect(18,14,3,18)
    g.generateTexture('bush',40,36); g.destroy()
  }

  private drawTerrain() {
    this.add.rectangle(1200,800,2400,1600,0x397a4e).setDepth(-20)
    const ground=this.add.graphics().setDepth(-19)
    for(let i=0;i<420;i++){
      const x=Phaser.Math.Between(0,2400), y=Phaser.Math.Between(330,1600)
      const shade=i%3===0?0x275f3f:i%3===1?0x4d8a53:0x78a65b
      ground.fillStyle(shade,Phaser.Math.FloatBetween(.12,.27)).fillCircle(x,y,Phaser.Math.Between(8,26))
    }
    const path=this.add.graphics().setDepth(-16)
    path.lineStyle(174,0x9b865b,.42); path.beginPath(); path.moveTo(120,1030); path.lineTo(790,730); path.lineTo(1390,820); path.lineTo(2260,520); path.strokePath()
    path.lineStyle(142,0xc0aa75,.92); path.strokePath(); path.lineStyle(3,0xe4d39a,.28); path.strokePath()

    const water=this.add.graphics().setDepth(-15)
    water.fillStyle(0x236f78,.98).fillRect(0,70,2400,255)
    water.fillStyle(0x65b6af,.22).fillRect(0,84,2400,32)
    for(let x=0;x<2400;x+=90){const wave=this.add.rectangle(x,Phaser.Math.Between(135,290),52,2,0xa9e0d3,.32).setDepth(-14);this.tweens.add({targets:wave,x:x+45,alpha:.08,yoyo:true,repeat:-1,duration:Phaser.Math.Between(1800,3200)})}
    this.add.ellipse(1820,382,470,110,0x183d2e,.18).setDepth(-13)

    for(let i=0;i<210;i++){
      const x=Phaser.Math.Between(30,2370),y=Phaser.Math.Between(355,1570)
      if(x>250&&x<1550&&y>480&&y<1100) continue
      const flower=this.add.circle(x,y,Phaser.Math.Between(2,4),i%4===0?0xf2c75d:i%4===1?0xdba7d3:0xa7d58b,.72).setDepth(-10)
      flower.setScale(Phaser.Math.FloatBetween(.6,1.3))
    }
    this.add.text(1080,390,'GREENHAVEN',{fontFamily:'Cinzel',fontSize:'34px',color:'#f0dea4',stroke:'#183d2d',strokeThickness:9,letterSpacing:8}).setDepth(2).setAlpha(.72)
    this.add.text(1090,432,'YASHIL VODIY QISHLOG‘I',{fontFamily:'Nunito',fontSize:'11px',color:'#d7e9c4',letterSpacing:4}).setDepth(2).setAlpha(.68)
  }

  private addBoundaries() {
    for(let x=35;x<2390;x+=92){if(x>970&&x<1280)continue;this.obstacles.create(x,348,'tree').setDepth(348+x*.001)}
    for(let y=430;y<1590;y+=96){this.obstacles.create(30,y,'tree').setDepth(y);this.obstacles.create(2370,y,'tree').setDepth(y)}
    ;[[410,560],[520,500],[1640,1040],[1750,1120],[2020,760],[300,1280],[820,1320]].forEach(([x,y])=>this.obstacles.create(x,y,'rock').setDepth(y))
    for(let i=0;i<36;i++){const x=Phaser.Math.Between(60,2320),y=Phaser.Math.Between(380,1540);if(x>260&&x<1510&&y>460&&y<1120)continue;this.add.image(x,y,'bush').setDepth(y)}
  }

  private addVillage() {
    const house=(x:number,y:number,wall:number,roof:number)=>{
      this.add.ellipse(x,y+80,260,48,0x07130f,.2).setDepth(y-3)
      const base=this.add.rectangle(x,y,218,152,wall).setStrokeStyle(5,0x5c432b).setDepth(y)
      this.physics.add.existing(base,true);this.obstacles.add(base)
      this.add.triangle(x,y-108,0,126,114,0,228,126,roof).setStrokeStyle(5,0x4d2d25).setDepth(y+1)
      this.add.rectangle(x-62,y-12,38,40,0x83b5b0).setStrokeStyle(5,0x4c3727).setDepth(y+2)
      this.add.line(x-62,y-12,-15,0,15,0,0xe9e1bd,.8).setDepth(y+3)
      this.add.rectangle(x+35,y+33,47,72,0x35261d).setStrokeStyle(4,0x6e4d31).setDepth(y+2)
      this.add.circle(x+50,y+35,3,0xd9b75d).setDepth(y+3)
      const chimney=this.add.rectangle(x+70,y-113,24,64,0x6b5140).setDepth(y)
      for(let i=0;i<3;i++){const smoke=this.add.circle(chimney.x,chimney.y-28-i*17,9+i*3,0xd7ded5,.12).setDepth(y+5);this.tweens.add({targets:smoke,x:smoke.x+30,y:smoke.y-55,alpha:0,scale:1.8,duration:3200+i*500,repeat:-1,delay:i*700})}
    }
    house(420,740,0xd2b77e,0x754134);house(720,520,0xc6ae77,0x573d34);house(1850,620,0xd7bd86,0x81483a)
    for(let i=0;i<18;i++)this.obstacles.create(Phaser.Math.Between(1480,2220),Phaser.Math.Between(990,1470),'tree').setDepth(Phaser.Math.Between(990,1470))

    const npc=this.add.container(820,860).setDepth(860)
    npc.add([this.add.ellipse(0,40,58,18,0x06110d,.25),this.add.rectangle(0,17,46,70,0x594071).setStrokeStyle(3,0xd4ba77),this.add.circle(0,-28,19,0xd8aa7f),this.add.triangle(0,-69,-25,-26,0,-88,25,-26,0x3c294f),this.add.circle(-7,-28,2,0x1c211b),this.add.circle(7,-28,2,0x1c211b)])
    npc.setData('kind','npc');this.add.text(820,920,'ELDER SYNTAX',{fontFamily:'Cinzel',fontSize:'12px',color:'#f0d993',backgroundColor:'#10251ee0',padding:{x:9,y:5}}).setOrigin(.5).setDepth(921)

    this.crystal=this.add.container(1280,610).setDepth(610)
    const pedestal=this.add.ellipse(0,47,94,34,0x485448).setStrokeStyle(3,0xa6a175)
    const glow=this.add.circle(0,-2,58,0x63e2bc,.12)
    const gem=this.add.polygon(0,-10,[0,-55,31,-16,20,43,-20,43,-31,-16],0x5f4e77).setStrokeStyle(4,0xb9a0ca)
    this.crystal.add([pedestal,glow,gem]);this.crystal.setData('kind','terminal')
    this.tweens.add({targets:glow,scale:1.45,alpha:.02,yoyo:true,repeat:-1,duration:1500})
    this.tweens.add({targets:gem,y:'-=8',yoyo:true,repeat:-1,duration:1700,ease:'Sine.inOut'})

    this.add.rectangle(1395,610,34,190,0x625b50).setStrokeStyle(4,0xa69c7b).setDepth(608)
    this.add.rectangle(1505,610,34,190,0x625b50).setStrokeStyle(4,0xa69c7b).setDepth(608)
    this.add.rectangle(1450,518,145,28,0x777063).setStrokeStyle(4,0xb9a97d).setDepth(608)
    this.gateDoor=this.add.rectangle(1450,620,82,155,0x2c2830).setStrokeStyle(5,0x8d6c97).setDepth(609)
    this.physics.add.existing(this.gateDoor,true);this.obstacles.add(this.gateDoor)

    const checkpoint=this.add.container(610,960).setDepth(960)
    const checkpointGlow=this.add.circle(0,0,48,0xe9c76c,.13)
    const checkpointStar=this.add.star(0,0,8,17,40,0xe9c76c).setStrokeStyle(3,0xffefab)
    checkpoint.add([checkpointGlow,checkpointStar]);checkpoint.setData('kind','checkpoint')
    this.tweens.add({targets:checkpointStar,angle:360,duration:11000,repeat:-1});this.tweens.add({targets:checkpointGlow,scale:1.4,alpha:.03,yoyo:true,repeat:-1,duration:1200})
    this.registry.set('interactables',[npc,this.crystal,checkpoint])

    for(let i=0;i<28;i++){const firefly=this.add.circle(Phaser.Math.Between(880,1660),Phaser.Math.Between(430,1050),Phaser.Math.Between(2,3),0xd7ff9b,.8).setDepth(1800);this.tweens.add({targets:firefly,x:`+=${Phaser.Math.Between(-65,65)}`,y:`+=${Phaser.Math.Between(-65,65)}`,alpha:.12,yoyo:true,repeat:-1,duration:Phaser.Math.Between(1600,3400)})}
  }

  update(time:number) {
    const s=useGameStore.getState()
    if(s.paused||s.terminalOpen||this.dying){this.player.setVelocity(0);this.enemy?.setVelocity(0);return}
    this.moveDirection.set(Number(this.keys.d.isDown||this.cursors.right.isDown)-Number(this.keys.a.isDown||this.cursors.left.isDown),Number(this.keys.s.isDown||this.cursors.down.isDown)-Number(this.keys.w.isDown||this.cursors.up.isDown)).normalize()
    if(this.moveDirection.lengthSq()>0)this.facing.copy(this.moveDirection)

    if(Phaser.Input.Keyboard.JustDown(this.cursors.space!)&&time>this.dashReady&&this.facing.lengthSq()>0){this.dashUntil=time+170;this.dashReady=time+1050;this.spawnBurst(this.player.x,this.player.y,0xa8e9ce,9);this.cameras.main.shake(70,.003)}
    if(time<this.dashUntil){this.player.setVelocity(this.facing.x*620,this.facing.y*620);this.player.setAlpha(.74)}
    else{const speed=this.keys.shift.isDown?275:190;this.player.setVelocity(this.moveDirection.x*speed,this.moveDirection.y*speed);this.player.setAlpha(1)}

    const moving=this.player.body!.velocity.lengthSq()>100
    this.player.setFlipX(this.facing.x<0);this.player.setDepth(Math.floor(this.player.y))
    if(time<this.dashUntil)this.player.play('hero-dash',true)
    else if(time<this.attackUntil)this.player.play('hero-attack',true)
    else if(moving)this.player.play('hero-walk',true)
    else this.player.play('hero-idle',true)
    const shadow=this.children.getByName('player-shadow') as Phaser.GameObjects.Ellipse;shadow.setPosition(this.player.x,this.player.y+29).setDepth(this.player.depth-1)
    if(moving&&time>this.footstepReady){this.footstepReady=time+180;const dust=this.add.circle(this.player.x-this.facing.x*18,this.player.y+25,7,0xdac58d,.24).setDepth(this.player.depth-2);this.tweens.add({targets:dust,alpha:0,scale:1.8,duration:350,onComplete:()=>dust.destroy()})}
    this.updateEnemy(time);this.findInteraction();if(s.health<=0)this.respawnPlayer()
  }

  private updateEnemy(time:number) {
    if(!this.enemy.active||this.enemyMode==='dead'){this.enemyBar.clear();return}
    const distance=Phaser.Math.Distance.BetweenPoints(this.player,this.enemy)
    if(distance<320&&this.enemyMode!=='recover')this.enemyMode='chase'
    else if(distance>470)this.enemyMode='patrol'
    if(this.enemyMode==='patrol'){
      if(Phaser.Math.Distance.BetweenPoints(this.enemy,this.enemyTarget)<30)this.enemyTarget.set(Phaser.Math.Between(990,1260),Phaser.Math.Between(680,900))
      this.physics.moveTo(this.enemy,this.enemyTarget.x,this.enemyTarget.y,52)
    }
    if(this.enemyMode==='chase'){
      this.physics.moveToObject(this.enemy,this.player,112)
      if(distance<66){this.enemyMode='attack';this.enemy.setVelocity(0)}
    }
    if(this.enemyMode==='attack'&&time>this.enemyAttackReady){
      this.enemyAttackReady=time+1050;this.damagePlayer(9);this.enemyMode='recover';this.enemy.setVelocity(this.facing.x*-60,this.facing.y*-60)
      this.time.delayedCall(360,()=>{if(this.enemy.active)this.enemyMode='chase'})
    }
    this.enemy.setScale(1,1+Math.sin(time/170)*.035).setDepth(Math.floor(this.enemy.y))
    this.enemyBar.clear().fillStyle(0x0b1712,.8).fillRoundedRect(this.enemy.x-31,this.enemy.y-48,62,8,4).fillStyle(0xd85b52).fillRoundedRect(this.enemy.x-29,this.enemy.y-46,58*(this.enemyHp/4),4,2)
  }

  private damagePlayer(amount:number){if(this.time.now<this.damageReady||this.time.now<this.dashUntil)return;this.damageReady=this.time.now+650;useGameStore.getState().damage(amount);this.player.setTintFill(0xffb8a8);this.cameras.main.shake(130,.009);this.time.delayedCall(120,()=>this.player.clearTint())}

  private attack() {
    const s=useGameStore.getState();if(s.paused||s.terminalOpen||this.dying||this.time.now<this.playerAttackReady)return
    this.playerAttackReady=this.time.now+330
    this.attackUntil=this.time.now+330
    this.player.play('hero-attack',true)
    const x=this.player.x+this.facing.x*49,y=this.player.y+this.facing.y*49
    const slash=this.add.arc(x,y,45,-65,235,false,0xf7e2a0,.82).setDepth(2100);slash.rotation=this.facing.angle()-1.5
    this.tweens.add({targets:slash,alpha:0,scale:1.4,angle:slash.angle+28,duration:190,onComplete:()=>slash.destroy()})
    if(this.enemy.active&&Phaser.Math.Distance.BetweenPoints(this.player,this.enemy)<105){
      this.enemyHp--;this.enemyMode='recover';this.enemy.setTintFill(0xffffff);this.spawnBurst(this.enemy.x,this.enemy.y,0xa7e7a8,8)
      this.enemy.setVelocity(this.facing.x*280,this.facing.y*280);this.cameras.main.shake(75,.004)
      this.time.delayedCall(140,()=>{if(this.enemy.active){this.enemy.clearTint();this.enemyMode='chase'}})
      if(this.enemyHp<=0){this.enemyMode='dead';this.spawnBurst(this.enemy.x,this.enemy.y,0x72cf8f,18);this.tweens.add({targets:this.enemy,alpha:0,scale:.2,duration:350,onComplete:()=>this.enemy.disableBody(true,true)});s.defeatEnemy()}
    }
  }

  private spawnBurst(x:number,y:number,color:number,count:number){for(let i=0;i<count;i++){const p=this.add.circle(x,y,Phaser.Math.Between(2,5),color,.9).setDepth(2200);const a=Phaser.Math.FloatBetween(0,Math.PI*2),d=Phaser.Math.Between(24,70);this.tweens.add({targets:p,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,alpha:0,scale:.2,duration:Phaser.Math.Between(260,520),onComplete:()=>p.destroy()})}}

  private findInteraction(){let nearest:Phaser.GameObjects.GameObject|null=null,min=112;for(const obj of this.registry.get('interactables') as Phaser.GameObjects.GameObject[]){const p=obj as unknown as {x:number;y:number;active:boolean};if(p.active===false)continue;const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,p.x,p.y);if(d<min){min=d;nearest=obj}}const kind=nearest?.getData('kind') as TargetKind|undefined;this.promptTarget=kind??'';useGameStore.getState().setInteraction(kind==='npc'?'Elder Syntax bilan gaplashish':kind==='terminal'?'Kristall terminalini ochish':kind==='checkpoint'?'Checkpointni faollashtirish':'')}
  private interact(){const s=useGameStore.getState();if(this.promptTarget==='terminal')s.setTerminalOpen(true);else if(this.promptTarget==='npc')s.setToast(s.crystalRestored?`Ajoyib, ${s.name}! Koding Greenhavenni yana yoritdi.`:`${s.name}, sharqdagi binafsha kristallni o‘zgaruvchilar kuchi bilan uyg‘ot.`);else if(this.promptTarget==='checkpoint'){s.setPosition({x:this.player.x,y:this.player.y});s.setToast('Checkpoint saqlandi va kuchingiz tiklandi');useGameStore.setState({health:100,mana:70});void saveGame(useGameStore.getState())}}

  private respawnPlayer(){if(this.dying)return;this.dying=true;this.cameras.main.fadeOut(600,15,20,18);this.time.delayedCall(650,()=>{const s=useGameStore.getState();s.respawn();this.player.setPosition(s.position.x,s.position.y).clearTint().setAlpha(1);this.dying=false;this.cameras.main.fadeIn(650,15,20,18);void saveGame(useGameStore.getState())})}

  private restoreWorldEffect(animate:boolean){if(this.gateDoor?.active){const body=this.gateDoor.body as Phaser.Physics.Arcade.StaticBody|undefined;body?.destroy();if(animate)this.tweens.add({targets:this.gateDoor,alpha:0,y:this.gateDoor.y-130,duration:950,ease:'Cubic.in',onComplete:()=>this.gateDoor.destroy()});else this.gateDoor.destroy()}const gem=this.crystal?.list[2] as Phaser.GameObjects.Polygon|undefined;gem?.setFillStyle(0x62dfbd).setStrokeStyle(4,0xdcfff0);if(animate){this.spawnBurst(this.crystal.x,this.crystal.y,0x8fffd2,28);this.cameras.main.flash(480,90,220,180,false)}}
}
