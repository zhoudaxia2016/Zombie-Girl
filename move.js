let forward = false
let turnLeft = false
let turnRight = false
let speed = 0.01
let acceleration = 0.02
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
      speed = speed + acceleration
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
      speed = speed - acceleration
      break
  }
}

document.addEventListener('keydown', onKeydown)
document.addEventListener('keyup', onKeyup)
