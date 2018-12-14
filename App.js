import React from 'react'
import { Button, StyleSheet, View } from 'react-native'

export default class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = { left: 50 };
    }

    moveButton(px) {
        this.setState({ left: this.state.left + px })
    }

  renderMyButton(){
    return <View style={styles.button2}>
      <View style={{backgroundColor: '#f00',left: this.state.left, width: 50, position: 'absolute',height: 5}}></View>
    </View>;
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.board}>
          <View style={styles.button1}></View>
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
            <Button style={{ width: '100%', height: '100%' }} title="👈" onPress={() => this.moveButton(-5)}/>
          </View>
          <View style={{ flex: 1, height: 30 }}>
            <Button style={{ width: '100%', height: '100%' }} title="👉" onPress={() => this.moveButton(5)}/>
          </View>
        </View>
      </View>
    );
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
        backgroundColor: '#00f',
        position: 'absolute',
        top: '5%',
        left: '50%',
        width: 100,
        marginLeft: -50,
        height: '3%'
    },
    button2: {
        position: 'absolute',
        bottom: '5%',
        width: '100%',
        height: '3%'
    },
});
