import React from 'react'
import WelcomeScreen from '../screens/welcome/WelcomeScreen'
import GameScreen from '../screens/game/GameScreen'
import { createAppContainer, createStackNavigator } from 'react-navigation'

const AppNavigator = createStackNavigator({
        Welcome: { screen: WelcomeScreen },
        Game: { screen: GameScreen },
    },
    {
        headerMode: 'none',
        navigationOptions: {
            headerVisible: false,
        },
    })

const AppContainer = createAppContainer(AppNavigator)

export default AppContainer
