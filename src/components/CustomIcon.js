import React from "react";
import { View, TouchableOpacity } from "react-native";

export default function CustomIcon ({ ...props}) {
  const IconComponent = props.iconComponent;
  if (props.onPress) {
    return (
      <TouchableOpacity style={props.touchableStyle} onPress={props.onPress}>
        <View style={props.wrapperViewStyle}>
          <IconComponent
            name={props.iconName}
            size={props.iconSize}
            color={props.iconColor}
            style={props.iconStyle}
          />
        </View>
      </TouchableOpacity>
    );
  }
  return (
    <View style={props.touchableStyle}>
      <View style={props.wrapperViewStyle}>
        <IconComponent
          name={props.iconName}
          size={props.iconSize}
          color={props.iconColor}
          style={props.iconStyle}
        />
      </View>
    </View>
  );
};

CustomIcon.defaultProps = {
    // onPress: () => console.log("add an onpress to CustomIcon"),
    iconName: "plus",
    iconSize: 20,
    iconColor: "blue",
    iconStyle: {
      textAlign: "center",
      marginVertical: 3,
      marginHorizontal: 3
    },
    iconComponent: MaterialCommunityIcons,
    wrapperViewStyle: {
      justifyContent: "center",
      alignItems: "center",
      width: PERCENTS.WIDTH[10],
      height: PERCENTS.WIDTH[10],
      borderRadius: 20,
      marginBottom: 2
    },
    touchableStyle: {
      width: "22%",
      alignItems: "center"
    }
  };
