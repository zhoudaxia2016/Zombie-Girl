/**
 * 游戏中的物体类
 */

// 景物
function Surroundding (model) {
  this.model = model
  this.updateRect()
}

// 处理导入后的场景
Surroundding.load = function (url) {
  let promise = newLoadPromise(url, THREE.ObjectLoader)
  promise.then(function (obj) {
    obj.traverse(function (child) {
      if (child.name === LAND_NAME) {
        child.receiveShadow = true
        child.position.set(0, 0, 0)
        child.receiveShadow = true
        land.model = child
        let { vertices, faces } = child.geometry
        land.rect = getRect(child)
        let fqt = new QuadTree(land.rect, 20)
        let plane
        vertices = child.geometry.vertices.map(item => item.clone().applyMatrix4(child.matrixWorld))
        for (let i = 0, l = faces.length; i < l; i ++) {
          let { a, b, c } = faces[i]
          let plane = {}
          plane.obj = [ vertices[a], vertices[b], vertices[c] ]
          plane.rect = plane.obj.reduce((last, item) => {
            last.left = Math.max(last.left, item.x)
            last.top = Math.max(last.top, item.z)
            last.right = Math.min(last.right, item.x)
            last.bottom = Math.min(last.bottom, item.z)
            return last
          }, { left: -10000, top: -10000, right: 10000, bottom: 10000 })
          fqt.insert(plane)
        }
        land.fqt = fqt
        return
      }
      for (let type in SURROUNDDING_NAME) {
        let name = SURROUNDDING_NAME[type]
        if (child.name.startsWith(name)) {
          child.castShadow = true
          child.receiveShadow = true
          surrounddings.push(new Surroundding(child))
        }
      }
    })
    scene.add(obj)
    console.log('Load scene completely!')
  }, onError)
  return promise
}

Surroundding.prototype.updateRect = function () {
  let { left, right, top, bottom } = getRect(this.model)
  let scale = this.model.name.startsWith(SURROUNDDING_NAME.ROCK) ? 1/2 : 1/3
  let narrowRight = right + (left - right) * ((1 -scale) / 2)
  let narrowLeft = right + (left - right) * ((1 +scale) / 2)
  let narrowBottom = bottom + (top - bottom) * ((1 -scale) / 2)
  let narrowTop = bottom + (top - bottom) * ((1 +scale) / 2)
  this.rect = new Rect(narrowLeft, narrowRight, narrowTop, narrowBottom)
}

Surroundding.prototype.groundHitDetect = function (land) {
  let fqt = land.fqt
  let model = this.model
  let rangeY = getRange(model, 'y')
  let planes = []
  let { x, z } = model.position
  fqt.retrieve({ obj: this.model, rect: this.rect }, function (datas) {
    planes = planes.concat(datas.map(item => {
      let { left, right, top, bottom } = item.rect
      if (left <  x || right > x || top < z || bottom > z) return
      let mat = new THREE.MeshBasicMaterial()
      let geo = new THREE.Geometry()
      geo.faces = [new THREE.Face3(0, 1, 2)]
      geo.vertices = item.obj.map(item => new THREE.Vector3(item.x, item.y, item.z))
      geo.computeFaceNormals()
      return new THREE.Mesh(geo, mat)
    }).filter(item => item))
  })
  let y = rangeY.max
  let pos = new THREE.Vector3(x, y, z)
  let ray = new THREE.Raycaster(pos, new THREE.Vector3(0, -1, 0))
  let results = ray.intersectObjects(planes)
  if (results.length > 0) {
    model.position.set(x, y - results[0].distance - rangeY.min + model.position.y, z)
  }
}

// 角色 (包括丧尸和人物)
function Character (url, initialSpeed = 0.01, moveDuration = 1.6, fastSpeed = 0.05) {
  this.url = url
  this.moveDuration =  moveDuration
  this.forward = false
  this.shiftAngle = 0
  this.initialSpeed = initialSpeed
  this.speed = initialSpeed
  this.fastSpeed = fastSpeed
  this.needUpdateRect = true
  this.clock = new THREE.Clock()
  this.angle = 0
  this.hp = 100
}

