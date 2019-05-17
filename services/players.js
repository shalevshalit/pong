import * as _ from 'lodash'
import { GAME_HEIGHT, GAME_WIDTH, RACKET_FROM_BOTTOM, RACKET_HEIGHT, RACKET_WIDTH } from './layout/layout-constants'
import Matter from "matter-js"
import * as firebase from 'firebase'

/*
Player {
  id: guid
  team: red|blue
  goals: number,
  position: {
    x: number
    y: number
  }
  body: Matter.Bodies.rectangle // only local
}
 */

class PlayersService {
  constructor(gameId, myPlayer) {
    this.gameId = gameId
    this.playerId = myPlayer.id
    this.players = {}
    this.addPlayer(myPlayer)

    firebase.database().ref(`games/${this.gameId}/players`).on('value', snapshot => {
      const players = snapshot.val() || {}
      _.values(players).forEach(player => this.addPlayerIfNotExist(player))
    })
  }

  addPlayerIfNotExist(player) {
    if (this.players[player.id]) {
      return
    }
    this.addPlayer(player)
  }

  addPlayer(player) {
    let { id, team, position } = player
    position = position || {
      x: GAME_WIDTH / 2 - RACKET_WIDTH / 2,
      y: RACKET_HEIGHT + RACKET_FROM_BOTTOM
    }
    const body = Matter.Bodies.rectangle(
      position.x,
      (id === this.playerId || team === this.myPlayer.team) ? GAME_HEIGHT - position.y : position.y,
      RACKET_WIDTH,
      RACKET_HEIGHT,
      {
        isStatic: true,
        label: `player-${id}`
      }
    )

    this.players[id] = {
      id,
      team,
      position,
      goals: 0,
      body,
    }

    if (id === this.playerId) {
      firebase.database().ref(`games/${this.gameId}/players/${id}`).set({
        id,
        team,
        position,
      })
    } else {
      firebase.database().ref(
        `games/${this.gameId}/players/${id}`).on('value',
        snapshot => {
          const {position, goals} = snapshot.val()
          this.players[id].goals = goals
          this.onPlayerPositionChange(id, position)
        }
      )
    }
  }

  onPlayerPositionChange(id, newPosition) {
    const player = this.players[id]
    const position = player.position
    if (position.x !== newPosition.x || position.y !== newPosition.y) {
      Matter.Body.setPosition(player.body, {
        x: newPosition.x,
        y: player.team === this.myPlayer.team ? GAME_HEIGHT - newPosition.y : newPosition.y,
      })
      player.position = newPosition
    }
  }

  get myPlayer() {
    return this.players[this.playerId]
  }

  isHost() {
    return this.playerId === this.gameId
  }
}

export default PlayersService