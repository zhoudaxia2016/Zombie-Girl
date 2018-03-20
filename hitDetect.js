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
