import React, { Component } from 'react'
import { connect } from 'react-redux'
import {StyleSheet, View, Text, Image, Dimensions, TouchableOpacity, Platform } from 'react-native'
import Background from '../components/Background'
import { theme } from '../core/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import messaging from '@react-native-firebase/messaging'
import auth from '@react-native-firebase/auth';
import USER_DB from '../api/userDB'
import Carousel, { Pagination } from 'react-native-snap-carousel';
import {
  chatConnectAndSubscribe,
  loginRequest,
  usersCreate,
  usersUpdate,
} from '../actionCreators'

const IS_IOS = Platform.OS === 'ios';
const IS_ANDROID = Platform.OS === 'android';
const SLIDER_1_FIRST_ITEM = 0;

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;
const sliderWidth = DEVICE_WIDTH;
const itemWidth = DEVICE_WIDTH;
const entryBorderRadius = 8;

const ENTRIES = [
  {
    title: 'MeLiSA support is now easier than ever',
    subtitle: 'Connect your account to your facility inventory and easily schedule or request immediate support.',
    illustration: require('../assets/images/login/intro1.png')
  },
  {
    title: 'Live support is always one click away.',
    subtitle: 'Our commitment is to ensure that you will always be connected to a highly trained ESR in less than 60 seconds.',
    illustration: require('../assets/images/login/intro2.png')
  },
  {
    title: 'Arrange your MeLiSA support at a time to suit you.',
    subtitle: 'We will assign an ESR to your schedule support even before your join it, so no waiting at all.',
    illustration: require('../assets/images/login/intro3.png')
  },
];

class StartScreen extends Component {
  constructor(props) {
    super(props)
    
    this._subscriber = null;
    this.state = {
      token: '',
      curUser: null,
      slider1ActiveSlide: SLIDER_1_FIRST_ITEM      
    }
  }

  componentDidMount() {
    this.requestUserPermission(); 
    this._subscriber = auth().onAuthStateChanged(this.onUserLoggedIn);
  }

  componentWillUnmount() {
    this._subscriber();
  }

  requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      this.getFcmToken()      
    }
  }

  getFcmToken = async () => {
    try {
      const tokenValue = await AsyncStorage.getItem('user_token')
      if(tokenValue !== null) {
        this.setState({token: tokenValue})
      } else {
        const fcmToken = await messaging().getToken();
        if (fcmToken) {
          console.log("FCM Token is:", fcmToken);
          this.setState({token: fcmToken})
          this.storeFcmToken(fcmToken)
        } else {
          console.log("Failed get FCM Token.");
        }
      }
    } catch(e) {
      console.log('Failed read User Token.')
    }
  }

  storeFcmToken = async (tokenValue) => {
    try {
      await AsyncStorage.setItem('user_token', tokenValue)
    } catch (e) {
      console.log('Failed store User Token')
    }
  }

  onUserLoggedIn = async (user) => {
    if (user) {
      const { appReady, loggedIn } = this.props
      if (loggedIn) {
        if (this.state.token != '') {
          USER_DB.updateProfile({token: this.state.token}, this.goNext)
        } else {
          this.goNext()
        }  
      }         
    }   
  }

  goNext = async() => {
    USER_DB.getProfile(this.onUserGet)
  }

  onUserGet = (userFB) => {
    this.setState({curUser: userFB})
    this.submit(userFB.email, userFB.firstname + " " + userFB.lastname)
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
        this.setState({
          isLoading: false
        })
        console.log('Failed to sign in', error)
      }
    })
  }

  checkIfUsernameMatch = (username, user) => {
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

    if (this.state.curUser.facility && this.state.curUser.facility.length > 0) {
      this.goDashboard()
    } else {
      this.props.navigation.navigate('RegisterScreen3', {
        isFromRegister: true,
        email: this.state.curUser.email
      }) 
    }
  }

  goDashboard = async () => {
    global.isFromCall = false
    this.props.navigation.navigate('Dashboard')
  }

  _renderItem ({item, index}) {
    // return <SliderEntry 
    //   data={item} 
    //   even={(index + 1) % 2 === 0}
    // />;

    const even = (index + 1) % 2 === 0
    return <View style={{width: DEVICE_WIDTH, flex: 1}}>
      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          source={item.illustration}          
        />
      </View>
      <View style={{width: DEVICE_WIDTH, height: 170}}>
        <Text style={styles.title} >
          {item.title}
        </Text>
        <Text style={styles.subtitle} >
          {item.subtitle}
        </Text>
      </View>
    </View>;
  }

  render() {
    const { slider1ActiveSlide } = this.state;

    return (
      <Background>
        <View style = {styles.contentView}>
          {/* <View style={{flex: 1}} />
          <Image source={require('../assets/images/login/logo.png')} style={styles.logoImage} /> */}

          <View style={{width: DEVICE_WIDTH, flex: 1, marginBottom: 40}}>
            <Carousel
              ref={c => this._slider1Ref = c}
              data={ENTRIES}
              renderItem={this._renderItem}
              sliderWidth={sliderWidth}
              itemWidth={itemWidth}
              hasParallaxImages={false}
              firstItem={SLIDER_1_FIRST_ITEM}
              inactiveSlideScale={1}
              inactiveSlideOpacity={0.7}
              // inactiveSlideShift={20}
              containerCustomStyle={styles.slider}
              contentContainerCustomStyle={styles.sliderContentContainer}
              loop={true}
              loopClonesPerSide={2}
              autoplay={true}
              autoplayDelay={500}
              autoplayInterval={3000}
              onSnapToItem={(index) => this.setState({ slider1ActiveSlide: index }) }
            />

            <Pagination
              dotsLength={ENTRIES.length}
              activeDotIndex={slider1ActiveSlide}
              containerStyle={styles.paginationContainer}
              dotColor={'rgba(0, 0, 0, 1)'}
              dotStyle={styles.paginationDot}
              inactiveDotColor={'#1a1917'}
              inactiveDotOpacity={0.5}
              inactiveDotScale={0.9}
              carouselRef={this._slider1Ref}
              tappableDots={!!this._slider1Ref}
            />
          </View>

          <TouchableOpacity onPress={() => this.props.navigation.navigate('RegisterScreen1')} style={styles.registerButton}>
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>

          <View style={styles.loginView}>
            <Text style={styles.alreadyText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => this.props.navigation.navigate('LoginScreen')}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Background>
    );
  }
}

