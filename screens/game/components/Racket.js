import React from "react";
import { View } from "react-native";

export const Racket = ({ body, size, xAdjustment, yAdjustment, color }) => {
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
        left: x,
        top: y,
        width: width,
        height: height,
        backgroundColor: color
      }}
    />
  );
};