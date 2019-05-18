import React from 'react'
import { Button, StyleSheet, Text, View } from 'react-native'
import * as firebase from 'firebase'
import { GAME_HEIGHT, GAME_WIDTH } from '../../services/layout/layout-constants'
import AwesomeButton from 'react-native-really-awesome-button/src/themes/blue';

export default class StartGameScreen extends React.Component {

  constructor(props) {
    super(props)
    const { navigation } = this.props
    this.playersService = navigation.getParam('playersService')
    this.startGameAfterHostApproval() // TODO remove
  }

  startGameAfterHostApproval() {
    const { navigate } = this.props.navigation

    firebase.database().ref(`games/${this.playersService.gameId}/started`).set(true)
    firebase.database().ref(`games/${this.playersService.gameId}/ball`).set({
      last: {
        red: 0,
        blue: 0
      },
      score: {
        red: 0,
        blue: 0
      },
      position: {
        x: 0.5 * GAME_WIDTH,
        y: 0.5 * GAME_HEIGHT,
      },
      velocity: {
        x: 3,
        y: 3
      }
    })

    navigate('Game', {
      playersService: this.playersService
    })
  }

  isHost() {
    return this.playersService.gameId === this.playersService.playerId
  }

  componentDidMount() {
    const { navigate } = this.props.navigation
    if (!this.isHost()) {
      firebase.database().ref(`games/${this.playersService.gameId}/started`).on('value', snapshot => {
        const started = snapshot.val()
        if (started) {
          navigate('Game', {
            playersService: this.playersService,
          })
        }
      })
    }
  }

  getMyData() {
    return this.playersService.players[this.playersService.playerId]
  }

  moveButton(px) {
    const { left: myLeft, team } = this.getMyData()
    const left = team === 'red' ? myLeft + px : myLeft - px
    firebase.database().ref(`games/${this.playersService.gameId}/players/${this.playersService.playerId}/left`).set(left)
  }


  getAction() {
    if (this.isHost())
      return <Button title="Start Game" onPress={() => this.startGameAfterHostApproval()} />
    else
      return <Text h4>Waiting for other players</Text>

  }

  getPlayersByTeam(team) {
    return Object.values(this.playersService.players).filter(player => player.team === team)
  }

  renderPlayer(player) {
    const color = player.id === this.playersService.playerId ?
      (player.team === 'red' ? '#e8282e' : '#283aff') :
      (player.team === 'red' ? '#e85b5e' : '#6161ff')

    return <View key={player.id} style={{...styles.playerBullet, backgroundColor: color}}>
      <View style={{width: 10, height: 10, borderRadius: 50, top: 5, left: 5, position: 'absolute', backgroundColor: player.uniqueColor}} />
      <Text style={styles.scoreValue}>{player.name}</Text>
    </View>
  }

  render() {
    return <View style={styles.background}>
      <View><Text style={styles.title}>PONG</Text></View>
      {this.isHost() ? <AwesomeButton
        progress
        type="primary"
        size="medium"
        style={styles.button}
        onPress={next => {
          this.startGameAfterHostApproval()
          next()
        }}>Start Game</AwesomeButton> : <Text style={styles.waiting}>Waiting for other players</Text>}
      <View style={styles.scoresContainer}>
        <View style={styles.score}>
          <Text style={styles.scoreLabelBlue}>{'Blue'}</Text>
          {
            this.getPlayersByTeam('blue').map(this.renderPlayer.bind(this))
          }
        </View>
        <View style={styles.score}>
          <Text style={styles.scoreLabelRed}>{'Red'}</Text>
          {
            this.getPlayersByTeam('red').map(this.renderPlayer.bind(this))
          }
        </View>
      </View>
    </View>
  }
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#000',
    height: '100%',
    width: '100%',
  },
  title: {
    fontSize: 60,
    textAlign: 'center',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginTop: 150,
    marginBottom: 60,
    color: '#13FB13'
  },
  waiting: {
    color: '#fff',
    margin: 15,
    fontSize: 30,
    textAlign: 'center'
  },
  button: {
    alignSelf: 'center',
    margin: 15
  },
  scoresContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: 150
  },
  score: {
    width: '50%'
  },
  scoreLabelRed: {
    color: '#f00',
    fontSize: 30,
    textAlign: 'center'
  },
  scoreLabelBlue: {
    color: '#00f',
    fontSize: 30,
    textAlign: 'center'
  },
  scoreValue: {
    color: '#000000',
    fontSize: 15,
    fontWeight: "bold",
    textAlign: 'center'
  },
  playerBullet: {
    paddingLeft: 5,
    backgroundColor: '#ffa',
    borderRadius: 12,
    margin: 10,
    width: GAME_WIDTH / 2,
    alignSelf: 'center'
  }
})