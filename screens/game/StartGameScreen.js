import React from 'react'
import { Button, Dimensions, StyleSheet, Text, View } from 'react-native'
import * as firebase from 'firebase'
import * as _ from 'lodash'

export default class StartGameScreen extends React.Component {
    constructor(props) {
        super(props)
        const { navigation } = this.props
        const gameId = navigation.getParam('gameId')
        const playerId = navigation.getParam('playerId')
        const team = navigation.getParam('team')
        const { width } = Dimensions.get('window')

        let left = width * 0.5 - width * 0.1

        firebase.database().ref(`games/${gameId}/players/${playerId}/left`).set(left)

        this.state = {
            gameId,
            playerId,
            players: {
                [playerId]: {
                    left,
                    team,
                },
            },
        }
    }

    startGameAfterHostApprval() {
        const { navigate } = this.props.navigation
        const { width, height } = Dimensions.get('window')

        firebase.database().ref(`games/${this.state.gameId}/started`).set(true)
        firebase.database().ref(`games/${this.state.gameId}/ball`).set({
            x: 0.5 * width,
            y: 0.45 * height,
            direction: _.random(0, 2 * Math.PI, true),
            speed: 3,
        })

        navigate('Game', {
            gameId: this.state.gameId,
            playerId: this.state.playerId,
            team: this.getMyData().team,
        })
    }

    isHost() {
        return this.state.gameId === this.state.playerId
    }

    componentDidMount() {
        const { navigate } = this.props.navigation
        if (!this.isHost()) {
            firebase.database().ref(`games/${this.state.gameId}/started`).on('value', snapshot => {
                const started = snapshot.val()
                if (started) {
                    navigate('Game', {
                        gameId: this.state.gameId,
                        playerId: this.state.playerId,
                        team: this.getMyData().team,
                    })
                }
            })
        }
        firebase.database().ref(`games/${this.state.gameId}/players`).on('value', snapshot => {
            this.setState({ players: snapshot.val() })
        })
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
        const { width } = Dimensions.get('window')
        const val = this.getMyData()
        return <View style={styles.button2}>
            <View style={{
                backgroundColor: val.team,
                left: val.team === 'red' ? val.left : (width - val.left),
                width: 30,
                position: 'absolute',
                height: 5,
            }}/>
        </View>
    }

    renderOtherButtons() {
        const { team } = this.getMyData()
        const { width } = Dimensions.get('window')
        return _.map(this.state.players, (val, key) => {
            if (key !== this.state.playerId && val.left) {
                return <View key={key} style={val.team === team ? styles.button2 : styles.button1}>
                    <View style={{
                        backgroundColor: val.team,
                        left: team === 'red' ? val.left : (width - val.left),
                        width: 30,
                        position: 'absolute',
                        height: 5,
                    }}/>
                </View>
            }
        })
    }

    getAction() {
        if (this.isHost())
            return <Button title="Start Game" onPress={() => this.startGameAfterHostApprval()}/>
        else
            return <Text h4>Waiting for other players</Text>

    }

    renderStartGameButton() {
        return <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '90%',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9,
        }}>
            {this.getAction()}
        </View>
    }

    render() {
        return (
            <View style={{ height: '100%', width: '100%' }}>
                {this.renderStartGameButton()}
                <View style={styles.container}>
                    <View style={styles.board}>
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
                            height: 30,
                        }}
                    >
                        <View style={{ flex: 1, height: 30 }}>
                            <Button style={{ width: '100%', height: '100%' }} title="👈"
                                    onPress={() => this.moveButton(-15)}/>
                        </View>
                        <View style={{ flex: 1, height: 30 }}>
                            <Button style={{ width: '100%', height: '100%' }} title="👉"
                                    onPress={() => this.moveButton(15)}/>
                        </View>
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
    board: {
        height: '90%',
        width: '100%',
        position: 'relative',
        backgroundColor: '#fff',
    },
    button1: {
        position: 'absolute',
        top: '5%',
        width: '100%',
        height: '3%',
    },
    button2: {
        position: 'absolute',
        bottom: '5%',
        width: '100%',
        height: '3%',
    },
})