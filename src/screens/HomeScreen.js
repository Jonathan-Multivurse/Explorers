import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, StyleSheet, Platform, Image, Dimensions, Keyboard, Text, TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, Modal, TextInput, SectionList, ScrollView, Alert} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import { theme } from '../core/theme'
import * as RNLocalize from 'react-native-localize'
import firestore from '@react-native-firebase/firestore'
import {firebase} from "@react-native-firebase/auth"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Rating } from 'react-native-ratings'
import moment from 'moment'
import REQUEST_DB from '../api/requestDB'
import USER_DB from '../api/userDB'
import FACILITY_DB from '../api/facilityDB'

import { showError } from '../NotificationService'
import QB from 'quickblox-react-native-sdk'
import { 
  usersGet,
  usersChatSelect,
  dialogCreate, 
  dialogCreateCancel, 
  messageSend } from '../actionCreators'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height;

class HomeScreen extends Component {
  constructor(props) {
    super(props)
    
    this._observer = null;
    this._unsubscribeFocus = null;

    this.state = { 
      isLoading: false,
      curUser: '',

      alertFlag: '',
      comment: '',
      receiverRating: 0,
      keyboardHeight: 0,

      isCallModal: false,
      supportType: '',
      description: '',
      supportFacilityName: '',
      supportBranchName: '',
      supprotSimulator: '',
      isSimulatorModal: false,
      searchText: '',
      createdDialog: '',
      
      originalData: [],
      filteredData: [],
      
      modalVisible: false,      
    }
  }

