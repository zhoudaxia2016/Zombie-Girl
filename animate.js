function animate(skinnedMesh) {
  var materials = skinnedMesh.material.materials;
  for (var k in materials) {
    materials[k].skinning = true;
  }
  THREE.AnimationHandler.add(skinnedMesh.geometry.animation);
  animation = new THREE.Animation(skinnedMesh, "ArmatureAction", THREE.AnimationHandler.CATMULLROM);
  return animation
}
