function groundHitDetect (obj, land) {
  let adjust = 0.01
  let pos = obj.position
  let ray = new THREE.Raycaster(pos, new THREE.Vector3(0, -1, 0))
  let hitResults = ray.intersectObjects([land])
  if (hitResults.length > 0) {
    let res = hitResults[0]
    if (res.distance < -0.01) {
      return new THREE.Vector3(0, adjust, 0)
    } else if (res.distance > 0.01) {
      return new THREE.Vector3(0, -adjust, 0)
    } else {
      return new THREE.Vector3(0, 0, 0)
    }
  } else {
    return new THREE.Vector3(0, adjust, 0)
  }
}

// Create bounding box
function AABB (obj) {
  let xmax = Number.NEGATIVE_INFINITY, xmin = Number.POSITIVE_INFINITY
  let ymax = xmax, ymin = xmin
  console.log(obj)
  let vts = obj.geometry.vertices
  for (let i = 0, l = vts.length; i < l; i++) {
    let { x, y } = vts[i]
    xmax = Math.max(xmax, x), ymax = Math.max(ymax, y)
    xmin = Math.min(xmin, x), ymin = Math.min(ymin, y)
  }
  return { xmax, xmin, ymax, ymin }
}

function bbox (obj) {
  let geometry = new THREE.BoxHelper(obj).geometry
  geometry.computeBoundingBox()
  let box = geometry.boundingBox
  return {
    min: { x: box.min.x, z: box.min.z },
    max: { x: box.max.x, z: box.max.z }
  }
}


