let forward = false
let turnLeft = false
let turnRight = false
let initialSpeed = 0.01
let speed = initialSpeed
let fastSpeed = 0.02
let moveDuration = 1.6
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
    case 16:
      speed = fastSpeed
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
    case 16:
      speed = initialSpeed
      break
  }
}

document.addEventListener('keydown', onKeydown)
document.addEventListener('keyup', onKeyup)
