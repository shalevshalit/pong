import * as _ from 'lodash'
import { GAME_HEIGHT, GAME_WIDTH, RACKET_FROM_BOTTOM, RACKET_HEIGHT, RACKET_WIDTH } from './layout/layout-constants'
import Matter from "matter-js"
import * as firebase from 'firebase'
import Chance from 'chance'
const chance = new Chance()
const ADJ = ["Defiant", "Homeless", "Adorable", "Delightful", "Homely", "Quaint", "Adventurous", "Depressed", "Horrible", "Aggressive", "Determined", "Hungry", "Real", "Agreeable", "Different", "Hurt", "Relieved", "Alert", "Difficult", "Repulsive", "Alive", "Disgusted", "Ill", "Rich", "Amused", "Distinct", "Important", "Angry", "Disturbed", "Impossible", "Scary", "Annoyed", "Dizzy", "Inexpensive", "Selfish", "Annoying", "Doubtful", "Innocent", "Shiny", "Anxious", "Drab", "Inquisitive", "Shy", "Arrogant", "Dull", "Itchy", "Silly", "Ashamed", "Sleepy", "Attractive", "Eager", "Jealous", "Smiling", "Average", "Easy", "Jittery", "Smoggy", "Awful", "Elated", "Jolly", "Sore", "Elegant", "Joyous", "Sparkling", "Bad", "Embarrassed", "Splendid", "Beautiful", "Enchanting", "Kind", "Spotless", "Better", "Encouraging", "Stormy", "Bewildered", "Energetic", "Lazy", "Strange", "Black", "Enthusiastic", "Light", "Stupid", "Bloody", "Envious", "Lively", "Successful", "Blue", "Evil", "Lonely", "Super", "Blue-eyed", "Excited", "Long", "Blushing", "Expensive", "Lovely", "Talented", "Bored", "Exuberant", "Lucky", "Tame", "Brainy", "Tender", "Brave", "Fair", "Magificent", "Tense", "Breakable", "Faithful", "Misty", "Terrible", "Bright", "Famous", "Modern", "Tasty", "Busy", "Fancy", "Motionless", "Thankful", "Fantastic", "Muddy", "Thoughtful", "Calm", "Fierce", "Mushy", "Thoughtless", "Careful", "Filthy", "Mysterious", "Tired", "Cautious", "Fine", "Tough", "Charming", "Foolish", "Nasty", "Troubled", "Cheerful", "Fragile", "Naughty", "Clean", "Frail", "Nervous", "Ugliest", "Clear", "Frantic", "Nice", "Ugly", "Clever", "Friendly", "Nutty", "Uninterested", "Cloudy", "Frightened", "Unsightly", "Clumsy", "Funny", "Obedient", "Unusual", "Colorful", "Obnoxious", "Upset", "Combative", "Gentle", "Odd", "Uptight", "Comfortable", "Gifted", "Old-fashioned", "Concerned", "Glamorous", "Open", "Vast", "Condemned", "Gleaming", "Outrageous", "Victorious", "Confused", "Glorious", "Outstanding", "Vivacious", "Cooperative", "Good", "Courageous", "Gorgeous", "Panicky", "Wandering", "Crazy", "Graceful", "Perfect", "Weary", "Creepy", "Grieving", "Plain", "Wicked", "Crowded", "Grotesque", "Pleasant", "Wide-eyed", "Cruel", "Grumpy", "Poised", "Wild", "Curious", "Poor", "Witty", "Cute", "Handsome", "Powerful", "Worrisome", "Happy", "Precious", "Worried", "Dangerous", "Healthy", "Prickly", "Wrong", "Dark", "Helpful", "Proud", "Dead", "Helpless", "Puzzled", "Zany", "Defeated", "Hilarious", "Zealous"]


/*
Player {
  id: guid
  team: red|blue
  goals: number
  name: string
  uniqueColor: #hex
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
    const name = `${chance.pickone(ADJ)} ${chance.animal({type: team === 'red' ? 'grassland' : 'ocean'})}`
    const uniqueColor = chance.color({format: 'hex'})

    this.players[id] = {
      id,
      team,
      name,
      uniqueColor,
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