// 计算包围盒
Character.prototype.updateRect = function () {
  if (this.needUpdateRect) {
    this.rect = getRect(this.model)
    this.needUpdateRect = false
  }
}

// 人物移动
Character.prototype.move = function () {
  let { model, mixer, action, forward, shiftAngle, moveDuration, initialSpeed, speed } = this
  action.walk.setDuration(moveDuration * initialSpeed / speed)
  if (forward) {
    action.walk.play()
    mixer.update(this.clock.getDelta())
    model.translateZ(speed)
    this.computing = false
    this.needUpdateRect = true
  } else {
    action.walk.stop()
  }
  if (shiftAngle) {
    model.rotateY(shiftAngle)
    this.angle = (this.angle + shiftAngle) % (2*Math.PI)
  }
}

// 与地面碰撞检测
Character.prototype.groundHitDetect = function (land) {
  let fqt = land.fqt
  let model = this.model
  let rangeY = getRange(model, 'y')
  let planes = []
  let { x, z } = model.position
  fqt.retrieve({ obj: this.model, rect: this.rect }, function (datas) {
    planes = planes.concat(datas.map(item => {
      let { left, right, top, bottom } = item.rect
      if (left <  x || right > x || top < z || bottom > z) return
      let mat = new THREE.MeshBasicMaterial()
      let geo = new THREE.Geometry()
      geo.faces = [new THREE.Face3(0, 1, 2)]
      geo.vertices = item.obj.map(item => new THREE.Vector3(item.x, item.y, item.z))
      geo.computeFaceNormals()
      return new THREE.Mesh(geo, mat)
    }).filter(item => item))
  })
  let y = rangeY.max
  let pos = new THREE.Vector3(x, y, z)
  let ray = new THREE.Raycaster(pos, new THREE.Vector3(0, -1, 0))
  let results = ray.intersectObjects(planes)
  if (results.length > 0) {
    model.translateY(rangeY.max - rangeY.min - results[0].distance)
  }
}

// 加载模型
Character.prototype.load = function () {
  let promise = newLoadPromise(this.url, THREE.JSONLoader)
  promise.then(([geometry, materials]) => {
    for (let k in materials) {
      materials[k].skinning = true
    }
    let mesh = new THREE.SkinnedMesh(geometry, materials)
    mesh.castShadow = true
    scene.add(mesh)

    this.y = getRange(this.model, 'y').min

    this.model = mesh
    this.updateRect()
    // 获取一个包含物体所有动画的mixer
    let mixer = new THREE.AnimationMixer(mesh)
    // 根据名字获取action
    let walkAction = mixer.clipAction('walk')
    let shootAction = mixer.clipAction('shoot')
    let dieAction = mixer.clipAction('die')
    let attackAction = mixer.clipAction('attack')
    // 设置action的属性
    walkAction.setDuration(this.moveDuration)
    if (shootAction) {
      shootAction.setDuration(1)
      shootAction.setLoop(THREE.LoopOnce)
      shootAction.clampWhenFinished = true
    }
    if (dieAction) {
      dieAction.setDuration(3)
      dieAction.setLoop(THREE.LoopOnce)
      dieAction.clampWhenFinished = true
    }
    if (attackAction) {
      attackAction.setDuration(2)
    }
    this.action = { walk: walkAction, shoot: shootAction, die: dieAction, attack: attackAction }
    this.mixer = mixer
  }, onError)
  return promise
}

// 后退
Character.prototype.retreat = function (z) {
  if (!z) z = this.speed
  this.model.translateZ(-z)
  this.needUpdateRect = true
}

// 复活
Character.prototype.revive  = function () {
  this.hp = 100
  this.dead = false
  this.action.die.stop()
}

