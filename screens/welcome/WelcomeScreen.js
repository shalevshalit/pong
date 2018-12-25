import * as _ from 'lodash'
import React from 'react'
import { Button, StatusBar, View } from 'react-native'
import { guid } from '../../utils'
import * as firebase from 'firebase'

export default class WelcomeScreen extends React.Component {
    startGame() {
        const { navigate } = this.props.navigation
        const myId = '9f52681b-0001-febd-fe48-06fb834060ef'//guid()
        const players = {
            [myId]: {
                team: 'red',
            }
        }
        firebase.database().ref('games/' + myId).set({
            id: myId,
            time: new Date(),
            started: false,
            players,
        })

        navigate('StartGame', {
            gameId: myId,
            playerId: myId,
            team: 'red'
        })
    }

    joinGame() {
        const { navigate } = this.props.navigation
        firebase.database().ref('games').once('value').then(snapshot => {
            const myId = guid()
            const allGames = snapshot.val()
            const game = _.last(_.sortBy(_.filter(allGames, {started: false}), 'time'))
            const teams = _.countBy(_.values(game.players), 'team');

            let team = teams.red > (teams.blue || 0) ? 'blue' : 'red'
            firebase.database().ref(`games/${game.id}/players/${myId}`).set({
                team,
            })

            navigate('StartGame', {
                gameId: game.id,
                playerId: myId,
                team,
            })
        })
    }

    clear() {
        firebase.database().ref('games').set(null)
    }

    render() {
        return <View style={{ top: '40%' }}>
            <StatusBar hidden={true}/>
            <Button title="Host" onPress={() => this.startGame()}/>
            <Button title="Join" onPress={() => this.joinGame()}/>
            <Button title="Clear" onPress={() => this.clear()}/>
        </View>
    }
}