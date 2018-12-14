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
            [myId]:  {
                team: 'red',
            },
            someone:  {
                left: 100,
                team: 'blue',
            },
            someone2:  {
                left: 200,
                team: 'green',
            }
        }
        firebase.database().ref('games/' + myId).set({
            time: new Date(),
            players
        })

        navigate('Game', {
            gameId: myId,
            playerId: myId
        })
    }

    joinGame(){
        firebase.database().ref('games').once('value').then(snapshot => {
            const allGames = snapshot.val();
            _.sortBy(allGames, 'time')
        })
    }

    render() {
        const { navigate } = this.props.navigation
        return <View style={{ top: '40%' }}>
            <StatusBar hidden={true}/>
            <Button title="Start" onPress={() => this.startGame()}/>
            <Button title="Join" onPress={() => navigate('Game')}/>
        </View>
    }
}