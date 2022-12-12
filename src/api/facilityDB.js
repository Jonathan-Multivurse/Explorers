import auth, {firebase} from "@react-native-firebase/auth"
import firestore from '@react-native-firebase/firestore'

const facilityCollection = firestore().collection('facility');

const FACILITY_DB = {
  addFacility: async (title, userAction) => {      
    
    const docid = facilityCollection.doc().id

    facilityCollection
    .doc(docid)
    .set({
        title: title,
        facilityid: docid,
        date: new Date().getTime()
    })
    .then(() => {
        userAction()
    })
  },

  getFacility: async (docID, userAction) => {
    facilityCollection
      .doc(docID)
      .get()
      .then((documentSnapshot) => {
        console.log('Got Facility');
        userAction(documentSnapshot.data())
      });        
  },

  getTargetFacilities: async (docIDs, userAction) => {
    facilityCollection
      .where('facilityid', 'in', docIDs)
      .get()
      .then((querySnapshot) => {
        const facilities = []
        querySnapshot.forEach(documentSnapshot => {
          facilities.push({...documentSnapshot.data()})
        });

        facilities.sort(function(first, second)  {
          const fTitle = first.title.toUpperCase()
          const sTitle = second.title.toUpperCase()
          if (fTitle < sTitle) {
            return -1;
          }
          if (fTitle > sTitle) {
            return 1;
          }
          return 0;
        })

        console.log("Facilities ===>", facilities[0])
        
        userAction(facilities)
      });        
  },

  updateDFacility: async (docID, values, userAction) => {   
    facilityCollection
    .doc(docID)
    .update(values)
    .then(() => {
        console.log('Facility updated!');
        userAction()
    });        
  },

  deleteFacility: async (docID, userAction) => {   
    facilityCollection
    .doc(docID)
    .delete()
    .then(() => {
      console.log('Facility deleted!');
      userAction()
    });        
  },

  getFacilities: async (userAction) => {
    facilityCollection
      .orderBy('title')
      .get()
      .then(querySnapshot => {
        
        const facilities = []
        querySnapshot.forEach(documentSnapshot => {
          facilities.push({...documentSnapshot.data()})
        });

        facilities.sort(function(first, second)  {
          const fTitle = first.title.toUpperCase()
          const sTitle = second.title.toUpperCase()
          if (fTitle < sTitle) {
            return -1;
          }
          if (fTitle > sTitle) {
            return 1;
          }
          return 0;
        })
        
        userAction(facilities)
    });      
  },   
  
  getSimulators: async ( docID, userAction) => {
    facilityCollection
    .doc(docID)
    .get()
    .then(documentSnapshot => {

      console.log('Facility exists: ', documentSnapshot.exists);
      
      var simulators = []
      
      if (documentSnapshot.data().simulators) {
        simulators = documentSnapshot.data().simulators
      }

      if (simulators.length == 0) {
        simulators = [
          {make: 'Laerdal', model: 'SimMan 3G'},
          {make: 'Laerdal', model: 'SimBaby Classic'},
          {make: 'Laerdal', model: 'SimBaby'},
          {make: 'Laerdal', model: 'SimJunior'},
          {make: 'Laerdal', model: 'SimNewB'}
        ];
      } 
  
      userAction(simulators)
    });      
  },
};

export default FACILITY_DB;