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
            players,
        })

        navigate('Game', {
            gameId: myId,
            playerId: myId,
        })
    }

    joinGame() {
        const { navigate } = this.props.navigation
        firebase.database().ref('games').once('value').then(snapshot => {
            const myId = guid()
            const allGames = snapshot.val()
            const game = _.last(_.sortBy(allGames, 'time'))
            const teams = _.countBy(_.values(game.players), 'team');

            firebase.database().ref(`games/${game.id}/players/${myId}`).set({
                team: teams.red > (teams.blue || 0) ? 'blue' : 'red',
            })

            navigate('Game', {
                gameId: game.id,
                playerId: myId,
            })
        })
    }

    clear() {
        firebase.database().ref('games').set(null)
    }

    render() {
        return <View style={{ top: '40%' }}>
            <StatusBar hidden={true}/>
            <Button title="Start" onPress={() => this.startGame()}/>
            <Button title="Join" onPress={() => this.joinGame()}/>
            <Button title="Clear" onPress={() => this.clear()}/>
        </View>
    }
}