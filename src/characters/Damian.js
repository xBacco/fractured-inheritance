import { BaseCharacter } from './BaseCharacter.js'
import { PLAYER_SPEED } from '../config/GameConfig.js'
import { KeyBindings } from '../config/KeyBindings.js'
import {
  PHASE, PHASE_COLOR,
  phaseFromCorruption, reserveDrain, canEscalate, speedMultiplier, punchDamage
} from './DamianPhase.js'

export class Damian extends BaseCharacter {
  constructor(scene, x, y) {
    super(scene, x, y, 20, 28, PHASE_COLOR[PHASE.BASE])

    this.phase      = PHASE.BASE
    this.corruption = 0
    this.reserve    = 100
    this.alive      = true
    this._dead      = false

    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))

    this.attackCooldown    = 0
    this.heavyCooldown     = 0
    this.shadowParryActive = false
    this.shadowParryTimer  = 0
    this.shadowAttackTimer = 2000

    this.shadow      = null
    this._shadowLagX = x
    this._shadowLagY = y

    this.projectiles = scene.physics.add.group()

    this._corrIndicator = scene.add.rectangle(this.x - 5, this.y - 20, 6, 6, 0x444444).setDepth(6)
    this._resIndicator  = scene.add.rectangle(this.x + 5, this.y - 20, 6, 6, 0x6600aa).setDepth(6)
    this._traumaOverlay = scene.add.rectangle(this.x, this.y, 22, 30, 0xffffff, 0.25).setDepth(6).setVisible(false)
  }

  update(scene, delta) {
    super.update(scene)
    if (!this.alive) return
    this._updatePhase(scene, delta)
    this._updateShadow(scene, delta)
    this._handleAttacks(scene, delta)
    this._updateVisual(scene)
    this._updateIndicators()
    this._checkDeath(scene)
  }

  takeDamage(amount) {
    if (!this.alive) return
    if (this.shadowParryActive) {
      this.shadowParryActive = false
      this.shadowParryTimer  = 0
      return
    }
    if (this.phase === PHASE.TRAUMATIC) {
      this.alive = false
      return
    }
    this.corruption = Math.min(100, this.corruption + amount / 2)
  }

  rebindActions(scene) {
    scene.input.keyboard.removeKey(this.fKey)
    this.fKey = scene.input.keyboard.addKey(KeyBindings.keyCode('ability3'))
  }

  _updatePhase(scene, delta) {
    if (this.phase !== PHASE.TRAUMATIC && this.phase !== PHASE.BERSERK) {
      const triggered = phaseFromCorruption(this.corruption)
      if (triggered > this.phase) this.phase = triggered
    }

    const phaseBeforeFKey = this.phase
    if (Phaser.Input.Keyboard.JustDown(this.fKey)) {
      if (canEscalate(phaseBeforeFKey, this.reserve)) this.phase = phaseBeforeFKey + 1
    }

    if (this.phase >= PHASE.AWAKENING && this.phase !== PHASE.TRAUMATIC) {
      this.reserve = Math.max(0, this.reserve - reserveDrain(this.phase, delta))
    }

    if (this.phase === PHASE.INCUBUS && this.reserve <= 10) {
      this.phase = PHASE.BERSERK
    }

    if ((this.phase === PHASE.INCUBUS || this.phase === PHASE.BERSERK) && this.reserve <= 0) {
      this.phase = PHASE.TRAUMATIC
    }

    if (this.phase === PHASE.TRAUMATIC) {
      this.reserve = Math.min(100, this.reserve + 3 * (delta / 1000))
      if (this.reserve >= 30) this.phase = PHASE.BASE
    }

    if (this.shadowParryActive) {
      this.shadowParryTimer -= delta
      if (this.shadowParryTimer <= 0) this.shadowParryActive = false
    }

    this.speed = PLAYER_SPEED * speedMultiplier(this.phase)
  }

  _updateShadow(scene, delta) {
    const needsShadow = this.phase >= PHASE.MINOR_DEMON && this.phase !== PHASE.TRAUMATIC

    if (needsShadow && !this.shadow) {
      this.shadow = scene.add.rectangle(this.x, this.y, 18, 26, 0x220033, 0.5).setDepth(4)
    } else if (!needsShadow && this.shadow) {
      this.shadow.destroy()
      this.shadow = null
    }

    if (!this.shadow) return

    const lag = 0.08
    this._shadowLagX += (this.x - this._shadowLagX) * lag
    this._shadowLagY += (this.y - this._shadowLagY) * lag
    this.shadow.setPosition(this._shadowLagX, this._shadowLagY)

    if (this.phase === PHASE.INCUBUS || this.phase === PHASE.BERSERK) {
      this.shadowAttackTimer -= delta
      if (this.shadowAttackTimer <= 0) {
        this._shadowStrike(scene)
        this.shadowAttackTimer = 2000
      }
    }
  }

  _shadowStrike(scene) {
    if (!scene.enemies) return
    const enemies = scene.enemies.getChildren().filter(e => e.alive !== false)
    if (enemies.length === 0) return

    let target
    if (this.phase === PHASE.BERSERK) {
      target = enemies[Math.floor(Math.random() * enemies.length)]
    } else {
      target = enemies.reduce((best, e) =>
        Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <
        Phaser.Math.Distance.Between(this.x, this.y, best.x, best.y) ? e : best
      )
      if (Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y) > 80) return
    }

    const startX = this._shadowLagX
    const startY = this._shadowLagY
    const shadow = this.shadow

    scene.tweens.add({
      targets: shadow,
      x: target.x, y: target.y,
      duration: 150,
      onComplete: () => {
        if (target?.takeDamage) target.takeDamage(20)
        if (shadow?.active) scene.tweens.add({ targets: shadow, x: startX, y: startY, duration: 400 })
      }
    })
  }

  _handleAttacks(scene, delta) {
    if (this.attackCooldown > 0) this.attackCooldown -= delta
    if (this.heavyCooldown > 0)  this.heavyCooldown  -= delta

    if (this._lmbDown && this.attackCooldown <= 0) {
      this._punch(scene)
      this.attackCooldown = 350
    }

    if (this._rmbDown && this.heavyCooldown <= 0) {
      this._secondaryAbility(scene)
      this.heavyCooldown = 1500
    }
  }

  _punch(scene) {
    if (!scene.enemies) return
    const reach = 30
    let aimX = this.facingX
    let aimY = this.facingY

    if (this.phase === PHASE.BERSERK) {
      const angle = Math.atan2(this.facingY, this.facingX) + (Math.random() - 0.5) * (Math.PI / 3)
      aimX = Math.cos(angle)
      aimY = Math.sin(angle)
    }

    const fx = scene.add.rectangle(this.x + aimX * reach, this.y + aimY * reach, 10, 10, 0xffffff, 0.6).setDepth(5)
    scene.time.delayedCall(100, () => { if (fx.active) fx.destroy() })

    const dmg = punchDamage(this.phase)
    scene.enemies.getChildren().forEach(enemy => {
      if (Phaser.Math.Distance.Between(this.x + aimX * reach, this.y + aimY * reach, enemy.x, enemy.y) < 25) {
        enemy.takeDamage(dmg)
        if (this.phase === PHASE.MINOR_DEMON && enemy.body) {
          enemy.body.reset(enemy.x + aimX * 20, enemy.y + aimY * 20)
        }
        if (this.phase >= PHASE.INCUBUS) {
          this.reserve = Math.min(100, this.reserve + 10)
        }
      }
    })
  }

  _secondaryAbility(scene) {
    if (this.phase === PHASE.AWAKENING)  { this._heavyBlow(scene); return }
    if (this.phase === PHASE.MINOR_DEMON){ this.shadowParryActive = true; this.shadowParryTimer = 3000; return }
    if (this.phase === PHASE.INCUBUS || this.phase === PHASE.BERSERK) { this._shadowLash(scene) }
  }

  _heavyBlow(scene) {
    if (!scene.enemies) return
    const reach = 35
    scene.enemies.getChildren().forEach(enemy => {
      if (Phaser.Math.Distance.Between(this.x + this.facingX * reach, this.y + this.facingY * reach, enemy.x, enemy.y) < 28) {
        enemy.takeDamage(30)
      }
    })
  }

  _shadowLash(scene) {
    const pointer = scene.input.activePointer
    const dx = pointer.worldX - this.x
    const dy = pointer.worldY - this.y
    const len = Math.sqrt(dx * dx + dy * dy) || 1

    const proj = scene.add.rectangle(
      this.shadow ? this._shadowLagX : this.x,
      this.shadow ? this._shadowLagY : this.y,
      8, 8, 0x440066
    )
    scene.physics.add.existing(proj)
    proj.body.setVelocity((dx / len) * 450, (dy / len) * 450)
    proj.damage = 40
    this.projectiles.add(proj)
    scene.time.delayedCall(1200, () => { if (proj.active) proj.destroy() })
  }

  _updateVisual(scene) {
    this.fillColor = PHASE_COLOR[this.phase]
    const showFlicker = this.phase === PHASE.TRAUMATIC && Math.sin(scene.time.now * 0.005) > 0
    this._traumaOverlay.setVisible(showFlicker)
    this._traumaOverlay.setPosition(this.x, this.y)
  }

  _updateIndicators() {
    const t = this.corruption / 100
    const r = Math.round(0x44 + t * (0xff - 0x44))
    const g = Math.round(0x44 + t * (0x22 - 0x44))
    const b = Math.round(0x44 + t * (0x00 - 0x44))
    this._corrIndicator.setPosition(this.x - 5, this.y - 20)
    this._corrIndicator.fillColor = (r << 16) | (g << 8) | b

    const blink = this.reserve < 20 && Math.floor(Date.now() / 300) % 2 === 0
    this._resIndicator.setPosition(this.x + 5, this.y - 20)
    this._resIndicator.fillColor = blink ? 0x110022 : 0x6600aa
  }

  _checkDeath(scene) {
    if (!this.alive && !this._dead) {
      this._dead = true
      this._corrIndicator.destroy()
      this._resIndicator.destroy()
      if (this.shadow) { this.shadow.destroy(); this.shadow = null }
      this._traumaOverlay.destroy()
      // transizione a GameOverScene gestita da GameScene.update()
    }
  }
}
