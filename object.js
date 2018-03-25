/**
 * 游戏中的物体类
 */

// aabb
function Rect (left, right, top, bottom) {
  this.left = left
  this.right = right
  this.top = top
  this.bottom = bottom
}

// 获取aabb
function getRect (model) {
  let geometry = new THREE.BoxHelper(model).geometry
  geometry.computeBoundingBox()
  let box = geometry.boundingBox
  return new Rect(box.max.x, box.min.x, box.max.z, box.min.z)
}


// 植物
function Plant (model) {
  this.model = model
  this.updateRect()
}

// 处理导入后的场景
Plant.load = function (url) {
  let promise = newLoadPromise(url, THREE.ObjectLoader)
  promise.then(function (obj) {
    obj.traverse(function (child) {
      if (child.name === 'Plane') {
        child.receiveShadow = true
        child.position.set(0, 0, 0)
        land.model = child
        land.rect = getRect(child)
        return
      }
      let plant_type = ['grass', 'tree', 'pine']
      for (let type of plant_type) {
        if (child.name.startsWith(type)) {
          child.castShadow = true
          child.receiveShadow = true
          plants.push(new Plant(child))
        }
      }
    })
    scene.add(obj)
    console.log('Load scene completely!')
  }, onError)
  return promise
}

Plant.prototype.updateRect = function () {
  this.rect = getRect(this.model)
}


// 角色 (包括丧尸和人物)
function Character (url, initialSpeed = 0.01, fastSpeed = 0.02, moveDuration = 1.6) {
  this.url = url
  this.moveDuration =  moveDuration
  this.forwar = this.turnLeft = this.turnRight = false
  this.initialSpeed = initialSpeed
  this.speed = initialSpeed
  this.fastSpeed = fastSpeed
}

// 计算包围盒
Character.prototype.updateRect = function () {
  this.rect = getRect(this.model)
}

// 人物移动
Character.prototype.move = function () {
  let { model, mixer, action, forward, turnLeft, turnRight, moveDuration, initialSpeed, speed } = this
  action.setDuration(moveDuration * initialSpeed / speed)
  if (forward) {
    action.play()
    mixer.update(clock.getDelta())
    model.translateZ(speed)
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
  let adjust = 0.01
  let ray = new THREE.Raycaster(this.model.position, new THREE.Vector3(0, -1, 0))
  let results = ray.intersectObjects([land.model])
  let v = new THREE.Vector3(0, 0, 0)
  if (results.length > 0) {
    if (results[0].distance < -0.01) {
      v = new THREE.Vector3(0, adjust, 0)
    } else if (results[0].distance > 0.01) {
      v = new THREE.Vector3(0, -adjust, 0)
    }
  } else {
    v = new THREE.Vector3(0, adjust, 0)
  }
  this.model.position.add(v)
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

    this.model = mesh
    this.updateRect()
    this.mixer = new THREE.AnimationMixer(mesh)
    this.action = this.mixer.clipAction('walk')
    this.action.setDuration(this.moveDuration)
  }, onError)
  return promise
}


// 控制角色
function Person (url) {
  Character.apply(this, [url])
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


function onError (err) {
  console.log(err)
}
