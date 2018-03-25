function fall () {
  for (let plant of surrounddings) {
    let { model } = plant
    let pos = model.position.clone()
    let geometry = new THREE.BoxHelper(model).geometry
    geometry.computeBoundingBox()
    let box = geometry.boundingBox
    pos.y = box.min.y
    let ray = new THREE.Raycaster(pos, new THREE.Vector3(0, -1, 0))
    let hitResults = ray.intersectObjects([land.model])
    if (hitResults.length > 0) {
      let v = new THREE.Vector3(0, -hitResults[0].distance, 0)
      model.position.add(v)
    }
  }
}

function newLoadPromise (url, loader) {
  if (!THREE) {
    console.log('THREE does not exist!')
    return
  }
  switch (loader) {
    case THREE.JSONLoader:
      loader = new loader()
      return new Promise(function (resolve) {
        loader.load(url, function(geometry, materials) {
          resolve([geometry, materials])
        })
      })
      break
    case THREE.ColladaLoader:
      loader = new loader()
      return new Promise(function (resolve) {
        loader.load(url, function (collada) {
          resolve(collada)
        })
      })
      break
    case THREE.ObjectLoader:
      loader = new loader()
      return new Promise(function (resolve) {
        loader.load(url, function (obj) {
          resolve(obj)
        })
      })
      break
  }
}

// 矩形（获取aabb或者四叉树节点数据会用到)
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
