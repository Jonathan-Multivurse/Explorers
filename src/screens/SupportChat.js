import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Platform, View, StyleSheet, Image, Dimensions, TouchableOpacity, Alert, Text, ActivityIndicator } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import USER_DB from '../api/userDB'
import REQUEST_DB from '../api/requestDB'
import firestore from '@react-native-firebase/firestore'
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

class SupportChat extends Component {
  constructor(props) {
    super(props)
    this._observer = null;

    this.state = { 
      isLoading: false,
      request: this.props.route.params.request,
    }
  }

  componentDidMount() {
    this._observer = firestore().collection('request').doc(this.state.request.requetid)
    .onSnapshot({
      error: (e) => console.error(e),
      next: (documentSnapshot) => {
        if ( documentSnapshot.data() !== undefined ) {
          if ((documentSnapshot.data()['status'] === 'accepted' )) {
            console.log("Chat request is accepted")
            this.setState({request: documentSnapshot.data()})
            const receiver = documentSnapshot.data().receiver             
            this.onUserSelect(receiver)                     
          }
        }        
      }
    })
  }

  componentWillUnmount() {
    this._observer();
  }

  onUserSelect = (user) => {
    const { selectUser, selected } = this.props
    selectUser(user.QBId)

    setTimeout(() => {
      this.createHandler() 
    }, 500);  
  }

  createHandler = () => {    
    const { createDialog, navigation, selected } = this.props
  
    new Promise((resolve, reject) => {
      createDialog({ occupantsIds: selected, resolve, reject })
    })
    .then(action => {
      const dialog = action.payload
      global.selectedRequest = this.state.request
      navigation.navigate('Messages', {dialog})
    })
    .catch(action => showError('Failed to create dialog', action.error))
  }

  onSendMessage = () => {

  }

  onCancelRequest = () => {
    Alert.alert(
      "Cancel Request",
      "Are you sure for cancelling the support request?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        { 
          text: "Yes", onPress: () => this.onCancelRequestPressed() 
        }
      ],
      {cancelable: false},
    )  
  }
  
  onCancelRequestPressed = () => {
    REQUEST_DB.cancelRequest(this.state.requetId, this.onUserCancel);
  }

  onUserCancel = () => {
    this.props.navigation.goBack()
  }  

  render() {
    return (
      <Background>
        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.onCancelRequest()} />
          <PageTitle>Support Chat</PageTitle>
        </View>

        <View style = {styles.logoView}>
          <View style={{flex: 1}} />
          <Image source={require('../assets/images/request/appLogo.png')} style={styles.logoImage} />
          <Text style={styles.melisaText}>MeLiSA</Text>
          <Text style={styles.requestText}>Requesting...</Text>
          <View style={{flex: 1}} />
        </View>

        <View style = {styles.contentView}>
          <View style={{flex: 1}}/>
          <Text style={styles.yourText}>Your support request is submitted.</Text>        
          <View style={{flex: 1}}/>
          <TouchableOpacity style={styles.doneButton} onPress={() => this.onSendMessage()}>
            <Text style={styles.doneText}>Send Message</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.onCancelRequest()} style={styles.cancelButton}>
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
    height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: theme.colors.inputBar
  },  

  logoView: {
    width: '100%',
    height: DEVICE_HEIGHT * 0.52,
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

  melisaText: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold',       
  },

  requestText: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',       
  },

  contentView: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  yourText: {
    width: 343,
    // marginTop: 38, 
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-Medium',      
    textAlign: 'center' 
  },

  doneButton: { 
    width: DEVICE_WIDTH - 64,
    height: 57,
    marginBottom: 20,
    borderRadius: 28.5,
    backgroundColor: theme.colors.lightYellow,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  doneText: {
    fontSize: 18,
    lineHeight: 25,
    color: 'white',
    fontFamily: 'Poppins-Medium',
  },

  cancelButton: {
    width: DEVICE_WIDTH - 64,
    height: 40, 
    marginBottom: 46,   
    alignItems: 'center',
    justifyContent: 'center',   
  }, 

  cancelText: {    
    fontSize: 18,
    lineHeight: 25,    
    fontFamily: 'Poppins-Medium',
    color: theme.colors.mainRed,
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

export default connect(mapStateToProps, mapDispatchToProps)(SupportChat)