// 边界检测
Character.prototype.boundaryTest = function () {
  let { left, right, top, bottom } = land.rect
  let position = this.model.position
  let { x, y, z } = position
  let tolerance = BOUNDARY_TOLERANCE
  if (x > left - tolerance) {
    position.x = left - tolerance
    this.needUpdateRect = true
    return 3*Math.PI / 2
  } else if (x < right + tolerance) {
    position.x = right + tolerance
    this.needUpdateRect = true
    return Math.PI / 2
  }
  if (z > top - tolerance) {
    position.z = top - tolerance
    this.needUpdateRect = true
    return Math.PI
  } else if (z < bottom + tolerance) {
    position.z = bottom + tolerance
    this.needUpdateRect = true
    return 0
  }
  return -1
}

Character.prototype.update = function () {
  if (this.dead) {
    this.die()
  } else {
    this.updateRect()
    this.boundaryTest()
    this.move()
    this.groundHitDetect(land)
  }
}

Character.prototype.handleHit = function () {
  this.retreat()
}

Character.prototype.hurt = function (damage) {
  this.hp = this.hp - damage
  if (this.hp <= 0) {
    this.dead = true
    this.die()
  }
}

Character.prototype.die = function () {
  let { action, mixer } = this
  mixer.update(this.clock.getDelta())
  action.die.play()
}

// 控制角色
function Person (url, speed, moveDuration, fastSpeed) {
  Character.apply(this, [url, speed, moveDuration, fastSpeed])
  this.listener = new THREE.AudioListener()
  let events = []
  let onKeyDown = (e) => {
    switch (e.keyCode) {
      case 87:
        this.forward = true
        break
      case 65:
        this.shiftAngle = ROLE.SHIFT_ANGLE
        break
      case 68:
        this.shiftAngle = -ROLE.SHIFT_ANGLE
        break
      case 16:
        this.speed = this.fastSpeed
        break
    }
  }
  let onKeyUp = (e) => {
    switch (e.keyCode) {
      case 87:
        this.forward = false
        break
      case 65:
      case 68:
        this.shiftAngle = 0
        break
      case 16:
        this.speed = this.initialSpeed
        break
      case 81:
        this.shootingReady = !this.shootingReady
        break
      case 32:
        this.shooting = true
        break
      case 69:
        this.aimReady = !this.aimReady
        break
    }
  }
  let onMouseMove = (e) => {
    if (this.aiming) {
      let range = this.vision.aimingRange
      let origin = this.vision.aimingLookAt
      let x = 0.5 * range.x - range.x * e.clientX / window.innerWidth
      let y = 0.5 * range.y - range.y * e.clientY / window.innerHeight
      let currentLookAt = [origin[0] + x, origin[1] + y, origin[2]]
      this.camera.lookAt(...currentLookAt)
      this.vision.currentLookAt = currentLookAt
    }
  }

  document.addEventListener('keydown', onKeyDown, false)
  document.addEventListener('keyup', onKeyUp, false)
  document.addEventListener('mousemove', onMouseMove, false)

  events.push({ bindFunc: onKeyDown, eventType: 'keydown' })
  events.push({ bindFunc: onKeyUp, eventType: 'keyup' })
  events.push({ bindFunc: onMouseMove, eventType: 'mousemove' })

  this.events = events
}

Person.prototype = new Character()

Person.prototype.liftUpGun = function () {
  let action = this.action.shoot
  this.mixer.update(this.clock.getDelta())
  action.play()
  return action.paused
}


