import React, { Component } from 'react'
import { connect } from 'react-redux'
import { StyleSheet, View, Platform, TouchableOpacity, Text, Dimensions, TextInput, ActivityIndicator, Linking } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import DeviceInfo from 'react-native-device-info'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import { nameValidator } from '../helpers/nameValidator'
import EMAIL_AUTH from '../api/userAuth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  chatConnectAndSubscribe,
  loginRequest,
  usersCreate,
  usersUpdate,
} from '../actionCreators'
import USER_DB from '../api/userDB'

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

class FacilityLogin extends Component {
  constructor(props) {
    super(props)    
    this._unsubscribeFocus = null;

    this.state = { 
      email: '',
      fname: '',
      fnameError: '',
      isLoading: false,
      token: '',
    }    
  }

  componentDidMount() {
    this.getUserInfo()
    this._unsubscribeFocus = this.props.navigation.addListener('foucs', () => {
      this.getUserInfo()
    });
  }

  componentWillUnmount() {
    this._unsubscribeFocus();
  }

  getUserInfo = async () => {
    try {
      const tokenValue = await AsyncStorage.getItem('user_token')
      if(tokenValue !== null) {
        this.setState({token: tokenValue})
      } 
    } catch(e) {
      console.log('Failed read User Token.')
    }
  }

  updateInputVal = (val, prop) => {
    const state = this.state
    state[prop] = val
    this.setState(state)
  }

  onLoginPressed = () => {
    const nameError = nameValidator(this.state.fname)
    if (nameError) {
      this.updateInputVal(nameError, 'fnameError')
      return
    }
    let uniqueId = DeviceInfo.getUniqueId();
    let email = this.state.fname + uniqueId + '@gmail.com'
    email.replace('-', '');
    console.log('Facility email =', email)

    this.setState({
      isLoading: true,
      email: email,
    })

    EMAIL_AUTH.onPressFLogin(this.state.fname, email, this.state.token,  this.onUserLoggedIn);
  }

  onUserLoggedIn = () => {
    this.setState({
      isLoading: false,
    })

    this.submit(this.state.email, this.state.fname)
  }

  submit = async(login, username) => {
    const { createUser, signIn } = this.props;
    new Promise((resolve, reject) => {
      signIn({ login, resolve, reject })
    }).then(action => {
      this.checkIfUsernameMatch(username, action.payload.user)
    }).catch(action => {
      const { error } = action
      if (error.toLowerCase().indexOf('unauthorized') > -1) {
        new Promise((resolve, reject) => {
          createUser({
            fullName: username,
            login,
            password: 'quickblox',
            resolve,
            reject,
          })
        }).then(() => {
          this.submit({ login, username })
        }).catch(userCreateAction => {
          const { error } = userCreateAction
          if (error) {
            console.log('Failed to create user account', error)
          }
        })
      } else {
        console.log('Failed to sign in', error)
      }
    })
  }

  checkIfUsernameMatch = (username, user) => {
    USER_DB.updateProfile({token: this.state.token, QBId: user.id}, null)

    const { updateUser } = this.props
    const update = user.fullName !== username ?
      new Promise((resolve, reject) => updateUser({
        fullName: username,
        login: user.login,
        resolve,
        reject,
      })) :
      Promise.resolve()
    update
      .then(this.connectAndRedirect)
      .catch(action => {
        if (action && action.error) {
          console.log('Failed to update user', action.error)
        }
      })
  }

  connectAndRedirect = () => {
    this.setState({
      isLoading: false
    })

    const { connectAndSubscribe, navigation } = this.props
    connectAndSubscribe()
    global.isFromCall = false
    this.props.navigation.navigate('Dashboard')
  }

  openTerms = async () => {
    // this.props.navigation.replace('TermsScreen')

    const termsURL = 'https://www.echo.healthcare/support'
    Linking.canOpenURL(termsURL).then(supported => {
      if (supported) {
        Linking.openURL(termsURL);
      } else {
        console.log("Don't know how to open URI: " + termsURL);
      }
    });
  }

  render() {
    return (
      <Background>

        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Facility Login</PageTitle>
        </View>

        <View style = {styles.contentView}> 
          <Text style={styles.emailText}>Facility Name</Text>
          <TextInput
            style={styles.emailInput}
            value={this.state.firstName}
            onChangeText={ (text) => this.updateInputVal(text, 'fname') }
            autoCapitalize="none"
            autoCompleteType="name"
            textContentType="name"
            keyboardType="name-phone-pad"
          />

          <View style={{height : Platform.OS === 'ios' ? DEVICE_HEIGHT - getStatusBarHeight() - 422 : DEVICE_HEIGHT - 428 }} />
          <View style={{flex: 1}} />

          <TouchableOpacity style={styles.loginButton} onPress={() => this.onLoginPressed()}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          <View style={styles.termsView}>
            <Text style={styles.byText}>By continuing you agree to </Text>
            <TouchableOpacity onPress={() => this.openTerms()}>
              <Text style={styles.termsText}>Terms and Conditions.</Text>
            </TouchableOpacity>
          </View>

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
  },

  rightButton: {
    position: 'absolute',
    height: 50,
    bottom: 0,
    right: 0,
    paddingBottom: 12,
    paddingRight: 16,
    justifyContent: 'flex-end',
  },

  rightText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'right',
    color: theme.colors.primary
  },

  contentView: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 16,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  emailText: {
    height: 20,
    marginTop: 44,
    marginBottom: 7,
    alignSelf: 'flex-start',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins-Regular',
  },

  emailInput: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F2F2F2',
    paddingLeft: 12,
    paddingRight: 12,
  },

  view2: {
    position: 'absolute',
    width: '100%',
    height: '30%',
    bottom: 0,
    paddingHorizontal: 16,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginBottom: 32,
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
    fontFamily: 'Poppins-Medium',
    color: 'white',
  },

  termsView: {
    height: 41,
    marginBottom: 69,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },

  byText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray,
  }, 

  termsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray,
    textDecorationLine: 'underline',
  },  
})

const mapStateToProps = ({ auth, chat, users }) => ({
  loading: auth.loading || chat.loading || users.loading,
})

const mapDispatchToProps = {
  connectAndSubscribe: chatConnectAndSubscribe,
  createUser: usersCreate,
  signIn: loginRequest,
  updateUser: usersUpdate,
}

export default connect(mapStateToProps, mapDispatchToProps)(FacilityLogin)