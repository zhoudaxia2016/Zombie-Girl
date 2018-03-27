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
        child.receiveShadow = true
        child.position.set(0, 0, 0)
        land.model = child
        land.rect = getRect(child)
        /*
        vs = child.geometry.vertices.map(item => item.clone().applyMatrix4(child.matrixWorld))
        let vqt = new QuadTree(land.rect)
        for (let i = 0, l = vs.length; i < l; i ++) {
          vqt.insert(vs[i])
        }
        land.vqt = vqt
        */
        return
      }
      let surroundding_type = ['grass', 'Cylinder', 'pine', 'Icosphere']
      for (let type of surroundding_type) {
        if (child.name.startsWith(type)) {
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
  this.rect = getRect(this.model)
}


// 角色 (包括丧尸和人物)
function Character (url, initialSpeed = 0.01, moveDuration = 1.6, fastSpeed = 0.05) {
  this.url = url
  this.moveDuration =  moveDuration
  this.forwar = this.turnLeft = this.turnRight = false
  this.initialSpeed = initialSpeed
  this.speed = initialSpeed
  this.fastSpeed = fastSpeed
  this.needUpdateRect = true
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
  let { model, mixer, action, forward, turnLeft, turnRight, moveDuration, initialSpeed, speed } = this
  action.setDuration(moveDuration * initialSpeed / speed)
  if (forward) {
    action.play()
    mixer.update(clock.getDelta())
    model.translateZ(speed)
    this.computing = false
    if (this.worker) {
      this.worker.terminate()
      delete this.worker
    }
    this.needUpdateRect = true
  } else {
    action.stop()
  }
  if (turnLeft) {
    model.rotateY(Math.PI / 100)
  }
  if (turnRight) {
    model.rotateY(-Math.PI / 100)
  }
}

// 与地面碰撞检测
Character.prototype.groundHitDetect = function (land) {
  if (!this.computing) {
    console.log(this, land.vqt)
    this.computing = true
    this.worker = new Worker('./worker/groundHitDetect.js')
    this.worker.postMessage({ vertices: land.vertices, rect: this.rect, character_y: this.y })
    //this.worker.postMessage({ model: JSON.parse(JSON.stringify(this.model)) })
    let geometryHelper = new THREE.BoxHelper(this.model).geometry
    geometryHelper.computeBoundingBox()
    let box = geometryHelper.boundingBox
    this.y = box.min.y
    this.worker.onmessage =  (e) => {
      console.log(this.y, e.data)
      this.model.translateY(e.data - this.y)
      this.y = e.data
    }
  }
}

Character.prototype.retreat = function () {
  this.model.translateZ(-this.speed)
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


// 控制角色
function Person (url, speed, moveDuration, fastSpeed) {
  Character.apply(this, [url, speed, moveDuration, fastSpeed])
  document.addEventListener('keydown', (e) => {
    switch (e.keyCode) {
      case 87:
        this.forward = true
        break
      case 65:
        this.turnLeft = true
        break
      case 68:
        this.turnRight = true
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
        this.turnLeft = false
        break
      case 68:
        this.turnRight = false
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
  camera.position.set(0, 2, -3)
  camera.lookAt(0, 1, 0)
}

function Zombie (url, speed = 0.01, moveDuration = 1) {
  Character.apply(this, [url, speed, moveDuration])
  this.forward = true
}

Zombie.prototype = new Character()

Zombie.fall = function (zombies) {
  fall(zombies)
}

  /*
Zombie.prototype.move = function () {
  let { model, mixer, action, moveDuration, initialSpeed, speed } = this
  action.setDuration(moveDuration * initialSpeed / speed)
  let r = Math.random()
  if (r > 0.03) {
    action.play()
    mixer.update(clock.getDelta())
    model.translateZ(speed)
    this.computing = false
    delete this.worker
  } else {
    action.stop()
  }
  r = Math.random()
  if (r < 0.1) {
    model.rotateY(Math.PI * r )
  } else if (r > 0.9) {
    model.rotateY(-Math.PI * (1-r))
  }
}
*/


function onError (err) {
  console.log(err)
}
