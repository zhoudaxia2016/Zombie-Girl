importScripts('../hitDetect.js')
importScripts('../utils.js')
/*
onmessage = function (e) {
  let { vertices, rect, character_y } = e.data
  let { left, right, top, bottom } = rect
  let nearVerts = [], distSquare = 10000
  for (let i = 0, len = vertices.length; i < len; i ++) {
    let { x, z } = vertices[i]
    let xbias = Math.max(Math.max(x - left, 0), Math.max(right - x), 0)
    let zbias = Math.max(Math.max(z - top, 0), Math.max(bottom - z), 0)
    let ds = xbias**2 + zbias**2
    if (ds < distSquare) {
      nearVerts.push({ v: vertices[i], ds })
      distSquare = ds
    }
  }
  let len = nearVerts.length
  let sum = nearVerts.slice(len - 3, len).reduce((dist, item) => {
    return dist + item.v.y
  }, 0)
  let land_y = sum / 3
  postMessage(land_y)
  self.close()
}
*/

/*
onmessage = function (e) {
  let model = this.model
  let adjust = 0.01
  let ray = new THREE.Raycaster(model.position, new THREE.Vector3(0, -1, 0))
  let results = ray.intersectObject(model)
  let v = new THREE.Vector3(0, 0, 0)
  if (results.length > 0) {
    if (results[0].distance < -0.01) {
      postMessage(adjust)
    } else if (results[0].distance > 0.01) {
      postMessage(-adjust)
    }
  } else {
    postMessage(adjust)
  }
}
  self.close()
*/

onmessage = function (e) {
  let { character, fqt } = e.data
  fqt.__proto__ = QuadTree.prototype
  fqt.retrieve(character, function (datas) {
    console.log('aaa', datas)
  })
  postMessage(0)
  self.close()
}
