function createSkyBox (scene) {
  let skyGeometry = new THREE.BoxGeometry(100, 100, 100)
  let materialArray = [];
  let textureLoader = new THREE.TextureLoader()
  for (let i = 0; i < 6; i++) {
    materialArray.push(new THREE.MeshBasicMaterial({
      map: textureLoader.load(FILES.SKY_IMAGES[i]),
      side: THREE.BackSide
    }))
  }
  let skyBox = new THREE.Mesh(skyGeometry, materialArray)
  scene.add(skyBox)
}
