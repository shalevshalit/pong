import React from 'react'
import { Button, StyleSheet, View, Dimensions } from 'react-native'
import * as firebase from 'firebase'
import * as _ from 'lodash'

export default class GameScreen extends React.Component {
    constructor(props) {
        super(props)
        const { navigation } = this.props;
        const gameId = navigation.getParam('gameId');
        const playerId = navigation.getParam('playerId');

        this.state = {
            gameId,
            playerId,
            players: {
                [playerId]: {}
            }
        }
    }

    componentDidMount() {
        firebase.database().ref(`games/${this.state.gameId}/players`).on('value', snapshot => {
            this.setState({ players: snapshot.val() })
        })
        firebase.database().ref(`games/${this.state.gameId}/ball`).once('value', snapshot => {
            this.setState({ ball: snapshot.val() })
            this.moveBall()
        })
    }

    moveBall() {
        if (this.state.gameEnded) {
            return
        }
        const ball = this.state.ball
        if (ball) {
            let direction = ball.direction;
            const newY = ball.y + Math.cos(direction) * ball.speed
            let newX = ball.x + Math.sin(direction) * ball.speed
            const { width } = Dimensions.get('window')
            if(newX > width - 20) {
                if(direction > 0.5 * Math.PI) {
                    direction = direction + (Math.PI - direction) * 2
                } else {
                    direction = 2 * Math.PI - direction
                }
                newX = ball.x + Math.sin(direction) * ball.speed
            }
            if(newX < 0) {
                if(direction > 1.5 * Math.PI) {
                    direction = 2 * Math.PI - direction
                } else {
                    direction = direction + (Math.PI - direction) * 2
                }
                newX = ball.x + Math.sin(direction) * ball.speed
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
        setTimeout(this.moveBall.bind(this), 100)
    }

    getMyData() {
        return this.state.players[this.state.playerId];
    }

    moveButton(px) {
        const left = this.getMyData().left + px
        firebase.database().ref(`games/${this.state.gameId}/players/${this.state.playerId}/left`).set(left);
    }

    renderMyButton() {
        const val = this.getMyData()
        return <View style={styles.button2}>
            <View style={{
                backgroundColor: val.team,
                left: val.left,
                width: 30,
                position: 'absolute',
                height: 5,
            }}/>
        </View>
    }

    renderOtherButtons() {
        return _.map(this.state.players, (val, key) => {
            if (key !== this.state.playerId && val.left) {
                return <View key={key} style={val.team === this.getMyData().team ? styles.button2 : styles.button1}>
                    <View style={{
                        backgroundColor: val.team,
                        left: val.left,
                        width: 30,
                        position: 'absolute',
                        height: 5,
                    }}/>
                </View>
            }
        })
    }

    renderBall() {
        const ball = this.state.ball
        if(ball) {
            return <View style={{
                position: 'absolute',
                backgroundColor: 'black',
                borderRadius: 50,
                left: ball.x,
                top: ball.y,
                width: 20,
                height: 20
            }}>

            </View>
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.board}>
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
