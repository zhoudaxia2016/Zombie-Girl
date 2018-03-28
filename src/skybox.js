function createSkyBox (scene) {
  let urlPrefix = "./assets/images/sky"
  let urls = [ urlPrefix + "posx.jpg", urlPrefix + "negx.jpg",
    urlPrefix + "posy.jpg", urlPrefix + "negy.jpg",
    urlPrefix + "posz.jpg", urlPrefix + "negz.jpg" ]
  var skyGeometry = new THREE.BoxGeometry(100, 100, 100)
  var materialArray = [];
  for (let i = 0; i < 6; i++) {
    materialArray.push(new THREE.MeshBasicMaterial({
      map: THREE.ImageUtils.loadTexture(urls[i]),
      side: THREE.BackSide
    }))
  }
  let skyMaterial = new THREE.MeshFaceMaterial(materialArray)
  let skyBox = new THREE.Mesh(skyGeometry, skyMaterial)
  scene.add(skyBox)
  /*
  sky = new THREE.Sky()
  sky.scale.setScalar(100)
  scene.add(sky)
  let sunSphere = new THREE.Mesh(
    new THREE.SphereBufferGeometry(100, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  )
  sunSphere.position.y = - 700000
  sunSphere.visible = false
  scene.add(sunSphere)
  */
}
