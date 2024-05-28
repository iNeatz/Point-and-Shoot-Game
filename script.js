/**@type {HTMLCanvasElement} */

//canvas config
const canvas = document.getElementById('canvas1')
const ctx = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight

//globals
let score = 0
ctx.font = '50px Impact'
let gameOver = false
const bgMusic = new Audio()
bgMusic.src = './audio/bgMusic.mp3'
bgMusic.loop = true

//collision canvas config
const collisionCanvas = document.getElementById('collisionCanvas')
const collisionCtx = collisionCanvas.getContext('2d')
collisionCanvas.height = window.innerHeight
collisionCanvas.width = window.innerWidth

//timestamp
let timeToNextRaven = 0
let ravenInterval = 500 //ms
let lastTime = 0

//defining and creating ravens
let ravens = []
class Raven {
	constructor() {
		this.spriteWidth = 271
		this.spriteHeight = 194
		this.sizeModifier = Math.random() * 0.6 + 0.4
		this.width = 271 * this.sizeModifier
		this.height = 194 * this.sizeModifier
		this.x = canvas.width
		this.y = Math.random() * (canvas.height - this.height)
		this.speedX = Math.random() * 5 + 3
		this.speedY = Math.random() * 5 - 2.5
		this.markedForDeletion = false
		this.image = new Image()
		this.image.src = './images/raven.png'
		this.frame = 0
		this.maxFrame = 4
		this.timeSinceFlap = 0
		this.flapInterval = Math.random() * 50 + 50
		this.randomColors = [
			Math.floor(Math.random() * 255),
			Math.floor(Math.random() * 255),
			Math.floor(Math.random() * 255),
		] // [red, green, blue] values range from 0 to 255
		this.color = `rgb(${this.randomColors[0]}, ${this.randomColors[1]}, ${this.randomColors[2]})`
		this.hasTrail = Math.random() > 0.5
	}
	update(deltatime) {
		if (this.y < 0 || this.y > canvas.height - this.height)
			this.speedY = this.speedY * -1

		this.x -= this.speedX
		this.y += this.speedY

		if (this.x + this.width < 0) this.markedForDeletion = true
		this.timeSinceFlap += deltatime

		if (this.timeSinceFlap > this.flapInterval) {
			this.frame < this.maxFrame ? this.frame++ : (this.frame = 0)
			this.timeSinceFlap = 0
			if (this.hasTrail) {
				for (let i = 0; i < 5; i++) {
					particles.push(new Particle(this.x, this.y, this.width, this.color))
				}
			}
		}

		if (this.x + this.width < 0) gameOver = true
	}
	draw() {
		collisionCtx.fillStyle = this.color
		collisionCtx.fillRect(this.x, this.y, this.width, this.height)
		ctx.drawImage(
			this.image,
			this.frame * this.spriteWidth,
			0,
			this.spriteWidth,
			this.spriteHeight,
			this.x,
			this.y,
			this.width,
			this.height
		)
	}
}

//Explosion animation
let explosions = []
class Explosion {
	constructor(x, y, size) {
		this.image = new Image()
		this.image.src = './images/boom.png'
		this.spriteWidth = 200
		this.spriteHeight = 179
		this.size = size
		this.x = x
		this.y = y
		this.frame = 0
		this.sound = new Audio()
		this.sound.src = './audio/boom.wav'
		this.timeSinceLastFrame = 0
		this.frameInterval = 200
		this.markedForDeletion = false
	}
	update(deltatime) {
		if (this.frame === 0) this.sound.play()

		this.timeSinceLastFrame += deltatime
		if (this.timeSinceLastFrame > this.frameInterval) {
			this.frame++
			if (this.frame > 5) this.markedForDeletion = true
			this.timeSinceLastFrame = 0
		}
	}
	draw() {
		ctx.drawImage(
			this.image,
			this.frame * this.spriteWidth,
			0,
			this.spriteWidth,
			this.spriteHeight,
			this.x,
			this.y - this.size * 0.25,
			this.size,
			this.size
		)
	}
}

//Creating Particles
let particles = []
class Particle {
	constructor(x, y, size, color) {
		this.size = size
		this.x = x + this.size / 2
		this.y = y + this.size / 3
		this.radius = (Math.random() * this.size) / 10
		this.maxRadius = Math.random() * 20 + 35
		this.markedForDeletion = false
		this.speedX = Math.random() * 1 + 0.5
		this.color = color
	}
	update() {
		this.x += this.speedX
		this.radius += 0.3
		if (this.radius > this.maxRadius - 5) this.markedForDeletion = true
	}
	draw() {
		ctx.save()
		ctx.globalAlpha = 1 - this.radius / this.maxRadius
		ctx.beginPath()
		ctx.fillStyle = this.color
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
		ctx.fill()
		ctx.restore()
	}
}

//Displaying the Score
const drawScore = () => {
	ctx.fillStyle = '#222'
	ctx.fillText(`Score: ${score}`, 50, 75)
	ctx.fillStyle = '#fff'
	ctx.fillText(`Score: ${score}`, 55, 80)
}

//Displaying game over screen
const drawGameOver = () => {
	ctx.textAlign = 'center'
	ctx.fillStyle = 'black'
	ctx.fillText(
		`GAME OVER, your score is: ${score}`,
		canvas.width / 2,
		canvas.height / 2
	)
	ctx.fillStyle = 'white'
	ctx.fillText(
		`GAME OVER, your score is: ${score}`,
		canvas.width / 2 + 5,
		canvas.height / 2 + 5
	)
}

//Shooting Mechanics
window.addEventListener('click', (e) => {
	const detectPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1)
	const pixelColor = detectPixelColor.data
	ravens.forEach((raven) => {
		if (
			raven.randomColors[0] === pixelColor[0] &&
			raven.randomColors[1] === pixelColor[1] &&
			raven.randomColors[2] === pixelColor[2]
		) {
			//collision detected
			raven.markedForDeletion = true
			score++
			explosions.push(new Explosion(raven.x, raven.y, raven.width))

			if (raven.hasTrail) {
				score++
			}
		}
	})
})

//Game Loop
const animate = (timestamp) => {
	//clear the canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	collisionCtx.clearRect(0, 0, canvas.width, canvas.height)

	//set the timestamp
	let deltatime = timestamp - lastTime
	lastTime = timestamp
	timeToNextRaven += deltatime

	//set precise time to spawn next ravens
	if (timeToNextRaven > ravenInterval) {
		ravens.push(new Raven())
		timeToNextRaven = 0

		//sort ravens by size to send the small ravens to the back for a field of depth
		ravens.sort((a, b) => a.width - b.width)
	}

	drawScore()

	//update and draw ravens
	;[...particles, ...ravens, ...explosions].forEach((object) => {
		object.update(deltatime)
		object.draw()
	})

	//delete the ravens and explosion sprites
	ravens = ravens.filter((raven) => !raven.markedForDeletion)
	explosions = explosions.filter((explosion) => !explosion.markedForDeletion)
	particles = particles.filter((particle) => !particle.markedForDeletion)

	if (!gameOver && window.innerWidth >= 790) {
		requestAnimationFrame(animate)
		bgMusic.play()
	} else {
		drawGameOver()
		bgMusic.pause()
	}
}

animate(0)
