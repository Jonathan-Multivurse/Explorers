import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { Alert } from 'react-native';
import { NavigationContainer} from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { appStart } from './actionCreators'
import config from './QBConfig'
import {
  StartScreen,
  LoginScreen,
  RegisterScreen,
  RegisterScreen1,
  RegisterScreen2,
  RegisterScreen3,
  RegisterScreen4,
  ContactUsScreen,
  RegisterVerificationScreen,
  ResetPasswordScreen,
  RegisterPasswordScreen,
  FacilityCode,
  FacilityScreen,
  Dashboard,
  FacilityLogin,
  SupportChat,
  SupportCall,
  SupportVideo,
  NotificationScreen,
  SurveyScreen,
  ScheduleSupport,
  TimeZone,
  SchuduleSupportWaiting,
  ChangePassword,
  ChangeVerification,
  ChangePasswordScreen,
  CallScreen,
  Messages,
  ImageViewer,
  VideoPlayer,
  Facility,
  SupportDetail,
} from './screens'
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage'
import QB from 'quickblox-react-native-sdk'
import FlashMessage from "react-native-flash-message";
import { showMessage, hideMessage } from "react-native-flash-message";
import { navigationRef } from './NavigationService';
import REQUEST_DB from './api/requestDB';

const Stack = createStackNavigator()

const App = () => {

  useEffect(() => {
    const appSettings = {
      appId: '90951',
      authKey: 'EsbJb9fnCs8VHEn',
      authSecret: 'YUwQJ8rtamDjN36',
      accountKey: 'RQfzw5xYhyX7_fvk5zLH',
      apiEndpoint: '',
      chatEndpoint: '',
    };
    
    QB.settings
    .init(appSettings)
    .then(() => {
      // SDK initialized successfully
      console.log('QB SDK initialized successfully')
    })
    .catch((e) => {
      // Some error occurred, look at the exception message for more details
      console.log('QB SDK initialized Failed')
    });

    QB.settings.enableAutoReconnect({ enable: true })
    QB.settings.enableCarbons()
    QB.settings.initStreamManagement({
      autoReconnect: true,
      messageTimeout: 10
    })

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log("Remote Message ===>", remoteMessage);
      let notification = remoteMessage.notification
      let notificationTitle = notification.title
      let notificationBody = notification.body

      let messageData = remoteMessage.data    
      let notificationType = messageData.type 
      storeNotficationFlag();

      if (notificationType == 'reconnectedCall' && messageData.request != "" ) {
        REQUEST_DB.getRequest(messageData.request, getRequest);
      } else {
        if ( notificationType == 'initiated' && messageData.request != "" ) {
          REQUEST_DB.getRequest(messageData.request, getRequest);
        }
  
        showMessage({
          message: notificationTitle,
          description: notificationBody,
          type: 'default',
          backgroundColor: '#00ACEC',
          color: 'white',
        });
      }      
    });

    return unsubscribe;
  }, []);

  const getRequest = async(request) => {
    global.selectedRequest = request
  }

  const storeNotficationFlag = async() => {
    try {
      await AsyncStorage.setItem('new_alert', 'true')
    } catch (e) {
      console.log('Saving Error');
    }
  };

  return (
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName="StartScreen"
          screenOptions={{
            headerShown: false,
            gestureEnabled: false
          }}
        >
          <Stack.Screen name="StartScreen" component={StartScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
          <Stack.Screen name="FacilityLogin" component={FacilityLogin} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
          <Stack.Screen name="RegisterScreen1" component={RegisterScreen1} />
          <Stack.Screen name="RegisterScreen2" component={RegisterScreen2} />
          <Stack.Screen name="RegisterScreen3" component={RegisterScreen3} />
          <Stack.Screen name="RegisterScreen4" component={RegisterScreen4} />
          <Stack.Screen name="ContactUsScreen" component={ContactUsScreen} />          
          <Stack.Screen name="RegisterVerificationScreen" component={RegisterVerificationScreen} />
          <Stack.Screen name="RegisterPasswordScreen" component={RegisterPasswordScreen} />          
          <Stack.Screen name="Dashboard" component={Dashboard} screenOptions = {{headerShown: false}}/>
          <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
          <Stack.Screen name="SurveyScreen" component={SurveyScreen} />
          <Stack.Screen name="SupportChat" component={SupportChat} />
          <Stack.Screen name="SupportCall" component={SupportCall} />
          <Stack.Screen name="SupportVideo" component={SupportVideo} />          
          <Stack.Screen name="ScheduleSupport" component={ScheduleSupport} />
          <Stack.Screen name="TimeZoneScreen" component={TimeZone} />
          <Stack.Screen name="ScheduleSupportWaiting" component={SchuduleSupportWaiting} />
          <Stack.Screen name="ChangePassword" component={ChangePassword} />    
          <Stack.Screen name="ChangeVerification" component={ChangeVerification} />   
          <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />   
          <Stack.Screen name="CallScreen" component={CallScreen} />
          <Stack.Screen name="Messages" component={Messages} />  
          <Stack.Screen name="ImageViewer" component={ImageViewer} /> 
          <Stack.Screen name="VideoPlayer" component={VideoPlayer} /> 
          <Stack.Screen name="FacilityScreen" component={FacilityScreen} /> 
          <Stack.Screen name="FacilityCode" component={FacilityCode} />
          <Stack.Screen name="Facility" component={Facility} /> 
          <Stack.Screen name="SupportDetail" component={SupportDetail} />           
        </Stack.Navigator>

        <FlashMessage position="top" duration={5000}/> 
      </NavigationContainer>      
  )
}

const mapStateToProps = null
const mapDispatchToProps = { appStart }
export default connect(mapStateToProps, mapDispatchToProps)(App)