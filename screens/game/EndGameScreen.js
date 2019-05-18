import React from 'react'
import { Button, StyleSheet, Text, View } from 'react-native'
import * as firebase from 'firebase'
import AwesomeButton from 'react-native-really-awesome-button/src/themes/blue';

export default class EndGameScreen extends React.Component {
  constructor(props) {
    super(props)
    const { navigation } = this.props
    this.playersService = navigation.getParam('playersService')
    this.score = navigation.getParam('score')
  }

  startGameAfterHostApproval() {
    const { navigate } = this.props.navigation

    navigate('Welcome')
  }

  isHost() {
    return this.playersService.gameId === this.playersService.playerId
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
      <Text style={styles.playerName}>{player.name}</Text>
      <Text style={styles.playerName}>({player.goals})</Text>
    </View>
  }

  render() {
    return <View style={styles.background}>
      <View><Text style={styles.title}>PONG</Text></View>
      {<AwesomeButton
        progress
        type="secondary"
        size="medium"
        style={styles.button}
        onPress={next => {
          this.startGameAfterHostApproval()
          next()
        }}>Play Again</AwesomeButton>}
      <View style={styles.scoresContainer}>
        <View style={styles.score}>
          <Text style={styles.scoreLabelBlue}>{'Blue'}</Text>
          <Text style={styles.scoreValue}> {this.score.blue}</Text>
          {
            this.getPlayersByTeam('blue').map(this.renderPlayer.bind(this))
          }
        </View>
        <View style={styles.score}>
          <Text style={styles.scoreLabelRed}>{'Red'}</Text>
          <Text style={styles.scoreValue}> {this.score.red}</Text>
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
  playerName: {
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
    width: '50%',
    alignSelf: 'center'
  },
  scoreValue: {
    color: '#fff',
    fontSize: 30,
    fontWeight: "bold",
    textAlign: 'center'
  }
})