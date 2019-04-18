import React from 'react'
import { Dimensions } from 'react-native'
import * as firebase from 'firebase'
import { LayoutService } from '../../services/layout-service'
import Matter from "matter-js"
import { GameEngine } from "react-native-game-engine"
import { BALL_SIZE } from '../../services/layout/layout-constants'
import { Ball, BALL_SETTINGS } from './components/Ball'
import { Wall, WALL_SETTINGS } from './components/Wall'
import { Racket, RACKET_SETTINGS } from './components/Racket'

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
  - BORDER * 2,
  GAME_WIDTH,
  BORDER,
  { ...WALL_SETTINGS, label: "topWall" }
)
const bottomWall = Matter.Bodies.rectangle(
  GAME_WIDTH / 2,
  GAME_HEIGHT + BORDER * 2,
  GAME_WIDTH,
  BORDER,
  { ...WALL_SETTINGS, label: "bottomWall" }
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

const yourRacket = Matter.Bodies.rectangle(
  95,
  BORDER,
  PLANK_WIDTH,
  PLANK_HEIGHT,
  {
    ...RACKET_SETTINGS,
    label: "plankOne"
  }
)
const otherRacket = Matter.Bodies.rectangle(
  95,
  GAME_HEIGHT - 50,
  PLANK_WIDTH,
  PLANK_HEIGHT,
  { ...RACKET_SETTINGS, label: "racket" }
)


const engine = Matter.Engine.create({ enableSleeping: false })
const world = engine.world

Matter.World.add(world, [
  ball,
  topWall,
  bottomWall,
  rightWall,
  leftWall,
  otherRacket,
  yourRacket
])

export default class GameOldScreen extends React.PureComponent {
  constructor(props) {
    super(props)
    const { navigation } = this.props
    const gameId = navigation.getParam('gameId')
    const playerId = navigation.getParam('playerId')
    const team = navigation.getParam('team')
    const { width, height } = Dimensions.get('window')

    this.layoutService = new LayoutService(width, height)

    this.physics = (entities, { time }) => {
      let engine = entities["physics"].engine
      engine.world.gravity.y = 0
      Matter.Engine.update(engine, time.delta)
      return entities
    }

    this.movePlank = (entities, { touches }) => {
      let move = touches.find(x => x.type === "move")
      if (move) {
        const newPosition = {
          x: otherRacket.position.x + move.delta.pageX,
          y: otherRacket.position.y
        };
        Matter.Body.setPosition(otherRacket, newPosition);
      }

      return entities
    }

    this.state = {
      gameId,
      playerId,
      players: {
        [playerId]: {
          team
        },
      },
    }
  }

  componentDidMount() {
    firebase.database().ref(`games/${this.state.gameId}/ball`).on('value', snapshot => {
      if (snapshot.val()) {
        const { position, velocity } = snapshot.val()
        Matter.Body.setPosition(ball, { x: position.x, y: position.y })
        Matter.Body.setVelocity(ball, { x: velocity.x, y: velocity.y })
      }
    })

    Matter.Events.on(engine, "collisionStart", event => {
      const pairs = event.pairs

      const objA = pairs[0].bodyA.label
      const objB = pairs[0].bodyB.label

      if (objA === 'ball' && objB === 'topWall') {
        Matter.Body.setPosition(ball, {
          x: GAME_WIDTH / 2 - BALL_SIZE,
          y: GAME_HEIGHT / 2,
        })
      }


      if (objA === 'ball' && objB === 'bottomWall') {
        Matter.Body.setPosition(ball, {
          x: GAME_WIDTH / 2 - BALL_SIZE,
          y: GAME_HEIGHT / 2,
        })
      }

      if(objA === 'ball' && objB === 'racket') {
        firebase.database().ref(`games/${this.state.gameId}/ball`).set({
          position: {
            x: ball.position.x,
            y: ball.position.y,
          },
          velocity: {
            x: ball.velocity.x,
            y: ball.velocity.y,
          },
        })
      }
    })
  }

  render() {
    return (
      <GameEngine
        style={styles.container}
        systems={[this.physics, this.movePlank]}
        entities={{
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
          playerOnePlank: {
            body: yourRacket,
            size: [PLANK_WIDTH, PLANK_HEIGHT],
            color: "#a6e22c",
            renderer: Racket,
            xAdjustment: 30
          },
          playerTwoPlank: {
            body: otherRacket,
            size: [PLANK_WIDTH, PLANK_HEIGHT],
            color: "#7198e6",
            renderer: Racket,
            type: "rightPlank",
            xAdjustment: -33
          },
        }}
      >
      </GameEngine>
    )
  }
}

const styles = {
  container: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#00F",
    alignSelf: "center"
  }
}