const styles = StyleSheet.create({
  contentView: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  logoImage: {
    width: DEVICE_WIDTH - 52.12 - 50.4,
    height: (DEVICE_WIDTH - 52.12 - 50.4) * 107/273,
    marginLeft: 52.12,
    marginRight: 50.4,
  },

  registerButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginBottom: 16,
    borderRadius: 28.5,
    backgroundColor: theme.colors.lightYellow,
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  registerText: {
    fontSize: 18,
    lineHeight: 25,
    color: 'white',
    fontFamily: 'Poppins-Medium',
  },

  loginView: {
    height: 25,
    marginBottom: 64,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  alreadyText: {
    fontSize: 18,
    lineHeight: 25,
    fontFamily: 'Poppins-Medium'
  },

  loginText: {
    marginLeft: 3,
    height: 40,
    paddingTop: 7,
    fontSize: 18,
    lineHeight: 25,
    color: theme.colors.primary,
    fontFamily: 'Poppins-Medium',
  },

  buttonFacility: {
    width: 250,
    height: 36,
    marginBottom: 28,  
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  textFacility: {
    fontSize: 18,
    lineHeight: 25,
    color: theme.colors.primary,
    fontFamily: 'Poppins-Medium'
  }, 

  iconImage: {
    width: 12,
    width: 12,
    marginLeft: 12,
    resizeMode: 'contain',
  },  

  slider: {
    marginTop: 0,
    overflow: 'visible' // for custom animations
  },

  sliderContentContainer: {
    paddingVertical: 0 // for custom animation
  },

  paginationContainer: {
    paddingVertical: 8,
  },

  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },

  imageContainer: {
    flex: 1,
    marginBottom: IS_IOS ? 0 : -1, // Prevent a random Android rendering issue
    // backgroundColor: 'blue',
    borderTopLeftRadius: entryBorderRadius,
    borderTopRightRadius: entryBorderRadius
  },

  image: {
    flex: 1,
    width: DEVICE_WIDTH,
    resizeMode: 'cover',
    // borderRadius: IS_IOS ? entryBorderRadius : 0,
    // borderTopLeftRadius: entryBorderRadius,
    // borderTopRightRadius: entryBorderRadius
  },

  title: {
    marginTop: 40,
    marginHorizontal: 40,

    textAlign: 'center',
    color: 'black',
    fontSize: 20,
    lineHeight: 26,
    fontFamily: 'Poppins-SemiBold',
    // letterSpacing: 0.5
  },

  subtitle: {
    marginTop: 8,
    marginHorizontal: 40,
    textAlign: 'center',
    color: 'black',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },

})

const mapStateToProps = ({ app, auth, chat, users }) => ({
  appReady: app.ready,
  loggedIn: auth.loggedIn,
  loading: auth.loading || chat.loading || users.loading,
})

const mapDispatchToProps = {
  connectAndSubscribe: chatConnectAndSubscribe,
  createUser: usersCreate,
  signIn: loginRequest,
  updateUser: usersUpdate,
}

export default connect(mapStateToProps, mapDispatchToProps)(StartScreen)