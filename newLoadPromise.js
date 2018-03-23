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
