import React, { Component } from 'react'
import { Platform, View, StyleSheet, Image, Dimensions, TouchableOpacity, Alert, Text, ScrollView, ActivityIndicator } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import { theme } from '../core/theme'
import REQUEST_DB from '../api/requestDB'
import moment from 'moment'
import firestore from '@react-native-firebase/firestore'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class SchuduleSupportWaiting extends Component {
  constructor(props) {
    super(props)
    this._observer = null;

    this.state = { 
      isLoading: false,
      request: this.props.route.params.request,
      isFromScheduleSupport: this.props.route.params.isFromScheduleSupport
    }     
  }

  componentDidMount() {   
    if ( this.props.route.params.receiver == '' ){
      this.setState({receiver: null})      
    } else {
      this.setState({receiver: this.props.route.params.receiver})   
    }   

    this._observer = firestore().collection('request').doc(this.state.request.requestid)
    .onSnapshot({
      error: (e) => console.error(e),
      next: (documentSnapshot) => {
        if ( documentSnapshot.data() !== undefined ) {
          if ((documentSnapshot.data()['status'] === 'scheduled' )) {
            console.log("Schedule request is scheduled") 
            this.setState({
              request: documentSnapshot.data()
            })
          }
        }        
      }
    })
  }

  componentWillUnmount() {
    this._observer();
  }

  onCancelRequest = () => {
    Alert.alert(
      "Cancel Request",
      "Are you sure, you want to cancel scheduled support?",
      [
        {
          text: "No",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        { 
          text: "Yes, Cancel",
          onPress: () => this.onCancelRequestPressed(),
        }
      ],
      {cancelable: false},
    )  
  }

  onReScheduleSupport = () => {
    console.log('reschedule')

    this.props.navigation.push('ScheduleSupport', {
      isCreate: false,
      requestId: this.state.request.requestid,
      scheduleTime: this.state.request.scheduleTime,
      scheduleSupport: this.state.request.type,
      scheduleTimezone: this.state.request.scheduleTimeZone,
      scheduleContent: this.state.request.description,
      scheduleSimulator: this.state.request.simulator,
      scheduleFacility: this.state.request.facility,
    })
  } 
  
  onCancelRequestPressed = () => {
    REQUEST_DB.cancelRequest(this.state.request.requestid, this.onUserCancel);
  }

  onUserCancel = () => {
    global.isFromCall = false
    this.props.navigation.navigate('Dashboard')
  }

  render() {
    let defaultDate= moment(this.state.request.scheduleTime).format('MMM D')
    let defaultTime = moment(this.state.request.scheduleTime).format('h:mm A')
    let defaultDate1 = moment(this.state.request.scheduleTime).format('MMM D, YYYY')
    let defaultTime1 = moment(this.state.request.scheduleTime).format('h:mm A')

    return (
      <Background>
        <View style = {styles.navigationView}>

          <TouchableOpacity onPress={() => this.onUserCancel()} style={styles.backButton}>
            <Image
              style={styles.backImage}
              source={require('../assets/images/login/arrow_back.png')}
            />
          </TouchableOpacity>

          <Text style={styles.titleText}>Support Details</Text>
        </View>

        <ScrollView style={this.state.isFromScheduleSupport == true ? styles.contentView1 : styles.contentView2}>

          { this.state.request.receiver == '' || this.state.request.receiver === undefined ? 
            <View style = {styles.logoView}>
              <View style={{flex: 1}} />
              <Image source={require('../assets/images/request/appLogo.png')} style={styles.logoImage} />
              <Text style={styles.melisaText}>A meeting request at {defaultTime} on {defaultDate} is submitted.</Text>
              <View style={{flex: 1}} />
            </View>
          : <View style = {styles.logoView}>
              <View style={{flex: 1}} />
              <View style={styles.profileImageView} >
                <Image style={styles.profileImage} source={{uri: this.state.request.receiver.image}}/>
                <View style={{...styles.statusView, backgroundColor: this.state.request.receiver.status == 'offline' ? theme.colors.lightGray : theme.colors.greenColor }}/>
              </View>
              <Text style={{...styles.melisaText, marginTop: 12}}>Your support request is accepted by {this.state.request.receiver == '' ?  " " : this.state.request.receiver.firstname + " " + this.state.request.receiver.lastname}.</Text>
              <View style={{flex: 1}} />
            </View> 
          }

          <View style={styles.contentView}>
            <Text style={styles.meetingText}>Meeting Details</Text>

            { this.state.request.receiver == '' ?
              <TouchableOpacity onPress={() => this.onReScheduleSupport()} style={styles.rightButton}>
                <Text style={styles.rightText}>Re-schedule</Text>
              </TouchableOpacity> : null 
            }
            
            <View style={styles.supportView}>
              <View style={styles.iconView}>
                <Image style={styles.iconImage} source={ (this.state.request.type === 'Video') ? require('../assets/images/request/icon_video.png') : (this.state.request.type === 'Call') ? require('../assets/images/request/icon_call.png') : require('../assets/images/request/icon_chat.png')} />
              </View>
              <Text style={styles.cellText}>{this.state.request.type}</Text>                
            </View>

            <View style={styles.timeView}>
              <View style={styles.iconView}>
                <Image source={require('../assets/images/home/icon_schedule.png')} style={styles.iconImage}/>
              </View>
              <Text style={styles.cellText}>{defaultDate1} / {defaultTime1}</Text>
            </View>

            <Text style={styles.contentText}>{this.state.request.description}</Text> 
            <Text style={{...styles.contentText, marginTop: 18, marginBottom: 20}}>{this.state.request.simulator}</Text>                            

          </View>
        </ScrollView>

        <View style ={this.state.isFromScheduleSupport == true ? styles.bottomView1 : styles.bottomView2}>
          {this.state.isFromScheduleSupport == true ? 
            <TouchableOpacity style={styles.scheduleButton} onPress={() => this.onUserCancel()}>
                <Image source={require('../assets/images/request/icon_home_white.png')} style={styles.iconHomeImage}/>
                <Text style={styles.scheduleButtonText}>Return Home</Text>
            </TouchableOpacity> 
            : null}

          <TouchableOpacity style={styles.cancelButton} onPress={() => this.onCancelRequest()} >
            <Text style={styles.cancelText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>

        {this.state.isLoading ? 
        (<ActivityIndicator
          color={theme.colors.primary}
          size="large"
          style={styles.preloader}
          />
        ) : null}

      </Background>
    )
  }
}

const styles = StyleSheet.create({

  preloader: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    position: 'absolute',
  },

  navigationView: {
    width: '100%',
    height: Platform.OS === 'ios' ? 70 + getStatusBarHeight() : 70,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBar,
    marginBottom: 8,    

    shadowColor: theme.colors.shadow,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
  },     

  contentView1: {
    width: '100%',
    flex: 1,
    marginBottom: 190,    
    backgroundColor: theme.colors.inputBar
  }, 

  contentView2: {
    width: '100%',
    flex: 1,
    marginBottom: 120,    
    backgroundColor: theme.colors.inputBar
  }, 

  logoView: {
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT * 0.45,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: theme.colors.inputBar
  },

  logoImage: {
    width: DEVICE_WIDTH - 160,
    height: DEVICE_WIDTH - 160,
    resizeMode: 'contain',
  },

  profileImageView :{
    width: DEVICE_WIDTH - 180,
    width: DEVICE_WIDTH - 180,

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  profileImage: {
    width: DEVICE_WIDTH - 180,
    height: DEVICE_WIDTH - 180,
    borderRadius: (DEVICE_WIDTH - 180) / 2,
    borderWidth: 3,
    borderColor: '#fff',
  },

  nameText: {
    height: 33,
    marginTop: 15,
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold',
  },

  melisaText: {    
    marginHorizontal: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold',      
  },

  contentView: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    backgroundColor: 'white',
  },

  meetingText: {
    marginTop: 16,
    marginLeft: 16,
    fontSize: 15,
    lineHeight: 23,
    fontFamily: 'Poppins-Regular',   
    color: theme.colors.lightGray,       
  },

  rightButton: {
    position: 'absolute',
    height: 40,
    top: 17,
    right: 32,
  },

  rightText: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: 'Poppins-Medium',  
    textAlign: 'right',
    color: theme.colors.primary,
  },

  supportView: {
    height: 42,
    marginTop: 16,
    marginLeft: 16,
    alignItems: 'center',
    flexDirection: 'row',
  },

  timeView: {
    height: 42,
    marginTop: 12,
    marginLeft: 16,
    alignItems: 'center',
    flexDirection: 'row',
  },

  statusView: {
    width: 40,
    height: 40,
    position: 'absolute',
    right: 14,
    bottom: 12,
    borderColor: 'white',
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: 'red'    
  },

  iconView: {
    height: 42,
    width: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: theme.colors.supportBorder,   
    alignItems: 'center',
    justifyContent: 'center', 
  },

  iconImage: {
    height: 26,
    width: 26,      
  },

  iconHomeImage: {
    height: 24,
    width: 24,   
    marginRight: 10   
  },

  cellText: {
    marginTop: 3.5,
    marginLeft: 12,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',  
  },

  contentText: {
    width: DEVICE_WIDTH - 32,
    marginTop: 12,
    marginRight: 16,
    marginLeft: 16,
    textAlign: 'left',
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',  
  },

  cancelButton: {
    width: DEVICE_WIDTH - 64,
    height: 57, 
    marginLeft: 32,
    marginTop: 16, 
    marginBottom: 47,   
    borderRadius: 28.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: theme.colors.mainRed,
    borderWidth: 2,    
  }, 

  cancelText: {    
    fontSize: 18,
    lineHeight: 25,    
    fontFamily: 'Poppins-Medium',
    color: theme.colors.mainRed,
  },

  scheduleButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 16,    
    borderRadius: 28.5,
    backgroundColor: theme.colors.lightYellow,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexDirection: 'row',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  scheduleButtonText: {
      fontSize: 18,
      lineHeight: 25,    
      fontFamily: 'Poppins-Medium',
      color: 'white',
  },

  bottomView1: {
    position: 'absolute', 
    width: DEVICE_WIDTH, 
    height: 190, 
    bottom: 0, 
    backgroundColor: 'white',
    borderTopColor: theme.colors.inputBar,
    borderTopWidth: 2,
  },

  bottomView2: {
    position: 'absolute', 
    width: DEVICE_WIDTH, 
    height: 120, 
    bottom: 0, 
    backgroundColor: 'white',
    borderTopColor: theme.colors.inputBar,
    borderTopWidth: 2,
  },

  backButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    bottom: 8,
    left: 0,
    paddingBottom: 8,
    paddingLeft: 16,
    justifyContent: 'flex-end',
  },
  
  backImage: {
    width: 12,
    height: 20.5,
  },

  titleText: {
    height: 28,
    position: 'absolute',
    bottom: 8,
    fontSize: 20,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',    
    fontWeight: '500'
  },
})