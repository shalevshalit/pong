import React from 'react'
import { BALL_SIZE } from '../../../services/layout/layout-constants'
import { View } from 'react-native'

export const BALL_SETTINGS = {
  inertia: 0,
  friction: 0,
  frictionStatic: 0,
  frictionAir: 0,
  restitution: 1
}

export const Ball = ({ body }) => {
  const { position } = body
  const x = position.x - BALL_SIZE / 2
  const y = position.y - BALL_SIZE / 2

  return <View style={[styles.ball, { left: x, top: y }]} />
}

const styles = {
  ball: {
    backgroundColor: "#2dff44",
    width: BALL_SIZE,
    height: BALL_SIZE,
    position: "absolute",
    borderRadius: 50
  }
};