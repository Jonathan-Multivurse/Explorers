import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Image } from 'react-native'
import CustomTabNav  from '../components/CustomTabNav'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { theme } from '../core/theme'

import {
  HomeScreen,  
  SupportScreen,
  FAQScreen,
  AccountScreen,
} from "./";

import { chatConnectAndSubscribe } from '../actionCreators'

const Tab = createBottomTabNavigator();

class Dashboard extends Component  {
  componentDidMount() {
    const {
      connectAndSubscribe,
      connected,
      loading,
      navigation,
    } = this.props
    if (!connected && !loading) {
      connectAndSubscribe()
    } else {
      // if (connected && !loading) {
      //   navigation.navigate('Main')
      // }
    }
  }

  componentDidUpdate(prevProps) {
    const { connected, navigation } = this.props
    if (connected !== prevProps.connected) {
      if (connected) {
        // navigation.navigate('Main')
      }
    }
  }

  getTabBarIcon = (focused, iconName, tintColor ) => {
    var activeurl = '';
    var inactiveurl = '';

    if (iconName == 'Home'){
      activeurl = require('../assets/images/bottom/Home_blue.png');
      inactiveurl = require('../assets/images/bottom/Home.png');
    } else if (iconName == 'Support'){
      activeurl = require('../assets/images/bottom/Support_blue.png');
      inactiveurl = require('../assets/images/bottom/Support.png');
    } else if (iconName == 'FAQs'){
      activeurl = require('../assets/images/bottom/FAQs_blue.png');
      inactiveurl = require('../assets/images/bottom/FAQs.png');
    } else if (iconName == 'Account'){
      activeurl = require('../assets/images/bottom/Account_blue.png');
      inactiveurl = require('../assets/images/bottom/Account.png');
    }

    return (
      <Image
        style={{ width: focused ? 28 : 26, height: focused ? 28 : 26 }}
        source={focused ? activeurl : inactiveurl}
      />
    )
  }

  render() {
    return (
      <CustomTabNav
         screenOptions={{
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor:theme.colors.lightGray,
          unmountOnBlur: true,
          style: {
            backgroundColor: theme.colors.navBar,
          }
        }}
        removeClippedSubviews
      >
        <Tab.Screen
          name={"Home Screen"}
          component={HomeScreen}
          options={() => ({
            tabBarIcon: ({focused, color }) => this.getTabBarIcon(focused, 'Home', color),
            tabBarLabel: "Home",
            headerShown: false,
          })}
        />
       <Tab.Screen
          name={"Support Screen"}
          component={SupportScreen}
          options={() => ({
            tabBarIcon: ({focused, color }) => this.getTabBarIcon(focused, 'Support', color),
            tabBarLabel: "Support",
            headerShown: false,
          })}
        />
        <Tab.Screen
          name={"FAQ Screen"}
          component={FAQScreen}
          options={() => ({
            tabBarIcon: ({focused, color }) => this.getTabBarIcon(focused, 'FAQs', color),
            tabBarLabel: "FAQs",
            headerShown: false,
          })}
        />
        <Tab.Screen
          name={"Account Screen"}
          component={AccountScreen}
          options={() => ({
            tabBarIcon: ({focused, color }) => this.getTabBarIcon(focused, 'Account', color),
              tabBarLabel: "Account",
              headerShown: false,
          })}
        />
      </CustomTabNav>
    );
  }
}

const mapStateToProps = ({ chat }) => ({
  connected: chat.connected,
  loading: chat.loading,
})

const mapDispatchToProps = {
  connectAndSubscribe: chatConnectAndSubscribe
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard)