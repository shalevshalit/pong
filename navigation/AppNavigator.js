import React from 'react'
import WelcomeScreen from '../screens/welcome/WelcomeScreen'
import GameScreen from '../screens/game/GameScreen'
import StartGameScreen from '../screens/game/StartGameScreen'
import JoinGameScreen from '../screens/game/JoinGameScreen'
import { createAppContainer, createStackNavigator } from 'react-navigation'

const AppNavigator = createStackNavigator({
        Welcome: { screen: WelcomeScreen },
        Game: { screen: GameScreen },
        StartGame: { screen: StartGameScreen},
        JoinGameScreen: {screen: JoinGameScreen},
    },
    {
        headerMode: 'none',
        navigationOptions: {
            headerVisible: false,
        },
    })

const AppContainer = createAppContainer(AppNavigator)

export default AppContainer
