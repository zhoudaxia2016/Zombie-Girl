// 文件路径
const ASSETS_DIR = './assets/'
const MODEL_DIR = ASSETS_DIR + 'models/'
const AUDIO_DIR = ASSETS_DIR + 'audios/'
const IMAGE_DIR = ASSETS_DIR + 'images/'

const FILES = {
  SURROUNDDING: MODEL_DIR + 'land.json',
  ROLE: MODEL_DIR + 'boy.json',
  ZOMBIE: MODEL_DIR + 'girlZombie.json',
  ZOMBIE_SOUND: AUDIO_DIR + 'zombieSound4.mp3',
  HANDGUN_SOUND: AUDIO_DIR + 'handgun.mp3',
  BULLET: MODEL_DIR + 'bullet.json',
  SKY_IMAGES: [
    IMAGE_DIR + 'skyposx.png',
    IMAGE_DIR + 'skynegx.png',
    IMAGE_DIR + 'skyposy.png',
    IMAGE_DIR + 'skynegy.png',
    IMAGE_DIR + 'skyposz.png',
    IMAGE_DIR + 'skynegz.png'
  ],
}

// 景物在blender中的name
const SURROUNDDING_NAME = {
  GRASS: 'grass',
  TREE: 'Cylinder',
  PINE: 'pine',
  ROCK: 'Icosphere',
}

const LAND_NAME = 'Plane'

// 角色参数
const ROLE = {
  INITIAL_SPEED: 0.02,
  MOVE_DURATION: 1.6,
  FAST_SPEED: 0.04,
  SHIFT_ANGLE: Math.PI / 100,
  CAMERA_POSITION: [0, 2, -2],
  CAMERA_LOOKAT: [0, 1, 1],
}

// 丧尸参数
const ZOMBIE = {
  SHIFT_CHANCE: 0.1,
  SHIFT_RANGE: Math.PI,
  SOUND: {
    DISTANCE: 0.002,
    VOLUME: 100,
  },
  INITIAL_SPEED: 0.02,
  MOVE_DURATION: 1,
  ATTACK_DISTANCE: 1.5,
  DETECT_DISTANCE: 15
}

const BOUNDARY_TOLERANCE = 3

const HIT_TYPES = {
  CHAR_SURR: 'charSurr',
  ZOMB_SURR: 'zombSurr',
  BULL_SURR: 'bullSurr',
  BULL_ZOMB: 'bullZomb',
  PERS_ZOMB: 'persZomb',
}

