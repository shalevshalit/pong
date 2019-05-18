import React from 'react'
import * as _ from 'lodash'
import * as firebase from 'firebase'
import Matter from "matter-js"
import { GameEngine } from "react-native-game-engine"
import { BALL_SIZE, RACKET_WIDTH } from '../../services/layout/layout-constants'
import { Ball, BALL_SETTINGS } from './components/Ball'
import { Wall, WALL_SETTINGS } from './components/Wall'
import { Racket } from './components/Racket'
import { StyleSheet, Text, View } from "react-native"

const WIN_SCORE = 3

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
  GAME_HEIGHT / 2 - 25,
  BORDER,
  GAME_HEIGHT,
  {
    ...WALL_SETTINGS,
    label: "leftWall"
  }
)
const rightWall = Matter.Bodies.rectangle(
  GAME_WIDTH,
  GAME_HEIGHT / 2 - 25,
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

    this.state = {
      redScore: 0,
      blueScore: 0
    }
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
      const move = touches.find(x => x.type === "move")
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
      const press = touches.find(x => x.type === "press")
      if (press) {
        Matter.Body.translate(this.myRacket, { x: 0, y: -30 })
        setTimeout(() => {
          Matter.Body.translate(this.myRacket, { x: 0, y: 30 })
        }, 100)
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


  }


  componentWillMount() {
    this.ballRef = firebase.database().ref(`games/${this.playersService.gameId}/ball`)
    this.ballRef.on('value', snapshot => {
      const { last, score } = snapshot.val()
      this.last = last
      this.score = score
      if (score && this.state.redScore !== score.red) {
        this.setState({ redScore: score.red })
      }
      if (score && this.state.blueScore !== score.blue) {
        this.setState({ blueScore: score.blue })
      }
      this.exitIfDone()
    })
    const ballPositionRef = this.ballRef.child('position')
    ballPositionRef.on('value', snapshot => {
      const position = snapshot.val()
      const isRed = this.playersService.myPlayer.team === 'red'

      Matter.Body.setPosition(ball, {
        x: position.x,
        y: isRed ? position.y : (GAME_HEIGHT - position.y)
      })
    })

    const ballVelocityRef = this.ballRef.child('velocity')
    ballVelocityRef.on('value', snapshot => {
      const velocity = snapshot.val()
      const isRed = this.playersService.myPlayer.team === 'red'
      const dup = isRed ? 1 : -1

      Matter.Body.setVelocity(ball, { x: velocity.x, y: dup * velocity.y })
    })

    this.manageCollision();
  }


  componentWillUnmount() {
    this.ballRef.off('value')
    this.ballRef.child('position').off('value')
    this.ballRef.child('velocity').off('value')
    Matter.Events.off(engine, "collisionStart")
  }

  manageCollision() {
    const oppositeTeam = {
      red: 'blue',
      blue: 'red'
    }
    let isUpdatingScore = false
    Matter.Events.on(engine, "collisionStart", event => {
      const team = this.playersService.myPlayer.team
      const pairs = event.pairs

      const objA = pairs[0].bodyA.label
      const objB = pairs[0].bodyB.label

      if (objA === 'ball' && (objB === 'bottomWall' || objB === 'topWall') && this.playersService.isHost() && !this.isDone()) {
        if (!isUpdatingScore) {
          isUpdatingScore = true
          const scoredTeam = objB === 'bottomWall' ? oppositeTeam[team] : team
          const { last, score } = this
          score[scoredTeam] = score[scoredTeam] + 1
          if (last[scoredTeam]) {
            firebase.database().ref(`games/${this.playersService.gameId}/players/${last[scoredTeam]}/goals`).set((this.playersService.players[last[scoredTeam]].goals || 0) + 1)
            this.playersService.players[last[scoredTeam]].goals = (this.playersService.players[last[scoredTeam]].goals || 0) + 1
          }
          firebase.database().ref(`games/${this.playersService.gameId}/ball/score/${scoredTeam}`).set(score[scoredTeam])
          firebase.database().ref(`games/${this.playersService.gameId}/ball/last`).set({
            red: 0,
            blue: 0
          })

          this.setState({redScore: score['red'], blueScore: score['blue']})
          this.exitIfDone()

          setTimeout(() => {
            Matter.Body.setPosition(ball, {
              x: GAME_WIDTH / 2 - BALL_SIZE,
              y: GAME_HEIGHT / 2,
            })
            Matter.Body.setVelocity(ball, { x: 3, y: 3 })
            this.updateBallPosition()
            isUpdatingScore = false
          }, 400)
        }
      }

      console.log(objA, objB)
      if (objA === 'ball' && objB === this.myRacket.label) {
        console.log('touched', `games/${this.playersService.gameId}/ball/last/${team}`, this.playersService.playerId)
        firebase.database().ref(`games/${this.playersService.gameId}/ball/last/${team}`).set(this.playersService.playerId)
        this.last[this.playersService.myPlayer.team] = this.playersService.playerId
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

    if (Math.abs(velocity) < 1) {
      velocity = velocity + Math.sign(velocity)
    }

    firebase.database().ref(`games/${this.playersService.gameId}/ball`).update({
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

  isDone(){
    return this.score.red >= WIN_SCORE || this.score.blue >= WIN_SCORE
  }

  exitIfDone() {
    if (this.isDone()) {
      const { navigate } = this.props.navigation

      navigate('EndGame', {
        playersService: this.playersService,
        score: this.score
      })
    }
  }

  render() {
    const playersEntities = _.mapValues(this.playersService.players, player => {
      const color = player.id === this.playersService.playerId ?
        (player.team === 'red' ? '#e8282e' : '#283aff') :
        (player.team === 'red' ? '#e85b5e' : '#6161ff')

      return {
        body: player.body,
        size: [PLANK_WIDTH, PLANK_HEIGHT],
        color: color,
        playerColor: player.uniqueColor,
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
      <View style={styles.screen}>
        <GameEngine
          style={styles.container}
          systems={[this.physics, this.movePlank]}
          entities={entities}
        >
          <View style={styles.scoresContainer}>
            <View style={styles.score}>
              <Text style={styles.scoreLabelBlue}>{'Blue'}</Text>
              <Text style={styles.scoreValue}> {this.state.blueScore}</Text>
            </View>
            <View style={styles.score}>
              <Text style={styles.scoreLabelRed}>{'Red'}</Text>
              <Text style={styles.scoreValue}> {this.state.redScore}</Text>
            </View>
          </View>
        </GameEngine>
      </View>
    )
  }
}

const styles = {
  screen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000'
  },
  container: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#000",
    alignSelf: "center"
  },
  scoresContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'absolute',
    top: 150,
    width: GAME_WIDTH,
    height: 150
  },
  score: {
    width: '50%'
  },
  scoreLabelRed: {
    color: 'rgba(200,0,0,0.9)',
    fontSize: 30,
    textAlign: 'center'
  },
  scoreLabelBlue: {
    color: 'rgba(0,0,200,0.9)',
    fontSize: 30,
    textAlign: 'center'
  },
  scoreValue: {
    color: '#fff',
    fontSize: 30,
    fontWeight: "bold",
    textAlign: 'center'
  }
}
