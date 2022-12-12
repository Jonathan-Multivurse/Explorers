import React, { Component } from 'react'
import { View, StyleSheet, Image, Dimensions, Text, Platform, SectionList, Alert, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal, Keyboard} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import Dialog from "react-native-dialog";
import {firebase} from "@react-native-firebase/auth"
import { theme } from '../core/theme'
import FACILITY_DB from '../api/facilityDB'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class FacilityScreen extends Component {
  constructor(props) {
    super(props)
    this._unsubscribeFocus = null;

    this.state = { 
      isLoading: false,   
  
      email: this.props.route.params.email,
      isFromRegister: this.props.route.params.isFromRegister,
      currentFacilityIds: this.props.route.params.currentFacilityIds,
      selectedFacilityIds: [], 
            
      alertVisible: false,
      verifyText: '',

      modalVisible: false,
      description: '',
      keyboardHeight: 0,
      originalData:[],
      filteredData:[]
    }
  }

  componentDidMount() {
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.getFacitlities();
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

  getFacitlities = () => {            
    this.setState({
      isLoading: true,
    });

    FACILITY_DB.getFacilities(this.onGetFacilities)         
  }

  onGetFacilities = (facilities) => {   
    this.setState({
      isLoading: false,
      originalData: facilities,
      filteredData: facilities
    })   
  }

  searchFilter = (text) => {
    if (text) {
      const newData = this.state.originalData.filter(
        function(item) {
          var flag = false
          
          const titleData = item.title.toUpperCase()          
          const textData = text.toUpperCase()
          if (titleData.indexOf(textData) > -1) {
            flag = true
          }
          
          if (item.branch && item.branch.length > 0 ) {
            const branchData = item.branch
            branchData.forEach(branch => {
              const nameData = branch.name.toUpperCase()
              if (nameData.indexOf(textData) > -1) {
                flag = true
              }
            })
          } 

          return flag
        }
      )
      this.setState({
        filteredData: newData,
      })
    } else {
      this.setState({
        filteredData: this.state.originalData,
      })
    }
  } 

  selectItem = (branch, facility) => {
        
    var tmpFlag = false
    if (this.state.isFromRegister) {
      tmpFlag = false
    } else {      
      this.state.currentFacilityIds.forEach(faciltiyData => {  
        console.log("Faciltiy Data ===>", faciltiyData, facility)
        if (faciltiyData.facility == facility.facilityid ) {
          tmpFlag = true
        }      
      }) 
    }

    if (!tmpFlag) {
      this.setState({
        alertVisible: true,
        verifyText: '',
        tmpFacility: facility,
        tmpBranch: branch
      })
    } else {
      this.addToRequestFacilty(branch, facility)
    }
  }

  handleCancel = () => {
    this.setState({alertVisible: false})
  }

  handleVerify = () => {
    if (this.state.verifyText == this.state.tmpFacility.facilityCode) {
      this.setState({alertVisible: false})
      this.addToRequestFacilty(this.state.tmpBranch, this.state.tmpFacility)
    } else {
      Alert.alert(
        "Error!",
        `Invalid Code.`,
        [
          {
            text: "Ok",
          },
        ],
        { cancelable: false }
      );
    }    
  }

  addToRequestFacilty = (branch, facility) => {
    // var newIDs = this.state.selectedFacilityIds

    // if (newIDs.includes(item.facilityid)){
    //   const tmpIndex = newIDs.indexOf(item.facilityid)
    //   newIDs.splice(tmpIndex, 1);
    // } else {
    //   newIDs.push(item.facilityid)
    // }

    var newIDs = []
    newIDs.push({
      'branch': branch.name,
      'facility': facility.facilityid,
      'access': 'single'
    })
    this.setState({
      selectedFacilityIds: newIDs
    })
  }

  onProceed = () => {
    this.setState({
      modalVisible: true, 
      description: ''
    })
  } 

  onSendRequest = () => {
    if (this.state.description == '') {
      Alert.alert(
        "Warning",
        `Please type message for this request.`,
        [
          {
            text: "Ok",
          },
        ],
        { cancelable: false }
      );
      return
    } else {
      this.setState({
        isLoading: true,
        modalVisible: false
      })

      const userID = firebase.auth().currentUser.uid;
      fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/requestFacility', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userid: userID,
          message: this.state.description,
          requestFacility: this.state.selectedFacilityIds
        }),
      })
      .then((response) => response.json())
      .then((responseJson) => {        
        if (responseJson.statusCode !== 200) {
          console.log("Response ====>", responseJson)   
          return;
        }      
        
        this.setState({
          isLoading: false,
        })
    
        this.props.navigation.goBack()
      })
      .catch((err) => {        
      });        
    }    
  }

  isInclude = (branch, facilityId) => {    
    var flag = false
    if (this.state.currentFacilityIds.length > 0) {
      this.state.currentFacilityIds.forEach(facility => {
        if (facility.branch == branch.name && facility.facility == facilityId){
          flag = true
        }
      })
    }

    if (this.state.selectedFacilityIds.length > 0) {
      this.state.selectedFacilityIds.forEach(facility => {
        if (facility.branch == branch.name && facility.facility == facilityId){
          flag = true
        }
      })
    }
    return flag
  }

  render() {
    var facilityData = [];
    if (this.state.filteredData.length > 0 ) {
      this.state.filteredData.forEach(facilityItem =>
        {
          facilityData.push({
            facility: facilityItem,
            data: facilityItem.branch,
          })
        }
      )
    }   

    return (      
      <Background>
        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            this.setState({ modalVisible: false })   
          }}
        >
          <View style={styles.centeredView}>

            <View style={{flex: 1}}/>
            <View style = {styles.modalView}>
              <ScrollView> 

                <View style={styles.titleView}>
                  <View style={{flex: 1}}/>
                  <Text style={styles.editPText}>Review Selection</Text>
                  <View style={{flex: 1}}/>

                  <TouchableOpacity style={styles.closeView} onPress={() => this.setState({ modalVisible: false })} >
                    <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                  </TouchableOpacity>
                </View> 

                <Text style={styles.descriptionText}>To change or add the facility, you have to request access from admin.</Text>     

                <Text style={styles.selectText}>Facilities you can access</Text>
                <View style={{flexDirection: 'row', alignContent: 'flex-start', justifyContent: 'flex-start', flexWrap: 'wrap'}}>
                  {this.state.originalData.length > 0 && this.state.currentFacilityIds.map((facilityData, index) =>  (
                    <View style={styles.detailView} key={index}>
                      <Text style={styles.detailText}>{this.state.originalData.filter(element => element.facilityid === facilityData.facility)[0].title} - {facilityData.branch}</Text>
                    </View>
                    )
                  )}                  
                </View>                               

                <Text style={styles.selectText}>Request access for</Text>
                <View style={{flexDirection: 'row', alignContent: 'flex-start', justifyContent: 'flex-start', flexWrap: 'wrap'}}>
                  {this.state.originalData.length > 0 && this.state.selectedFacilityIds.map((facilityData, index) =>  (
                    <View style={styles.detailView} key={index}>
                      <Text style={styles.detailText}>{this.state.originalData.filter(element => element.facilityid === facilityData.facility)[0].title} - {facilityData.branch}</Text>
                    </View>
                    )
                  )} 
                </View>

                <View style={{flexDirection: 'row'}}>
                  <Text style={styles.selectText}>Add a message</Text>
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

                <TouchableOpacity style={{...styles.loginButton, marginBottom: this.state.keyboardHeight + 57}} onPress={() => this.onSendRequest()}>
                  <Text style={styles.loginText}>Request Admin</Text>
                </TouchableOpacity>
              </ScrollView>  
            </View>
          </View>
        </Modal>

        <View style = {styles.navigationView}>  
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Select your Facility/Branch</PageTitle>
        </View>

        <View style={styles.listView}>
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

          {/* <FlatList
            style={{marginTop: 16, flex: 1}}
            data={this.state.filteredData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item, index}) => (            
              <TouchableOpacity style={styles.cellContentView} onPress={() => this.selectItem(item)}>
                <View style={styles.contentView}>
                  <Text style={styles.nameText}>{item.title}</Text> 
                  <View style={{flex: 1}}/>   
                   {this.state.currentFacilityIds.includes(item.facilityid) || this.state.selectedFacilityIds.includes(item.facilityid) ? <Image source={require('../assets/images/message/check.png')} style={styles.checkmarkRead} />  : <View/>}
                </View>
              </TouchableOpacity>             
            )}
          />  */}

          <SectionList
            sections={facilityData}
            keyExtractor={(item, index) => item + index}
            renderSectionHeader={({ section: {facility} }) => (
              <View style = {styles.sectionView}>
                <Text style={styles.sectionText}>{facility.title}</Text>
              </View>
            )}
            renderItem={({item, section}) => (
              <TouchableOpacity style={{...styles.cellContentView, borderColor: this.isInclude(item, section.facility.facilityid) ? theme.colors.primary : theme.colors.inputBar }} onPress={() => this.selectItem(item, section.facility)}>
                <View style={styles.contentView}>
                  <Text style={styles.nameText}>{item.name}</Text> 
                  <View style={{flex: 1}}/>
                  {this.isInclude(item, section.facility.facilityid) ? <Image source={require('../assets/images/message/check.png')} style={styles.checkmarkRead}/> : <View/>}
                </View>
              </TouchableOpacity>
            )}  
          /> 

          <TouchableOpacity style={{...styles.doneButton, backgroundColor: this.state.selectedFacilityIds.length == 0 ? theme.colors.disabledYellow : theme.colors.lightYellow}} onPress={() => this.onProceed()}>
            <Text style={styles.doneText}>Proceed</Text>
          </TouchableOpacity>
        </View>  

        <Dialog.Container visible={this.state.alertVisible} onBackdropPress={this.handleCancel}>
          <Dialog.Title>Enter Facility Code</Dialog.Title>
          <Dialog.Description>
            Please enter the facility code to verify the authorization.
          </Dialog.Description>
          <Dialog.Input 
            value={this.state.verifyText}
            onChangeText={(text) => this.setState({verifyText: text})}
            keyboardType="default"
            placeholder="Facility Code"
            />            
          <Dialog.Button label="Cancel" onPress={this.handleCancel} />
          <Dialog.Button label="Verify" bold={true} onPress={this.handleVerify}/>
        </Dialog.Container>

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

  searchView: {
    width: DEVICE_WIDTH - 32,
    height: 42,  
    marginTop: 12,  
    marginBottom: 12,
    marginLeft: 16,
    borderRadius: 16,    
    backgroundColor: theme.colors.searchBar,
    flexDirection: 'row',
  },
  
  searchInput:{
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
    
  listView: {
    height: Platform.OS === 'ios' ? DEVICE_HEIGHT - 60 - getStatusBarHeight() : DEVICE_HEIGHT - 66,
    width: DEVICE_WIDTH,
  },

  sectionView: {
    width: DEVICE_WIDTH,
    height: 36,
    backgroundColor: 'white',
  },

  sectionText: {    
    paddingLeft: 16,
    paddingTop: 14,    
    fontSize: 16,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',      
    color: theme.colors.sectionHeader,
  },

  cellContentView: {    
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,
    marginRight: 16,
    marginTop: 3,
    marginBottom: 3,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: theme.colors.inputBar,
  },
  
  contentView: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    marginTop: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexDirection: 'row'
  },

  nameText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',     
  },

  checkmarkRead: {
    marginTop: 4, 
    marginRight: 8,
    width: 16,
    height: 12,
    resizeMode: 'cover',
    tintColor: theme.colors.primary,
  },

  doneButton: { 
    position: 'absolute',
    width: DEVICE_WIDTH - 48,
    height: 57,
    left: 24,
    bottom: 43,
    borderRadius: 28.5,
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

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },

  titleView : {    
    width: DEVICE_WIDTH,
    height: 72,
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2'
  },
  
  editPText: {
    marginTop: 24,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',
  },

  closeView: {
    position: 'absolute',
    right: 10,
    top: 10,
    height: 50,
    width: 50,
  },

  coloseImage: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 44,
    height: 44,
  },

  descriptionText: {
    alignSelf: 'flex-start',
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,   
    marginTop: 12,  
    
    fontSize: 13,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.lightGray,  
  },  
  
  selectText: {
    marginTop: 12,
    paddingLeft: 16,
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'Poppins-Medium', 
    alignSelf: 'flex-start',
  },

  detailView: {
    height: 28,
    marginLeft: 16,
    marginTop: 8,
    paddingLeft: 12, 
    paddingRight: 12, 
    borderRadius: 14,
    alignItems: 'center', 
    backgroundColor: theme.colors.inputBar
  },
 
  detailText: {
    marginTop: 4,
    fontSize: 15, 
    lineHeight: 22, 
    fontFamily: 'Poppins-Regular', 
    textAlign: 'left',     
  },

  countText:{
    marginTop: 12,
    marginRight: 16,
    paddingLeft: 16,
    fontSize: 18,
    lineHeight: 30,
    
    fontFamily: 'Poppins-Medium', 
    alignSelf: 'flex-start',
    color: theme.colors.lightGray,
  },

  emailInput: {
    height: 90,
    width: DEVICE_WIDTH - 32,
    marginTop: 6,
    marginLeft: 16,
    borderRadius: 10,
    backgroundColor: theme.colors.inputBar,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 20,
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
    elevation: 5
  },

  loginText: {
    fontSize: 18,
    lineHeight: 25,
    color: 'white',
    fontFamily: 'Poppins-Medium',
  },

  

}) 