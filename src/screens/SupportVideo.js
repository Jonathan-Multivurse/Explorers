import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Platform, View, StyleSheet, Image, Dimensions, TouchableOpacity, Alert, Text } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import { theme } from '../core/theme'
import REQUEST_DB from '../api/requestDB'
import firestore from '@react-native-firebase/firestore'
import { 
  usersGet,
  usersSelect,
  webrtcCall
} from '../actionCreators'
import { showError } from '../NotificationService'
import QB from 'quickblox-react-native-sdk'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height;

class SupportVideo extends Component {
  constructor(props) {
    super(props)
    this._observer = null;

    this.state = { 
      isLoading: false,
      request: this.props.route.params.request,

      isClicked: false,
      selectedIndex: -1,
    }
  }

  componentDidMount() {
    this.props.getUsers()

    this._observer = firestore().collection('request').doc(this.state.request.requestid)
    .onSnapshot({
      error: (e) => console.error(e),
      next: (documentSnapshot) => {
        if ( documentSnapshot.data() !== undefined ) {
          if ((documentSnapshot.data()['status'] === 'accepted' )) {
            console.log("Video request is accepted")
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
    const { selectUser, selected = [] } = this.props
    const index = selected.findIndex(item => item.id === user.QBId)

    if (index > -1 || selected.length < 3) {
      const username = (user.firstname +  " " + user.lastname) || user.email
      selectUser({ id: user.QBId, name: username })
    } else {
      showError(
        'Failed to select user',
        'You can select no more than 3 users'
      )
      return;
    }

    global.selectedRequest = this.state.request

    setTimeout(() => {
      this.videoCall() 
    }, 200); 
  }

  videoCall = () => {    
    const { call, selected } = this.props
    const opponentsIds = selected.map(user => user.id)
    try {
      call({ opponentsIds, type: QB.webrtc.RTC_SESSION_TYPE.VIDEO })
    } catch (e) {
      showError('Video Error', e.message)
    }
  }

  onPressed = (selected) => {
    if(this.state.selectedIndex == selected){
      this.setState({
        selectedIndex: -1,
        isClicked: false
      })
    } else {
      this.setState({
        selectedIndex: selected,
        isClicked: true
      })
    }    
  }

  onCancelRequestPressed = () => {
    REQUEST_DB.cancelRequest(this.state.request.requestid, this.onUserCancel);
  }

  onUserCancel = () => {
    this.props.navigation.goBack()
  } 
  
  render() {
    return (
      <Background>
        <View style={{backgroundColor: '#000'}} >
        <TouchableOpacity style={styles.backButton} onPress={() => this.onCancelRequestPressed()} >
          <Image
            style={styles.backImage}
            source={require('../assets/images/login/arrow_back_White.png')}
          />
        </TouchableOpacity>

        {this.state.request.receiver == '' ?
          <View style = {styles.logoView}>
            <View style={{flex: 1}} />
            <Image style={styles.logoImage} source={require('../assets/images/request/appLogo.png')} />
            <Text style={styles.melisaText}>MeLiSA</Text>
            <Text style={styles.requestText}>Connecting...</Text>
            <View style={{flex: 1}} />
          </View>
        : <View style = {styles.logoView}>
            <View style={{flex: 1}} />
            <View style={styles.profileImageView} >
              <Image style={styles.profileImage} source={{uri: this.state.request.receiver.image}}/>
            </View>
            <Text style={styles.nameText}>{this.state.request.receiver.firstname + " " + this.state.request.receiver.lastname}</Text>
            <Text style={styles.requestText}>Ringing</Text>
            <View style={{flex: 1}} />
          </View>        
        }

        <View style = {styles.contentView}>
            <View style={{flex: 1}}/>
            <View style = {styles.supportContentView}>
              <View style={{flex: 2}}></View>
              <View style = {styles.supportButton}>
                <TouchableOpacity style={{alignItems: 'center', alignContent: 'center', justifyContent: 'center'}}  onPress={() => this.onCancelRequestPressed()}>
                  <Image style={styles.endImage} source={require('../assets/images/call/icon_EndCall.png')} />
                </TouchableOpacity>                 
              </View>

              <View style={{flex: 2}}></View>
            </View>
        </View>
        </View>
      </Background>
    )
  }
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    top: Platform.OS === 'ios' ? 10 + getStatusBarHeight() : 10,
    left: 0,
    paddingBottom: 8,
    paddingLeft: 16,
    justifyContent: 'flex-end',
  },
  
  backImage: {
    width: 12,
    height: 20.5,
  },

  cameraButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    top: Platform.OS === 'ios' ? 18 + getStatusBarHeight() : 18,
    right: 16,
    paddingBottom: 4,
    paddingLeft: 4,
    justifyContent: 'flex-end',
  },

  cameraImage: {
    width: 42,
    height: 42,
  },

  navigationView: {
    width: '100%',
    height: Platform.OS === 'ios' ? 60 + getStatusBarHeight() : 66,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },  

  logoView: {
    width: '100%',
    height: DEVICE_HEIGHT * 0.5,
    marginTop: Platform.OS === 'ios' ? 60 + getStatusBarHeight() : 66,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    color: '#fff'     
  },

  requestText: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',       
    color: '#fff'
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
    color: '#FFFFFF'
  },

  contentView: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  supportContentView: {
    width: DEVICE_WIDTH,
    flexDirection: 'row',    
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
  },

  supportButton: {
    width: 62,
    height: 62,
    marginBottom: 51,
  },

  imageView: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF30',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  imageViewSeleted: {
    width: 62,
    height: 62,
    borderRadius: 31,    
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  supportImage: {
    width: 33,
    height: 33,
    resizeMode: 'contain'
  },

  muteText: {
    marginTop: 8, 
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',      
    textAlign: 'center' 
  },

  cancelButton: {
    width: 62,
    height: 99,
    marginBottom: 14, 
    alignItems: 'center',
    justifyContent: 'center',   
  }, 

  endImage: {    
    width: 99,
    height: 99,   
    alignSelf: 'center'  
  },
})

// const mapStateToProps = ({ auth, users }, { exclude = [] }) => ({
//   data: users
//     .users
//     .filter(user => auth.user ? user.id !== auth.user.id : true)
//     .filter(user => exclude.indexOf(user.id) === -1),
//   filter: users.filter,
//   loading: users.loading,
//   page: users.page,
//   perPage: users.perPage,
//   selected: users.selected,
//   total: users.total,
// })

const mapStateToProps = ({ auth, users, chat }, { exclude = [] }) => ({
  data: users
    .users
    .filter(user => auth.user ? user.id !== auth.user.id : true)
    .filter(user => exclude.indexOf(user.id) === -1),
  selected: users.selected,
  connected: chat.connected,
  loading: chat.loading,
})

const mapDispatchToProps = {
  getUsers: usersGet,
  selectUser: usersSelect,
  call: webrtcCall,
}

export default connect(mapStateToProps, mapDispatchToProps)(SupportVideo)