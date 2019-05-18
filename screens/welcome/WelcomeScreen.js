import * as _ from 'lodash'
import React from 'react'
import { StatusBar, Text, View } from 'react-native'
import { guid } from '../../utils'
import * as firebase from 'firebase'
import PlayersService from '../../services/players'
import AwesomeButton from 'react-native-really-awesome-button/src/themes/blue'

export default class WelcomeScreen extends React.Component {

  constructor(props) {
    super(props)
    this.startGame() // TODO remove
  }

  startGame() {
    const { navigate } = this.props.navigation
    const myId = guid()
    const myPlayer = {
      id: myId,
      team: 'red'
    }

    firebase.database().ref('games/' + myId).set({
      id: myId,
      time: new Date(),
      started: false
    })

    const playersService = new PlayersService(myId, myPlayer)

    navigate('StartGame', { playersService })
  }

  joinGame() {
    const { navigate } = this.props.navigation
    firebase.database().ref('games').once('value').then(snapshot => { // TODO games service
      const myId = guid()
      const allGames = snapshot.val()
      const game = _.last(_.sortBy(_.filter(allGames, { started: false }), 'time'))
      const teams = _.countBy(_.values(game.players), 'team')
      const team = teams.red > (teams.blue || 0) ? 'blue' : 'red'
      const myPlayer = {
        id: myId,
        team
      }

      const playersService = new PlayersService(game.id, myPlayer)

      navigate('StartGame', {
        playersService,
      })
    })
  }

  render() {
    return <View style={styles.background}>
      <StatusBar hidden={true} />
      <View><Text style={styles.title}>PONG</Text></View>
      <AwesomeButton
        progress
        type="primary"
        size="medium"
        style={styles.button}
        onPress={next => {
        this.startGame()
        next()
      }}>Host</AwesomeButton>
      <AwesomeButton
        progress
        type="secondary"
        size="medium"
        style={styles.button}
        onPress={next => {
        this.joinGame()
        next()
      }} >Join</AwesomeButton>
    </View>
  }
}

const styles = {
  background: {
    backgroundColor: '#000',
    height: '100%',
    width: '100%',
  },
  title: {
    fontSize: 60,
    textAlign: 'center',
    fontFamily: 'monospace',
    fontWeight: "bold",
    marginTop: 150,
    marginBottom: 60,
    color: '#13FB13'
  },
  button: {
    alignSelf: 'center',
    margin: 15
  }
}