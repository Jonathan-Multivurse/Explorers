import React, { Component } from 'react'
import { View, StyleSheet, Platform, Image, Dimensions, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import { theme } from '../core/theme'

const DEVICE_WIDTH = Dimensions.get('window').width;

const FAQData = [
  {
    expand: false,
    title: "The kit has two bottles of adhesives. What can they be used on?",
    data: ["The adhesives are the primer 3M Scotch-Weld AC 79 (black round top) and the glue 3M Scotch-Weld PR40 (clear top). The adhesives can be applied on manikin skins, internal parts such as air hoses, tubes, and many more.", 
           "To correctly apply this adhesive:",
           "Use the primer first on a dry area and then apply the glue.",
           "Use gloves and/or a cotton swab and apply some adhesive to the application site. Whether that be skin or any internal tubes or parts.",
           "Wait until the adhesive on both sides is fully dry (it will be completely clear) and affix the two sides together.",
           "Additional adhesive may be used to secure the edges of the prosthetic, skin, tubes, parts etc."]
  },
  {
    expand: false,
    title: "The kit contains a multimeter. Is it safe to use?",
    data: ["Yes. A MeliSA ESR will provide instructions and guidance on how to use the device. Multimeters are tools used to measure multiple characteristics of electronics for your simulation equipment.  The most basic items measured are voltages and currents.",
  ]
  },
  {
    expand: false,
    title: "What happens if the software does not record or acknowledge shocks (defibrillation)?",
    data: ["Inspect the sternum defib plate and the apex defib plate. Make sure they are tightened. Replace defib plates if needed.", 
           "Check paddles. Good chance that the paddles are loose or worn out."]
  },
  {
    expand: false,
    title: "Can I replace a simulator battery?",
    data: ["Yes, any ESR can guide you with your assigned iPod and walk you through the process.", 
           "Some safety points to consider:",
           "Always keep the battery away from objects or materials with static electric charges.",
           "Batteries can be charged and used between 32˚F (0˚C) and 113˚F (45˚C). Do not exceed this temperature range.",
           "Do not use or charge the battery inside of a car where temperatures may exceed 176˚F (80˚C).",
           "If a simulator battery needs to be replaced, immediately remove the old battery from the equipment to ensure no damage occurs.",
           "Before disposing of a simulator battery, apply vinyl tape to its positive (+) and negative (-) terminals to avoid short circuits.",
           "Before disposing of a simulator battery, apply vinyl tape to its positive (+) and negative (-) terminals to avoid short circuits.",
           "If the simulator battery power diminishes significantly, contact MeLiSA ESR immediately to replace the battery.",
           "For safety, only replace the battery with an approved make and model."      
           ]
  },
  {
    expand: false,
    title: "What are the operating hours for the MeLiSA program?",
    data: ["Operating hours are usually during regular business hours. However, an ESR is available is 6 time zones. If an ESR is needed during evening hours, an arrangement can be accommodated by the customer’s request."]
  },
  {
    expand: false,
    title: "How to change Wi-Fi on SimPad?",
    data: ["Turn on SimPad PLUS.",
          "Connect SimPad and Simulator with cable.",
          "Select Simulator.",
          "Press and select connected simulator. Follow on-screen instructions.",
          "Select WiFi network.",
          "Press and select WiFi network.",
          "Enter Network Name and password.",
          "Look under the router to find the name of the network and the password.",
          "When the network is established, you can disconnect the network cable."]
  },
  {
    expand: false,
    title: "No chest rises on the manikin.",
    data: ["Check power and equipment. For high fidelity manikins, check air hoses and cables to the internal compressor.",
          "The SimMan 3G and the Simpad both have a power saver mode that will initiate after periods of inactivity.", 
          "The Simpad will have to be turned back on, but the 3G may have a pulse point depressed in order to wake it.", 
          "LLEAP allows you to do this from the software, and if an issue occurs a simple reboot of the manikin will resolve the issue.",
          "Simpad & LLEAP manikins capable of chest rise and fall will not “breathe” until session is started."]
  },
  {
    expand: false,
    title: "There is no resistance when ventilating?",
    data: ["Start at the cricoid and move to the bronchial tree to verify integrity.", 
          "Follow the esophagus to stomach and verify connections.", 
          "Follow bronchial tree to lung bladders and verify connectivity.",
          "Verify lung bladders inflate and do not deflate unless released.", 
          "Verify no leaks within any of the assemblies.", 
          "Activate lung resistance to verify that it may not be the lung bladders."]
  },
  {
    expand: false,
    title: "What happens if my iPod is not charged, or I have no Wi-Fi nor internet connection?",
    data: ["You can always use your cell phone (preferably with the Zoom application) to reach out to an ESR. Recommended that you have at least three ESR’s contact information.",
          "A wireless charging base station will be provided to maintain your device charge and on at all times. "]
  },
  {
    expand: false,
    title: "How to set up a SimMan 3G connection?",
    data: ["Make sure that the little white router inside the manikin’s torso is set to “AP” mode.",
          "Once the manikin is on (blinking/chest rise) look for the SSID “SimMan 3G” (SSID may vary depending on your set up) on your WIFI connection. Check the Wi-Fi connection (bottom right corner of your screen).",
          "Choose your SSID in this case “SimMan 3G”. It may ask for a password or a key. Use “SimMan3G”.", 
          "On the instructor PC, open LLEAP and look for Network Selector (it will have a WI-FI symbol as shown below).", 
          "Turn on PC and open Laerdal Simulation home. Then open Network Selector", 
          "Selection same Wi-Fi network and follow on-screen instructions.", 
          "Select “SimMan3G” or the SSID that correspond with your manikin."]
  },
]

export default class FAQScreen extends Component {
  constructor(props) {
    super(props)

    this.state = { 
      isLoading: false,
      isSearch: false,
      originalData: FAQData,
      filteredData: FAQData,
    }
  }

  searchFilter = (text) => {
    if (text) {
      const newData = this.state.originalData.filter(
        function(item){
          const itemData = item.title.toUpperCase()
          const textData = text.toUpperCase()
          return itemData.indexOf(textData) > -1
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

  expandOnRow = (item) => {
    var tmpData = this.state.filteredData
    const tmpindex = tmpData.indexOf(item)
    var item = tmpData[tmpindex]
    console.log(item)
    item.expand = !item.expand
    tmpData.splice(tmpindex, 1);
    tmpData.splice(tmpindex, 0, item);

    this.setState({
      filteredData : tmpData
    })       
  }

  render() {
    return (
      <Background>

        {this.state.isSearch ? 
          <View style = {styles.navigationView}>      
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
            <View style={{flex: 1}} />
            <TouchableOpacity onPress={() => {this.setState({isSearch : false, filteredData: this.state.originalData,})}} >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          : <View style = {styles.navigationView}>
              <Text style={styles.pageTitle}>FAQs</Text>
              <View style={{flex: 1}} />
              <TouchableOpacity style={styles.rightButton} onPress={() => {this.setState({isSearch : true})}}>
                <Image
                  style={styles.searchImage}
                  source={require('../assets/images/faqs/search_blue.png')}
                />
              </TouchableOpacity>
            </View>
        }

        <View style={styles.listView}>
          <FlatList                
            data={this.state.filteredData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
              <View style={styles.cellView}>
                <View style={styles.cellContentView}>

                  <View style={styles.contentView}>
                    <Text style={styles.titleText}>{item.title}</Text>
                    {item.expand == false ? 
                      <View /> :  
                      <View>
                      {item.data.map(
                        (dataTemp) => (<Text style={styles.dataText}>{dataTemp}</Text>)
                      )}
                    </View>
                    }
                  </View>

                  <TouchableOpacity style={styles.arrowButton} onPress={() => this.expandOnRow(item)} >
                    <Image
                      style={styles.arrowImage}
                      source={item.expand == false ? require('../assets/images/faqs/arrow_down.png'): require('../assets/images/faqs/arrow_up.png')}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
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
    paddingTop: 17,
  },

  searchImage: {
    width: 16,
    height: 16,
  },

  searchView: {
    width: DEVICE_WIDTH - 104,
    height: 45,    
    marginLeft: 14,
    borderRadius: 22.5,    
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',
  },

  searchInput:{
    flex: 1,
    marginLeft: 14,
  },

  cancelText: {
    height: 45,
    marginRight: 16,
    paddingTop: 12,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',   
    color: theme.colors.primary,
  },

  listView: {
    flex: 1,
  },

  cellView: {
    width: DEVICE_WIDTH,
  },

  cellContentView: {    
    flex: 1,
    marginHorizontal: 14,
    marginVertical: 6,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
  },

  contentView: {
    flex: 1,
    marginLeft: 12,
    marginTop: 12,
    marginBottom: 12,
    justifyContent: 'flex-start',    
  },

  titleText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium', 
    paddingRight: 35,
  },

  dataView: {
    marginLeft: 12,
    marginTop: 12,
    marginBottom: 12,
    justifyContent: 'flex-start',
  },

  dataText:{
    marginTop: 10,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.sectionText
  },

  arrowButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 50,
    height: 50,
    paddingLeft: 22,
    paddingTop: 18,
  },

  arrowImage: {
    width: 16,
    height: 10,
    resizeMode: 'stretch'
  },
  
})