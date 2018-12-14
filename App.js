import React from 'react'
import { StyleSheet, View } from 'react-native'
import AppNavigator from './navigation/AppNavigator'
import * as firebase from 'firebase'

export default class App extends React.Component {
    constructor(props) {
        super(props)
        const config = {
            apiKey: "AIzaSyA7qMCO1JhuoKtx8Ko8t3ciFhpyqDttcns",
            authDomain: "pong-da17a.firebaseapp.com",
            databaseURL: "https://pong-da17a.firebaseio.com",
            projectId: "pong-da17a",
            storageBucket: "pong-da17a.appspot.com",
            messagingSenderId: "611373827073"
        };

        firebase.initializeApp(config);
    }

    render() {

        return (
            <View style={styles.container}>
                <AppNavigator/>
            </View>
        )
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
})
