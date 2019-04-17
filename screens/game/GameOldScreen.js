import React from 'react'
import { Button, Dimensions, StyleSheet, View } from 'react-native'
import * as firebase from 'firebase'
import * as _ from 'lodash'
import { LayoutService } from '../../services/layout-service'
import {
  BALL_SIZE, BUTTONS_SIZE, DEFAULT_HEIGHT, DEFAULT_WIDTH, RACKET_FROM_BOTTOM,
  RACKET_HEIGHT, RACKET_WIDTH
} from '../../services/layout/layout-constants'

export default class GameOldScreen extends React.Component {
  constructor(props) {
    super(props)
    const { navigation } = this.props
    const gameId = navigation.getParam('gameId')
    const playerId = navigation.getParam('playerId')
    const team = navigation.getParam('team')
    const { width, height } = Dimensions.get('window')

    this.layoutService = new LayoutService(width, height)

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
    firebase.database().ref(`games/${this.state.gameId}/players`).on('value', snapshot => {
      this.setState({ players: snapshot.val() })
    })
    firebase.database().ref(`games/${this.state.gameId}/ball`).on('value', snapshot => {
      if (snapshot.val()) {
        this.setState({ ball: this.getBallProps(snapshot.val()) })
      }
    })
    this.moveBall()
  }

  getBallProps(ball) {
    const { team } = this.getMyData()
    ball = ball || this.state.ball
    if (team === 'red') {
      return ball
    } else {
      return {
        x: DEFAULT_WIDTH - ball.x,
        y: DEFAULT_HEIGHT - ball.y,
        direction: ((Math.PI + ball.direction) % (2 * Math.PI)),
        speed: ball.speed
      }
    }
  }

  moveBall() {
    if (this.state.gameEnded) {
      return
    }
    const ball = this.state.ball
    if (ball) {
      let direction = ball.direction
      let newY = ball.y + Math.cos(direction) * ball.speed
      let newX = ball.x + Math.sin(direction) * ball.speed
      if (newX > DEFAULT_WIDTH - BALL_SIZE) {
        if (direction > 0.5 * Math.PI) {
          direction = direction + (Math.PI - direction) * 2
        } else {
          direction = 2 * Math.PI - direction
        }
        newX = ball.x + Math.sin(direction) * ball.speed
      }
      if (newX < 0) {
        if (direction > 1.5 * Math.PI) {
          direction = 2 * Math.PI - direction
        } else {
          direction = direction + (Math.PI - direction) * 2
        }
        newX = ball.x + Math.sin(direction) * ball.speed
      }

      // Check if hit racket
      const racketPos = this.layoutService.heightMinus(BUTTONS_SIZE) - RACKET_FROM_BOTTOM - RACKET_HEIGHT
      if (newY >  racketPos - BALL_SIZE && newY < racketPos) {
        const { left } = this.getMyData()
        if (newX > left - BALL_SIZE && newX < left + RACKET_WIDTH) {
          if (direction > Math.PI) {
            direction = direction + (1.5 * Math.PI - direction) * 2
          } else {
            direction = direction + (0.5 * Math.PI - direction) * 2
          }
          newY = ball.y + Math.cos(direction) * ball.speed

          firebase.database().ref(`games/${this.state.gameId}/ball`).set(this.getBallProps({
            x: newX,
            y: newY,
            direction,
            speed: ball.speed,
          }))
        }
      } else {
        if(newY < 0 || newY > this.layoutService.heightMinus(BUTTONS_SIZE)){
          firebase.database().ref(`games/${this.state.gameId}/ball`).set({
            x: 0.5 * DEFAULT_WIDTH - BALL_SIZE / 2,
            y: 0.5 * this.layoutService.heightMinus(BUTTONS_SIZE) - BALL_SIZE / 2,
            direction: 0,
            speed: 1,
          })
          this.moveBall()
          return
        }
      }

      this.setState({
        ball: {
          x: newX,
          y: newY,
          direction,
          speed: ball.speed,
        },
      })

    }
    setTimeout(this.moveBall.bind(this), 10)
  }

  getMyData() {
    return this.state.players[this.state.playerId]
  }

  moveButton(px) {
    const { left: myLeft, team } = this.getMyData()
    const left = team === 'red' ? myLeft + px : myLeft - px
    firebase.database().ref(`games/${this.state.gameId}/players/${this.state.playerId}/left`).set(left)
  }

  renderMyButton() {
    const val = this.getMyData()
    return <View style={{
      position: 'absolute',
      width: '100%',
      bottom: this.layoutService.resizeToHeight(RACKET_FROM_BOTTOM)
    }}>
      <View
        style={{
          backgroundColor: val.team,
          left: this.layoutService.resizeToWidth(val.team === 'red' ? val.left : (DEFAULT_WIDTH - RACKET_WIDTH - val.left)),
          width: this.layoutService.resizeToWidth(RACKET_WIDTH),
          position: 'absolute',
          height: this.layoutService.resizeToHeight(RACKET_HEIGHT),
        }}
      />
    </View>
  }

  renderOtherButtons() {
    const { team } = this.getMyData()
    return _.map(this.state.players, (val, key) => {
      if (key !== this.state.playerId && val.left) {
        return <View
          key={key} style={{
          position: 'absolute',
          width: '100%',
          [val.team === team ? 'bottom' : 'top']: this.layoutService.resizeToHeight(RACKET_FROM_BOTTOM)
        }}
        >
          <View
            style={{
              backgroundColor: val.team,
              left: this.layoutService.resizeToWidth(val.team === 'red' ? (DEFAULT_WIDTH - RACKET_WIDTH - val.left) : val.left),
              width: this.layoutService.resizeToWidth(RACKET_WIDTH),
              position: 'absolute',
              height: this.layoutService.resizeToHeight(RACKET_HEIGHT),
            }}
          />
        </View>
      }
    })
  }

  renderBall() {
    const ball = this.state.ball
    if (ball) {
      return <View
        style={{
          position: 'absolute',
          backgroundColor: 'black',
          borderRadius: 50,
          left: this.layoutService.resizeToWidth(ball.x),
          top: this.layoutService.resizeToHeight(ball.y),
          width: this.layoutService.resizeToWidth(BALL_SIZE),
          height: this.layoutService.resizeToHeight(BALL_SIZE),
        }}
      >

      </View>
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <View
          style={{
            width: '100%',
            position: 'relative',
            backgroundColor: '#fff',
            height: this.layoutService.heightMinus(BUTTONS_SIZE)
          }}
        >
          {this.renderBall()}
          {this.renderOtherButtons()}
          {this.renderMyButton()}
        </View>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            flex: 1,
            backgroundColor: '#000',
            width: '100%',
            height: this.layoutService.heightToMakeRatio(BUTTONS_SIZE),
          }}
        >
          <View style={{ flex: 1, height: this.layoutService.heightToMakeRatio(BUTTONS_SIZE) }}>
            <Button
              style={{ width: '100%', height: '100%' }} title="👈"
              onPress={() => this.moveButton(-15)}
            />
          </View>
          <View style={{ flex: 1, height: this.layoutService.heightToMakeRatio(BUTTONS_SIZE) }}>
            <Button
              style={{ width: '100%', height: '100%' }} title="👉"
              onPress={() => this.moveButton(15)}
            />
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
