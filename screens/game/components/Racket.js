import React from "react";
import { View } from "react-native";

export const Racket = ({ body, size, xAdjustment, yAdjustment, playerColor, color }) => {
  const width = size[0];
  const height = size[1];
  const xAdjust = xAdjustment ? xAdjustment : 0;
  const yAdjust = yAdjustment ? yAdjustment : 0;

  const x = body.position.x - width / 2 + xAdjust;
  const y = body.position.y - height / 2 - yAdjust;

  return (
    <View
      style={{
        position: "absolute",
        borderTopColor: playerColor,
        borderTopWidth: 4,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        left: x,
        top: y,
        width: width,
        height: height,
        backgroundColor: color
      }}
    />
  );
};