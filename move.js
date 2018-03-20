let forward = false
let turnLeft = false
let turnRight = false
function onKeydown (e) {
  switch (e.keyCode) {
    case 87:
      forward = true
      break
    case 65:
      turnLeft = true
      break
    case 68:
      turnRight = true
      break
  }
}
function onKeyup (e) {
  switch (e.keyCode) {
    case 87:
      forward = false
      break
    case 65:
      turnLeft = false
      break
    case 68:
      turnRight = false
      break
  }
}

document.addEventListener('keydown', onKeydown)
document.addEventListener('keyup', onKeyup)