Person.prototype.update = function () {
  if (this.dead) {
    if (this.action.die.paused) {
      return
    }
    this.die()
  }
  // 按了射击准备键
  if (this.shootingReady) {
    // 已经抬起枪
    if (this.liftUpGun()) {
      // 按了射击键
      if (this.shooting) {
        let { aimingPosition, aimingLookAt } = this.vision
        let bullet = new Bullet(FILES.BULLET, this)
        bullet.load()
      }
      // 按了瞄准键
      if (this.aimReady) {
        if (!this.aiming) {
          this.aiming = true
          let { aimingPosition, aimingLookAt } = this.vision
          this.camera.position.set(...aimingPosition)
          this.camera.lookAt(...aimingLookAt)
          this.vision.currentLookAt = aimingLookAt
        }
      } else {
        this.aiming = false
        let { position, lookAt } = this.vision
        this.camera.position.set(...position)
        this.camera.lookAt(...lookAt)
      }
    }
  // 没有射击准备
  } else {
    this.action.shoot.stop()
    let { position, lookAt } = this.vision
    this.camera.position.set(...position)
    this.camera.lookAt(...lookAt)
    this.aimReady = false
    this.aiming = false
    Character.prototype.update.apply(this)
  }
  // 无论任何情况，射击总是一次性的
  this.shooting = false
}


Person.prototype.setCamera = function (camera) {
  this.camera = camera
  let vision = {
    position: [0, 2, -2],
    lookAt: [0, 1, 1],
    aimingRange: { x: 8, y: 5 },
    aimingPosition: [0, 2, 0.5],
    aimingLookAt: [0, 2, 10]
  }
  this.model.add(camera)
  camera.position.set(...vision.position)
  camera.lookAt(...vision.lookAt)
  this.vision = vision
  camera.add(this.listener)
}

Person.prototype.die = function () {
  Character.prototype.die.apply(this)
  let { action, vision, events } = this
  action.shoot.stop()
  action.walk.stop()
  this.camera.position.set(...vision.position)
  this.camera.lookAt(...vision.lookAt)
  for (let event of events) {
    document.removeEventListener(event.eventType, event.bindFunc)
  }
}

// 复活
Person.prototype.revive = function () {
  let { model, events } = this
  model.position.set(0, 0, 0)
  for (let event of events) {
    document.addEventListener(event.eventType, event.bindFunc)
  }
  Character.prototype.revive.apply(this)
}

function Zombie (url, speed = ZOMBIE.INITIAL_SPEED, moveDuration = ZOMBIE.MOVE_DURATION) {
  Character.apply(this, [url, speed, moveDuration])
  this.forward = true
}

Zombie.prototype = new Character()

Zombie.prototype.die = function () {
  Character.prototype.die.apply(this)
  this.sound.stop()
  if (this.action.die.paused) {
    zombies.splice(zombies.indexOf(this), 1)
  }
}

Zombie.prototype.load = function (listener, audioUrl) {
  let promise = Character.prototype.load.apply(this)
  promise.then(([g, m]) => {
    let sound = new THREE.PositionalAudio(listener)
    sound.setVolume(0)
    this.model.add(sound)
    this.sound= sound
    let audioLoader = new THREE.AudioLoader();
    audioLoader.load(audioUrl, (buffer) => {
      sound.setBuffer(buffer)
      sound.setRefDistance(ZOMBIE.SOUND.DISTANCE)
      sound.setVolume(ZOMBIE.SOUND.VOLUME)
      sound.setLoop(true)
      sound.play()
    })
  })
  return promise
}

// 丧尸随机移动
Zombie.prototype.shift = function () {
  let r = Math.random()
  let chance = ZOMBIE.SHIFT_CHANCE
  if (r < chance) {
    this.shiftAngle = (r - chance / 2) * ZOMBIE.SHIFT_RANGE / 2
  } else {
    this.shiftAngle = 0
  }
}

Zombie.prototype.update = function (role) {
  this.forward = true
  this.shift()
  this.perosonDetect(role)
  Character.prototype.update.apply(this)
}

Zombie.prototype.boundaryTest = function () {
  let angle = Character.prototype.boundaryTest.apply(this)
  if (angle !==  -1) {
    this.shiftAngle = angle - this.angle
  }
}

Zombie.prototype.handleHit = function () {
  Character.prototype.handleHit.apply(this)
  if (Math.random() > 0.5) {
    this.shiftAngle = Math.PI / 2
  } else {
    this.shiftAngle = -Math.I / 2
  }
  this.move()
}

// 复活
Zombie.prototype.revive = function () {
  this.sound.play()
  let { left, right, top, bottom } = land.rect
  let x = right + Math.random() * (left - right)
  let z = right + Math.random() * (top - bottom)
  this.model.position.set(x, 0, z)
  Character.prototype.revive.apply(this)
}

Zombie.prototype.perosonDetect = function (role) {
  let direction = role.model.position.clone().sub(this.model.position)
  let { x, z } = direction
  let sqrt = Math.sqrt(x**2 + z**2)
  if (sqrt < ZOMBIE.ATTACK_DISTANCE) {
    this.forward = false
    if (!role.dead) {
      this.attack(role)
    }
    return
  } else if (sqrt < ZOMBIE.DETECT_DISTANCE) {
    let angle_sin = Math.sin(x / sqrt)
    let angle = Math.acos(z / sqrt)
    if (angle_sin < 0 ) {
      angle = 2*Math.PI - angle
    }
    this.shiftAngle = angle - this.angle
  }
  this.action.attack.stop()
}

Zombie.prototype.attack = function (role) {
  role.hurt(1)
  let { mixer, action, clock } = this
  mixer.update(clock.getDelta())
  action.attack.play()
}

function onError (err) {
  console.log(err)
}

function Bullet (url, person, speed = 1) {
  let { angle, vision } = person
  let [xp, yp, zp] = vision.aimingPosition
  let [xl, yl, zl] = vision.aimingLookAt
  let distanceFromCamera = 1
  let position = new THREE.Vector3(xp, yp - distanceFromCamera, zp)
  if (person.aiming) {
    let [xc, yc, zc] = person.vision.currentLookAt
    this.verticalAngle = getAngle(position.y -yc, zp - zl)
    this.horizontalAngle = (angle + getAngle(xc -xp, zp - zl)) % (2*Math.PI)
  } else {
    this.verticalAngle = getAngle(yl - position.y, zp - zl)
    this.horizontalAngle = angle
  }
  this.position = person.model.localToWorld(position)
  this.url = url
  this.speed = speed
  this.listener = person.listener
}

Bullet.prototype.move = function () {
  this.model.translateZ(this.speed)
}

Bullet.prototype.update = function () {
  this.move()
  this.boundaryTest()
}

Bullet.prototype.boundaryTest = function () {
  let tolerance = 100
  let { left, right, bottom, top } = land.rect
  let { x, y, z } = this.model.position
  if (x > left + tolerance || x < right - tolerance || z > top + tolerance || z < bottom - tolerance) {
    this.clear()
  }
  if (y < -10) {
    this.clear()
  }
}

Bullet.prototype.clear = function () {
  scene.remove(this.model)
  bullets.splice(bullets.indexOf(this), 1)
}

Bullet.prototype.handleHit = function (obj) {
  if (obj instanceof Surroundding) {
    this.clear()
  } else if (obj instanceof Zombie) {
    this.clear()
    obj.hurt(10)
  }
}

Bullet.prototype.load = function () {
  let modelPromise = newLoadPromise(this.url, THREE.JSONLoader)
  modelPromise.then(([geometry, materials]) => {
    let mesh = new THREE.Mesh(geometry, materials)
    mesh.castShadow = true
    let {x, y, z} = this.position
    mesh.position.set(x, y, z)
    mesh.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), this.verticalAngle)
    mesh.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), this.horizontalAngle)
    scene.add(mesh)

    this.model = mesh
    bullets.push(this)
  })

  let soundPromise = newLoadPromise(FILES.HANDGUN_SOUND, THREE.AudioLoader)
  soundPromise.then(buffer => {
    let sound = new THREE.Audio(this.listener)
    sound.setBuffer(buffer)
    sound.setLoop(false)
    sound.setVolume(0.1)
    this.sound = sound
  })

  Promise.all([modelPromise, soundPromise]).then( () => {
    this.sound.play()
  })
}
