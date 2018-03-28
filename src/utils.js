function fall (land, objs) {
  for (let obj of objs) {
    obj.groundHitDetect(land)
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
