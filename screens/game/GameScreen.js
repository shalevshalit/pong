import React from 'react'
import * as _ from 'lodash'
import * as firebase from 'firebase'
import Matter from "matter-js"
import { GameEngine } from "react-native-game-engine"
import { BALL_SIZE, RACKET_WIDTH } from '../../services/layout/layout-constants'
import { Ball, BALL_SETTINGS } from './components/Ball'
import { Wall, WALL_SETTINGS } from './components/Wall'
import { Racket } from './components/Racket'

const GAME_WIDTH = 340
const GAME_HEIGHT = 650
const PLANK_HEIGHT = 20
const PLANK_WIDTH = 70
const BORDER = 15

const ball = Matter.Bodies.circle(
  GAME_WIDTH / 2 - BALL_SIZE,
  GAME_HEIGHT / 2,
  BALL_SIZE,
  {
    ...BALL_SETTINGS,
    label: "ball"
  }
)

const topWall = Matter.Bodies.rectangle(
  GAME_WIDTH / 2,
  -BORDER * 2,
  GAME_WIDTH,
  BORDER,
  { ...WALL_SETTINGS, isSensor: true, label: "topWall" }
)
const bottomWall = Matter.Bodies.rectangle(
  GAME_WIDTH / 2,
  GAME_HEIGHT + BORDER * 2,
  GAME_WIDTH,
  BORDER,
  { ...WALL_SETTINGS, isSensor: true, label: "bottomWall" }
)

const leftWall = Matter.Bodies.rectangle(
  0,
  GAME_HEIGHT / 2,
  BORDER,
  GAME_HEIGHT,
  {
    ...WALL_SETTINGS,
    label: "leftWall"
  }
)
const rightWall = Matter.Bodies.rectangle(
  GAME_WIDTH,
  GAME_HEIGHT / 2,
  BORDER,
  GAME_HEIGHT,
  { ...WALL_SETTINGS, label: "rightWall" }
)

const engine = Matter.Engine.create({ enableSleeping: false })
const world = engine.world

Matter.World.add(world, [
  ball,
  topWall,
  bottomWall,
  rightWall,
  leftWall
])

export default class GameScreen extends React.PureComponent {
  constructor(props) {
    super(props)
    const { navigation } = this.props
    this.playersService = navigation.getParam('playersService')

    this.physics = (entities, { time }) => {
      let engine = entities["physics"].engine
      engine.world.gravity.y = 0
      Matter.Engine.update(engine, time.delta)
      return entities
    }

    this.myRacket = this.playersService.myPlayer.body

    Matter.World.add(world, _.map(this.playersService.players, p => p.body))

    this.movePlank = (entities, { touches }) => {
      let move = touches.find(x => x.type === "move")
      if (move) {
        let xPosition = this.myRacket.position.x + move.delta.pageX
        if (xPosition < RACKET_WIDTH) {
          xPosition = RACKET_WIDTH
        }
        if (xPosition > GAME_WIDTH - RACKET_WIDTH) {
          xPosition = GAME_WIDTH - RACKET_WIDTH
        }
        const newPosition = {
          x: xPosition,
          y: this.myRacket.position.y
        }
        Matter.Body.setPosition(this.myRacket, newPosition)
      }

      return entities
    }

    setInterval(() => {
      const { position, body } = this.playersService.myPlayer
      if (position.x !== body.position.x) {
        position.x = body.position.x
        firebase.database().ref(`games/${this.playersService.gameId}/players/${this.playersService.playerId}/position`).set(position)
      }
    }, 100)

    firebase.database().ref(`games/${this.playersService.gameId}/ball`).on('value', snapshot => {
      const { position, velocity } = snapshot.val()
      const isRed = this.playersService.myPlayer.team === 'red'
      const dup = isRed ? 1 : -1

      Matter.Body.setPosition(ball, {
        x: position.x,
        y: isRed ? position.y : (GAME_HEIGHT - position.y)
      })
      Matter.Body.setVelocity(ball, { x: velocity.x, y: dup * velocity.y })
    })
  }

  componentDidMount() {
    Matter.Events.on(engine, "collisionStart", event => {
      const pairs = event.pairs

      const objA = pairs[0].bodyA.label
      const objB = pairs[0].bodyB.label

      if (objA === 'ball' && (objB === 'bottomWall' || objB === 'topWall') && this.playersService.isHost()) {
        setTimeout(() => {
          Matter.Body.setPosition(ball, {
            x: GAME_WIDTH / 2 - BALL_SIZE,
            y: GAME_HEIGHT / 2,
          })
          Matter.Body.setVelocity(ball, { x: 3, y: 3 })
          this.updateBallPosition()
        }, 500)

      }

      console.log(objA, objB)
      if (objA === 'ball' && objB === this.myRacket.label) {
        setTimeout(() => {
          this.updateBallPosition()
        }, 500)
      }
    })
  }

  updateBallPosition() {
    const isRed = this.playersService.myPlayer.team === 'red'
    const dup = isRed ? 1 : -1
    let velocity = ball.velocity.y

    if(Math.abs(velocity) < 1) {
      velocity = velocity + Math.sign(velocity)
    }

    firebase.database().ref(`games/${this.playersService.gameId}/ball`).set({
      position: {
        x: ball.position.x,
        y: isRed ? ball.position.y : GAME_HEIGHT - ball.position.y
      },
      velocity: {
        x: ball.velocity.x,
        y: dup * velocity,
      }
    })
  }

  render() {
    const playersEntities = _.mapValues(this.playersService.players, player => {
      return {
        body: player.body,
        size: [PLANK_WIDTH, PLANK_HEIGHT],
        color: player.team,
        renderer: Racket,
      }
    })

    const entities = {
      physics: {
        engine: engine,
        world: world
      },
      ball: {
        body: ball,
        size: [BALL_SIZE, BALL_SIZE],
        renderer: Ball
      },
      topWall: {
        body: topWall,
        size: [GAME_WIDTH, 10],
        color: "#f9941d",
        renderer: Wall,
        yAdjustment: -30
      },
      bottomWall: {
        body: bottomWall,
        size: [GAME_WIDTH, 10],
        color: "#f9941d",
        renderer: Wall,
        yAdjustment: 58
      },
      leftWall: {
        body: leftWall,
        size: [5, GAME_HEIGHT],
        color: "#333",
        renderer: Wall,
        xAdjustment: 0
      },
      rightWall: {
        body: rightWall,
        size: [5, GAME_HEIGHT],
        color: "#333",
        renderer: Wall,
        xAdjustment: 0
      },
      ...playersEntities
    }
    return (
      <GameEngine
        style={styles.container}
        systems={[this.physics, this.movePlank]}
        entities={entities}
      >
      </GameEngine>
    )
  }
}

const styles = {
  container: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#ddd",
    alignSelf: "center"
  }
}