  componentDidMount() {    
    this.getSavedFlag();
    
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.completeAllSessions()
      USER_DB.getProfile(this.onUserGet)
      if (global.selectedRequest) {
        REQUEST_DB.getRequest(global.selectedRequest.requestid, this.onRequestGet)
      }      
    });

    const userID = firebase.auth().currentUser.uid;
    this._observer = firestore().collection('notification').where('receivers', 'array-contains', userID)
    .onSnapshot(querySnapshot => {
      if (querySnapshot.docChanges().length > 0 ){
        this.setState({
          alertFlag: 'true',
        })          
      }      
    });

    Keyboard.addListener(
      'keyboardWillShow',
      this._keyboardDidShow,
    );

    Keyboard.addListener(
      'keyboardWillHide',
      this._keyboardDidHide,
    );
  }

  componentWillUnmount() {
    this._unsubscribeFocus();
    this._observer();
  }

  _keyboardDidShow = (event)=> {
    if(Platform.OS === 'ios') {
      this.setState({
        keyboardHeight: event.endCoordinates.height
      })
    }
  }

  _keyboardDidHide = (event)=> {
    if(Platform.OS === 'ios') {
      this.setState({
        keyboardHeight: 0
      })
    }
  }  

  completeAllSessions = () => {
    const userID = firebase.auth().currentUser.uid;

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/removeAllSessions', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.statusCode !== 200) {
        return;
      }       
    })
    .catch((err) => {        
    });
  }

  onUserGet = (user) => {
    this.setState({
      curUser: user,
    })

    FACILITY_DB.getFacilities(this.onGetFacilities) 
  }

  onRequestGet = (request) => {
    this.setState({ 
      modalVisible: global.isFromCall && request.status == 'completed' && !(global.selectedRequest.receiver === null || global.selectedRequest.receiver === undefined ),
      comment: '' 
    })
  }

  onGetFacilities = (facilities) => {    
    var simulatorData = []
    const currentFacilityIds = this.state.curUser.facility

    currentFacilityIds.map(facilityItem => {
      const facilityID = facilityItem.facility
      const tmpFacility = facilities.filter(facility => facility.facilityid === facilityID)[0]

      const branchName = facilityItem.branch
      const branches = tmpFacility.branch     
      const tmpBranch = branches.filter(branch => branch.name === branchName)[0]

      const simulatorIDs = tmpBranch.simulators
      const simulators = tmpFacility.simulators

      var tmpSimulators = []
      simulatorIDs.forEach(simulatorID => {
        const tmpSimulator = simulators.filter(simulator => simulator.simulatorid === simulatorID)[0]
        tmpSimulators.push(tmpSimulator)
      })

      simulatorData.push(
        {
          branch: { facility: tmpFacility, branch: tmpBranch},
          data: tmpSimulators
        }
      )
    })
    
    this.setState({
      isLoading: false,
      originalData: simulatorData,
      filteredData: simulatorData
    })
  }

  onNotifications = () => {
    this.props.navigation.navigate('NotificationScreen', {
      onGoBackFromOptions: (item) => this._onGoBackFromOptions(item)
    })
  } 

  getSavedFlag = async () => {
    try {
      const isFlag = await AsyncStorage.getItem('new_alert')      
      if (isFlag) {
        this.setState({alertFlag: isFlag})
      }      
    } catch(e) {
      console.log('Reading AlertFlag Error')
    }
  }

  _onGoBackFromOptions = (item) => {
    this.setState({
      alertFlag: item,    
    })
  }

  onScheduleSupport = () => {
    this.props.navigation.push('ScheduleSupport', {
      isCreate: true,
    })
  } 

  onSendCallRequest = () => {
    this.setState({isCallModal: true, supportType: 'Call', supprotSimulator: '', description: ''})    
  }

  onSendVideoRequest = () => {
    this.setState({isCallModal: true, supportType: 'Video', supprotSimulator: '', description: ''})
  }

  onSendChatRequest = () => {
    this.setState({isCallModal: true, supportType: 'Chat', supprotSimulator: '', description: ''})
  } 

  onSendRequest = () => {
    if (this.state.description == '') {
      Alert.alert(
        "Warning",
        `Please type description for this support.`,
        [
          {
            text: "Ok",
          },
        ],
        { cancelable: false }
      );
      return
    } else {      
      if (!this.state.isLoading) {
        this.setState({isLoading: true})  

        const { createDialog, navigation, selected } = this.props

        const phoneTzCode = RNLocalize.getTimeZone()
        const currentTimezone = {
          "label": '',
          "name": '',
          "tzCode": phoneTzCode,
          "utc": '',
        }    
        
        if (this.state.supportType == 'Call') {
          REQUEST_DB.addRequest('Call', this.state.supportFacilityName, this.state.supprotSimulator, new Date().getTime(), 'pending', false, new Date().getTime(), currentTimezone, this.state.description, '', this.state.curUser, '', '', this.onCallSubmit)
        } else if (this.state.supportType == 'Video') {
          REQUEST_DB.addRequest('Video', this.state.supportFacilityName, this.state.supprotSimulator, new Date().getTime(), 'pending', false, new Date().getTime(), currentTimezone, this.state.description, '', this.state.curUser, '', '', this.onVideoSubmit)
        } else if  (this.state.supportType == 'Chat'){               

          new Promise((resolve, reject) => {
            const dialogName = this.state.curUser.firstname + '-' + this.state.supprotSimulator + moment().format('hh:mm-DD-MM')          
            createDialog({ name: dialogName, type: QB.chat.DIALOG_TYPE.GROUP_CHAT, occupantsIds: [this.state.curUser.QBId], resolve, reject })
          })
          .then(action => {
            const dialog = action.payload
            this.setState({createdDialog: dialog})

            REQUEST_DB.addRequest('Chat', this.state.supportFacilityName, this.state.supprotSimulator, new Date().getTime(), 'pending', false, new Date().getTime(), currentTimezone, this.state.description, dialog, this.state.curUser, '', '', this.onChatSubmit)
          })
          .catch(action => showError('Failed to create dialog', action.error))
        } 

      }        
    }    
  }

  onCallSubmit = async (request) => {
    this.setState({
      isCallModal: false,
      isLoading: false
    })
    this.props.navigation.navigate('SupportCall', {
      request: request,
    })
  }

  onVideoSubmit = async (request) => {
    this.setState({
      isCallModal: false,
      isLoading: false
    })
    this.props.navigation.navigate('SupportVideo', {
      request: request,
    })
  }

  onChatSubmit = async (request) => {
    this.setState({
      isCallModal: false,
      isLoading: false    
    })

    const { createDialog, navigation, selected } = this.props
    global.selectedRequest = request
    const dialog = this.state.createdDialog   
    global.curUser = this.state.curUser 
    navigation.navigate('Messages', {dialog})
  }

  // Select Simulator
  onSimulatorSelect = () => {
    this.setState({
      isSimulatorModal: true,
      isCallModal: false,
    })
  }

  searchFilter = (text) => {
    if (text) {
      const textData = text.toUpperCase()
      var newData = []

      this.state.originalData.forEach(element => {
        const simulators = element.data
        const newSimulators = simulators.filter(
          function(item){
            const itemData = item.name.toUpperCase()            
            return itemData.indexOf(textData) > -1
          }
        )

        if (newSimulators.length > 0) {
          newData.push(
            {
              branch: element.branch,
              data: newSimulators
            }
          )
        }
      })

      this.setState({
        searchText: text,
        filteredData: newData,
      })
    } else {
      this.setState({
        searchText: '',
        filteredData: this.state.originalData,
      })
    }
  }

  selectSimulatorRow = (item, section) => {
    this.setState({
      supportFacilityName: section.branch.facility.title,
      supportBranchName: section.branch.branch.name,
      supprotSimulator: item.name,
      filteredData: this.state.originalData,
      searchText: '',
      isCallModal: true,
      isSimulatorModal: false
    });    
  }

  // Rating Pop up View
  onEdit = (visible) => {
    global.isFromCall = false
    global.selectedRequest = null
    this.setState({ modalVisible: visible });             
  }

  updateInputVal = (val, prop) => {
    const state = this.state
    state[prop] = val
    this.setState(state)
  }

  ratingCompleted = (rating) => {
    this.setState({
      receiverRating: rating
    });
  }

  onRatingDone = () => {
    this.setState({
      isLoading: true,
    })    

    const userID = firebase.auth().currentUser.uid;
    
    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/writeRating', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
        receiverid: global.selectedRequest.receiver.userid,
        comment: this.state.comment,
        rating: this.state.receiverRating,
        requestid: global.selectedRequest.requestid
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {

      this.setState({
        isLoading: false,
        modalVisible: false,
      }) 

      global.isFromCall = false
      global.selectedRequest = null

      if (responseJson.statusCode !== 200) {
        return;
      }      
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  render() {
    return (
      <Background> 

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            this.onEdit(false)
          }}
        >
          <View style={styles.centeredView}>            
            
            <View style={{flex: 1}}/>
            <View style = {{...styles.modalView}}>
              <ScrollView>                           
                <View style={styles.titleView}>
                  <View style={{flex: 1}}/>
                  <Text style={styles.editPText}>Rating {"&"} Review</Text>
                  <View style={{flex: 1}}/>
                  <TouchableOpacity onPress={() => this.onEdit(false) } style={styles.closeButton} >
                    <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                  </TouchableOpacity>
                </View>   

                <View style={styles.profileImageView} >
                  { (global.selectedRequest === null || global.selectedRequest === undefined ) || ( global.selectedRequest.receiver === '') ? (<Image style={styles.profileImage} source={require('../assets/images/notification/iconUser.png')}/>) : (<Image style={styles.profileImage} source={{uri: global.selectedRequest.receiver.image}}/>) }                  
                </View>

                <Text style={styles.helpText}>Help {(global.selectedRequest === null || global.selectedRequest === undefined ) || ( global.selectedRequest.receiver === '') ? "" : global.selectedRequest.receiver.firstname} improve!</Text> 
                <Text style={styles.overallText}>Overall Experience</Text> 
                <Rating
                  type='custom'
                  startingValue={0}
                  showRating={false}
                  onFinishRating={this.ratingCompleted}
                  imageSize={44}
                  style={{ paddingVertical: 5 }}
                />
                <Text style={styles.commentText}>Comment</Text>
                <TextInput
                  style={styles.emailInput}
                  multiline={true}
                  value={this.state.comment}
                  onChangeText={ (text) => this.updateInputVal(text, 'comment') }
                  autoCapitalize="none"
                  autoCompleteType="name"
                  textContentType="name"
                />                        

                <TouchableOpacity style={{...styles.loginButton, marginBottom: this.state.keyboardHeight + 57}} onPress={() => this.onRatingDone()}>
                  <Text style={styles.loginText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View> 
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.isCallModal}
          onRequestClose={() => {
            this.setState({isCallModal : false})
          }}
        >
          <View style={styles.centeredView}>  

            <View style={{flex: 1}}/>
            <View style = {styles.modalView}>
              <ScrollView> 

                <View style={styles.titleView1}>
                  <View style={{flex: 1}}/>
                  <Text style={styles.editPText}>{this.state.supportType} Support</Text>
                  <View style={{flex: 1}}/>
                  <TouchableOpacity style={styles.closeButton} onPress={() => this.setState({isCallModal: false})} >
                    <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                  </TouchableOpacity>
                </View> 

                <Text style={{...styles.selectText, marginTop: 25,}}>Support</Text>
                <View style={{...styles.cellSelectedContentView, alignSelf: 'flex-start', marginLeft: 16,}}>
                  <Image style={styles.callImage} source={ this.state.supportType == 'Call' ? require('../assets/images/request/icon_call.png') : this.state.supportType == 'Video' ? require('../assets/images/request/icon_video.png') : require('../assets/images/request/icon_chat.png')}  />
                  <Text style={styles.callText}>{this.state.supportType}</Text>
                </View>

                <Text style={{...styles.pleaseText, marginTop: 12}}>Please select a branch and simulator that you are requesting support for</Text>
                <View style ={styles.simulatorView}>
                  <Text style={{fontSize: 17, lineHeight: 24, fontFamily: 'Poppins-Medium', }}>Simulator </Text>
                  <Text style={{fontSize: 17, lineHeight: 24, fontFamily: 'Poppins-Regular', }}>(Optional)</Text>
                </View> 

                <TouchableOpacity style={styles.simulatorButton} onPress={() => this.onSimulatorSelect()}  >
                  <Text style={this.state.supprotSimulator == '' ? styles.nonsimulatorText : styles.simulatorText}>{this.state.supprotSimulator == '' ? 'Select' : this.state.supprotSimulator }</Text>
                  <View style={{flex: 1}}/>
                  <Image source={require('../assets/images/request/arrow_forward.png')} style={styles.chevronImage}/>
                </TouchableOpacity>

                <View style={{flexDirection: 'row'}}>
                  <Text style={styles.selectText}>Description</Text> 
                  <View style={{flex:1}}/>
                  <Text style={styles.countText}>{this.state.description.length}/100</Text> 
                </View>
                
                <TextInput
                  style={styles.emailInput}
                  multiline={true}
                  value={this.state.description}
                  onChangeText={(text) => this.setState({description: text}) }
                  autoCapitalize="none"
                  autoCompleteType="name"
                  textContentType="name"
                /> 

                <TouchableOpacity onPress={() => this.onSendRequest()} style={{...styles.getSupportButton, marginBottom: this.state.keyboardHeight + 57}}>
                  <Text style={styles.loginText}>Get {this.state.supportType} Support</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>  
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.isSimulatorModal}
          onRequestClose={() => {
            this.setState({isSimulatorModal : false})
          }}
        >
          <View style={styles.centeredView2}>
            <View style = {styles.navigationView2}>
              <View style={{flex:1}}/>
              <Text style={styles.pageTitle1}>Select Simulator</Text> 
              <View style={{flex:1}}/>
              <TouchableOpacity onPress={() => this.setState({isCallModal: true, isSimulatorModal: false})} style={styles.arrowButton}>
                <Image style={styles.arrowImage} source={require('../assets/images/home/icon_bclose.png')}/>
              </TouchableOpacity>
            </View>

            <View style={styles.searchView}>              
              <TextInput
                style= {styles.searchInput}
                returnKeyType="search"
                value={this.state.searchText}
                onChangeText={(text) => this.searchFilter(text)}
                underlineColorAndroid="transparent"
                placeholder="Search"
              />
            </View> 

            <View style={styles.listView}>
              <SectionList
                sections={this.state.filteredData}
                keyExtractor={(item, index) => item + index}
                renderSectionHeader={({ section: {branch} }) => (
                  <View style = {styles.sectionView}>
                    <Text style={styles.sectionText}>{branch.facility.title} - {branch.branch.name}</Text>
                  </View>
                )}
                renderItem={({item, section}) => (
                  <TouchableWithoutFeedback onPress={() => this.selectSimulatorRow(item, section)}>
                    <View style={styles.cellContentView1}>
                      <Text style={styles.nameText}>{item.name}</Text>
                    </View>
                  </TouchableWithoutFeedback>
                )}  
              />
            </View>
          </View>
        </Modal>

        <View style = {styles.navigationView}>
          <Text style={styles.pageTitle}>MeLiSA</Text>
          <View style={{flex: 1}} />
          <TouchableOpacity style = {styles.rightButton} onPress={ () => this.onNotifications()}>
            <Image style={styles.alertImage} source={(this.state.alertFlag === 'true') ? require('../assets/images/home/alert_check.png') : require('../assets/images/home/alert.png')}/>
          </TouchableOpacity>
        </View>

        <View style = {styles.logoView}>
          <Image source={require('../assets/images/home/userLogo.png')} style={styles.logoImage} />
          <Text style={styles.logoTitle}>Welcome, {this.state.curUser.firstname }</Text> 
          <Text style={styles.logoText}>How can we help?</Text>          
        </View>
  
        <View style = {styles.supportView}>                
          <Text style={styles.scheduleText}>Get Support Now</Text> 
          <View style={{flex: 1}}/> 

          <View style = {styles.supportContentView}>
            <View style={{flex: 2}}></View>
            <TouchableOpacity style = {styles.supportButton} onPress={ () => this.onSendCallRequest()}>
              <Image style={styles.supportImage} source={require('../assets/images/home/call_support.png')}/>
            </TouchableOpacity>

            <View style={{flex: 1}}></View>
            <TouchableOpacity style = {styles.supportButton} onPress={ () => this.onSendVideoRequest()}>
              <Image style={styles.supportImage} source={require('../assets/images/home/video_support.png')}/>
            </TouchableOpacity>

            <View style={{flex: 1}}></View>
            <TouchableOpacity style = {styles.supportButton} onPress={ () => this.onSendChatRequest()}>
              <Image style={styles.supportImage} source={require('../assets/images/home/chat_support.png')}/>
            </TouchableOpacity>
            <View style={{flex: 2}}></View>
          </View>

          <View style={{flex: 2}}></View>
        </View>
  
        <View style = {styles.scheduleView}>                
          <Text style={styles.scheduleText}>Schedule Support</Text>
          <View style={{flex: 1}}></View> 
          <TouchableOpacity style = {styles.scheduleButton} onPress={ () => this.onScheduleSupport()}>
            <Image style={styles.scheduleImage} source={require('../assets/images/home/schedule_support.png')}/>
          </TouchableOpacity>
          <View style={{flex: 2}}></View>
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
    height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
    alignSelf: 'center',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },

  pageTitle: {
    height: 28,
    marginLeft: 20,
    marginBottom: 10,
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold',        
  },

  rightButton: {
    width: 50,
    height: 50,
    paddingLeft: 14,
    paddingTop: 14,
  },

  alertImage: {
    width: 22,
    height: 22,
  },

  logoView: {
    width: DEVICE_WIDTH,
    height: (DEVICE_WIDTH - 32) * 265/343, 
    alignSelf: 'center',
    alignItems: 'center',
  },

  logoImage: {
    width: DEVICE_WIDTH - 32,
    height: (DEVICE_WIDTH - 32) * 265/343,
    borderRadius: 14,
    resizeMode: 'contain',
  },

  logoTitle: {
    position: 'absolute',
    width: 270,
    bottom: 48,
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold', 
    textAlign: 'center',    
    color: 'white',
  },

  logoText: {
    position: 'absolute',
    width: 270,
    bottom: 24,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    textAlign: 'center',    
    color: 'white',
  },
 
  supportView: {
    flex: 1,
    width: DEVICE_WIDTH - 32,
    marginHorizontal: 16,
    marginVertical: 8,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
  },

  supportContentView: {
    flexDirection: 'row',    
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
  },

  supportButton: {
    width: 66,
    height: 90,
  },

  supportImage: {
    width: 66,
    height: 90,
  },

  scheduleView: {
    flex: 1,
    width: DEVICE_WIDTH - 32,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
  },

  scheduleText: {
    marginTop: 14,
    fontSize: 17,
    lineHeight: 26,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },

  scheduleButton: {
    width: 66,
    height: 90,
  },

  scheduleImage: {
    width: 66,
    height: 90,
  },

  centeredView: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: theme.colors.shadow
  },

  modalView: {    
    width: DEVICE_WIDTH,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    alignItems: "center",   
    backgroundColor: "white", 

    marginBottom: 0,
  },

  titleView : {    
    flexDirection: 'row',
  },
  
  editPText: {
    marginTop: 24,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  coloseImage: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 44,
    height: 44,
  },  

  profileImageView :{
    marginTop: 12,
    width: DEVICE_WIDTH - 240,
    width: DEVICE_WIDTH - 240,
    alignSelf: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  profileImage: {
    width: DEVICE_WIDTH - 240,
    height: DEVICE_WIDTH - 240,
    borderRadius: (DEVICE_WIDTH - 240) / 2,
    borderWidth: 3,
    borderColor: '#fff', 
  },

  helpText: {
    width: DEVICE_WIDTH,
    marginTop: 9,
    marginBottom: 16,
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 35,
    fontFamily: 'Poppins-SemiBold',
  },

  emailInput: {
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,
    height: 88,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingTop: 12,

    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  overallText: {
    width: DEVICE_WIDTH,
    marginBottom: 7,
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.lightGray
  },

  commentText: {
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Medium',
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    marginLeft: 24,
    height: 57,
    marginTop: 20,
    marginBottom: 57,
    borderRadius: 28.5,
    backgroundColor: theme.colors.lightYellow,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  loginText: {
    fontSize: 18,
    lineHeight: 25,
    color: 'white',
    fontFamily: 'Poppins-Medium',
  },  

  centeredView1: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 0,
    backgroundColor: theme.colors.shadow
  },

  modalView1: {    
    width: DEVICE_WIDTH,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    alignItems: "center",   
    backgroundColor: '#fff',

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },

  titleView1 : {    
    width: DEVICE_WIDTH,
    height: 72,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    flexDirection: 'row',
    borderBottomColor: theme.colors.inputBar,
    borderBottomWidth: 1,     
  },

  selectText:{
    marginTop: 24,
    paddingLeft: 16,
    fontSize: 17,
    lineHeight: 26,
    fontFamily: 'Poppins-Medium', 
    alignSelf: 'flex-start',
    // color: theme.colors.lightGray,
  },

  cellSelectedContentView: {
    height: 42,
    width: (DEVICE_WIDTH - 24 - 24)/3,
    marginHorizontal: 4,
    marginVertical: 8,
    paddingTop: 2,
    borderRadius: 21,           
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#FFFFFF',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
},

cellContentView: {
    height: 42,
    width: (DEVICE_WIDTH - 24 - 24)/3,
    marginHorizontal: 4,
    marginVertical: 8,
    paddingTop: 2,
    borderRadius: 21,   
    borderColor: theme.colors.supportBorder,       
    borderWidth:  1,    
    alignItems: 'center',
    justifyContent: 'center',        
    flexDirection: 'row',
},

  callImage: {
    width: 24,
    height: 24,        
    resizeMode: 'stretch'
  },

  callText: {
    marginLeft: 6,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular', 
  },

  pleaseText:{
    marginTop: 24,
    paddingLeft: 16,
    fontSize: 14,
    lineHeight: 26,
    fontFamily: 'Poppins-Regular', 
    alignSelf: 'flex-start',
    color: theme.colors.lightGray,
  },

  simulatorView:{
    marginTop: 24,
    paddingLeft: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },

  simulatorButton: {
    height: 44,
    width: DEVICE_WIDTH - 32,
    marginHorizontal: 16,
    marginTop: 8,
    paddingTop: 2,
    
    borderRadius: 10,
    backgroundColor: '#F2F2F2',

    alignItems: 'center',
    justifyContent: 'center',      
    flexDirection: 'row',    
  }, 

  simulatorText: {
    marginLeft: 12,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',      
  },

  nonsimulatorText: {
    marginLeft: 12,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',   
    color: theme.colors.lightGray,  
  },

  chevronImage: {
    marginRight: 16,
    width: 10.5,
    height: 18,
  }, 

  getSupportButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 40,
    marginLeft: 24,
    marginBottom: 57,
    borderRadius: 28.5,
    backgroundColor: theme.colors.lightYellow,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  centeredView2: {
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: 'white'
  },

  navigationView2: {
    width: '100%',
    height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
    alignItems: 'flex-end',
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBar
  },

  pageTitle1: {
    height: 30, 
    marginBottom: 14,  
    fontSize: 20, 
    lineHeight: 30,    
    fontFamily: 'Poppins-SemiBold', 
    fontWeight: '500',
  },

  closeButton: {
    width: 60, 
    height: 60, 
    position: 'absolute',
    right: 10,
    top: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  arrowButton: {
    width: 50, 
    height: 50, 
    position: 'absolute',
    right: 10,
    bottom: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  arrowImage: {
    width: 22,  
    height: 22
  },

  searchView: {
    width: DEVICE_WIDTH - 32,
    height: 45,    
    marginTop: 14,
    borderRadius: 22.5,    
    backgroundColor: theme.colors.inputBar,
  },

  searchInput:{
    flex: 1,
    marginLeft: 14,
  },

  listView: {
    flex: 1,
    marginTop: 8,  
  },

  sectionView: {
    width: DEVICE_WIDTH,
    marginTop: 6,
    height: 24,
    marginBottom: 6,
  },

  sectionText: {    
    paddingLeft: 16,
    paddingTop: 8,    
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',      
    color: theme.colors.sectionHeader
  },

  cellView: {
    width: DEVICE_WIDTH,
    height: 51,
    backgroundColor: 'red'
  },

  cellContentView1: {    
    flex: 1,
    width: DEVICE_WIDTH - 32,
    height: 45,
    marginTop: 6,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',

  },

  nameText: {
    marginLeft: 12,
    marginTop: 14,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',     
  },  

  countText:{
    marginTop: 24,
    marginRight: 16,
    paddingLeft: 16,
    fontSize: 18,
    lineHeight: 30,
    
    fontFamily: 'Poppins-Medium', 
    alignSelf: 'flex-start',
    color: theme.colors.lightGray,
  },

  descriptionInput: {
    width: DEVICE_WIDTH - 32,
    marginTop: 6,
    marginLeft: 16,
    height: 90,
    borderRadius: 10,
    backgroundColor: theme.colors.inputBar,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
  },
})

const mapStateToProps = ({ auth, users, chat }, { exclude = [] }) => ({
  data: users
    .users
    .filter(user => auth.user ? user.id !== auth.user.id : true)
    .filter(user => exclude.indexOf(user.id) === -1),
  currentUser: auth.user,
  selected: users.selected,
  connected: chat.connected,  
  loading: chat.loading,
  users: users.users,
})

const mapDispatchToProps = {
  getUsers: usersGet,
  selectUser: usersChatSelect,
  cancel: dialogCreateCancel,
  createDialog: dialogCreate,
  sendMessage: messageSend,
}

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen)