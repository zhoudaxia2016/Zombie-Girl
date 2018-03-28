/**
 * 游戏中的物体类
 */

// 景物
function Surroundding (model) {
  this.model = model
  this.updateRect()
}

Surroundding.fall = function (surrounddings) {
  fall(surrounddings)
}

// 处理导入后的场景
Surroundding.load = function (url) {
  let promise = newLoadPromise(url, THREE.ObjectLoader)
  promise.then(function (obj) {
    obj.traverse(function (child) {
      if (child.name === 'Plane') {
        //child.receiveShadow = true
        child.position.set(0, 0, 0)
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
      let surroundding_type = ['grass', 'Cylinder', 'pine', 'Icosphere']
      for (let type of surroundding_type) {
        if (child.name.startsWith(type)) {
          //child.castShadow = true
          //child.receiveShadow = true
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
  let scale = this.model.name.startsWith('Icosphere') ? 1/2 : 1/3
  let narrowRight = right + (left - right) * ((1 -scale) / 2)
  let narrowLeft = right + (left - right) * ((1 +scale) / 2)
  let narrowBottom = bottom + (top - bottom) * ((1 -scale) / 2)
  let narrowTop = bottom + (top - bottom) * ((1 +scale) / 2)
  this.rect = new Rect(narrowLeft, narrowRight, narrowTop, narrowBottom)
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
  action.setDuration(moveDuration * initialSpeed / speed)
  if (forward) {
    action.play()
    mixer.update(this.clock.getDelta())
    model.translateZ(speed)
    this.computing = false
    this.needUpdateRect = true
  } else {
    action.stop()
  }
  if (shiftAngle) {
    model.rotateY(shiftAngle)
  }
}

// 与地面碰撞检测
Character.prototype.groundHitDetect = function (land) {
  let fqt = land.fqt
  let model = this.model
  let geometryHelper = new THREE.BoxHelper(model).geometry
  geometryHelper.computeBoundingBox()
  let box = geometryHelper.boundingBox
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

  let y = box.max.y
  let pos = new THREE.Vector3(x, y, z)
  let ray = new THREE.Raycaster(pos, new THREE.Vector3(0, -1, 0))
  let results = ray.intersectObjects(planes)
  if (results.length > 0) {
    this.model.translateY(box.max.y -results[0].distance - box.min.y)
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
    //mesh.castShadow = true
    scene.add(mesh)

    let geometryHelper = new THREE.BoxHelper(this.model).geometry
    geometryHelper.computeBoundingBox()
    let box = geometryHelper.boundingBox
    this.y = box.min.y

    this.model = mesh
    this.updateRect()
    this.mixer = new THREE.AnimationMixer(mesh)
    this.action = this.mixer.clipAction('walk')
    this.action.setDuration(this.moveDuration)
  }, onError)
  return promise
}

// 后退
Character.prototype.retreat = function (z) {
  if (!z) z = this.speed
  this.model.translateZ(-z)
  this.needUpdateRect = true
}

// 边界检测
Character.prototype.boundaryTest = function () {
  let { left, right, top, bottom } = land.rect
  let position = this.model.position
  let { x, y, z } = position
  let tolerance = 1
  if (x > left - tolerance) {
    position.x = left - tolerance
    this.needUpdateRect = true
    return true
  } else if (x < right + tolerance) {
    position.x = right + tolerance
    this.needUpdateRect = true
    return true
  }
  if (z > top - tolerance) {
    position.z = top - tolerance
    this.needUpdateRect = true
    return true
  } else if (z < bottom + tolerance) {
    position.z = bottom + tolerance
    this.needUpdateRect = true
    return true
  }
  return false
}

Character.prototype.update = function () {
  this.updateRect()
  this.boundaryTest()
  this.move()
  this.groundHitDetect(land)
}

// 控制角色
function Person (url, speed, moveDuration, fastSpeed) {
  Character.apply(this, [url, speed, moveDuration, fastSpeed])
  this.listener = new THREE.AudioListener()
  document.addEventListener('keydown', (e) => {
    switch (e.keyCode) {
      case 87:
        this.forward = true
        break
      case 65:
        this.shiftAngle = Math.PI / 100
        break
      case 68:
        this.shiftAngle = -Math.PI / 100
        break
      case 16:
        this.speed = this.fastSpeed
        break
    }
  })
  document.addEventListener('keyup', (e) => {
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
    }
  })
}

Person.prototype = new Character()

Person.prototype.setCamera = function (camera) {
  this.model.add(camera)
  camera.position.set(0, 2, -2)
  camera.lookAt(0, 1, 1)
  camera.add(this.listener)
}

function Zombie (url, speed = 0.02, moveDuration = 1) {
  Character.apply(this, [url, speed, moveDuration])
  this.forward = true
}

Zombie.prototype = new Character()

Zombie.prototype.load = function (listener, audioUrl) {
  let sound = new THREE.PositionalAudio(listener)
  let audioLoader = new THREE.AudioLoader();
  let promise = Character.prototype.load.apply(this)
  promise.then(([g, m]) => {
    this.model.add(sound)
    audioLoader.load(audioUrl, (buffer) => {
      sound.setBuffer(buffer)
      sound.setRefDistance(0.002)
      sound.setVolume(100)
      sound.setLoop(true)
      sound.play()
    })
  })
  return promise
}

Zombie.fall = function (zombies) {
  fall(zombies)
}

// 丧尸随机移动
Zombie.prototype.shift = function () {
  let r = Math.random()
  let chance = 0.1
  if (r < chance) {
    this.shiftAngle = (r - (chance / 2)) * Math.PI / 2
  } else {
    this.shiftAngle = 0
  }
}

Zombie.prototype.update = function () {
  this.shift()
  Character.prototype.update.apply(this)
}

Zombie.prototype.boundaryTest = function () {
  if (Character.prototype.boundaryTest.apply(this)) {
    let r = Math.random()
    this.shiftAngle = Math.PI * (r - 0.5)
  }
}

function onError (err) {
  console.log(err)
}
