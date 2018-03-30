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
        loader.load(url, function(arg1, arg2) {
          resolve([arg1, arg2])
        })
      })
      break
    case THREE.ColladaLoader:
    case THREE.ObjectLoader:
    case THREE.AudioLoader:
      loader = new loader()
      return new Promise(function (resolve) {
        loader.load(url, function (arg) {
          resolve(arg)
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

// 获取二维aabb
function getRect (model) {
  let box = getRange(model)
  return new Rect(box.max.x, box.min.x, box.max.z, box.min.z)
}

// 知道两直角边求夹角
function getAngle (s1, s2) {
  return Math.asin(s1 / Math.sqrt(s1**2 + s2**2))
}

// 获取包围盒或某坐标轴范围
function getRange (model, axis) {
  let geometryHelper = new THREE.BoxHelper(model).geometry
  geometryHelper.computeBoundingBox()
  let box = geometryHelper.boundingBox
  if (axis) {
    return {
      max: box.max[axis],
      min: box.min[axis]
    }
  }
  return box
}
