import * as _ from 'lodash'
import React from 'react'
import { Button, StatusBar, View } from 'react-native'
import { guid } from '../../utils'
import * as firebase from 'firebase'
import PlayersService from '../../services/players'

export default class WelcomeScreen extends React.Component {
  startGame() {
    const { navigate } = this.props.navigation
    const myId = guid()//'9f52681b-0001-febd-fe48-06fb834060ef'//guid()
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

  clear() {
    firebase.database().ref('games').set(null)
  }

  render() {
    return <View style={{ top: '40%' }}>
      <StatusBar hidden={true} />
      <Button title="Host" onPress={() => this.startGame()} />
      <Button title="Join" onPress={() => this.joinGame()} />
      <Button title="Clear" onPress={() => this.clear()} />
    </View>
  }
}