import auth, {firebase} from "@react-native-firebase/auth"
import firestore from '@react-native-firebase/firestore'

const usersCollection = firestore().collection('users');
const ratingCollection = firestore().collection('rating');

const USER_DB = {
  addUser: async (userID, email, password, firstName, lastName, token, facility, QBId, userAction) => {
       
    usersCollection
    .doc(userID)
    .set({
      userid: userID,
      email: email,
      firstname: firstName,
      lastname: lastName,
      password: password,
      type: 'customer',
      facility: facility,
      token: token,
      QBId: QBId,
      image: '',
    })
    .then(() => {
      userAction()
    })
  },

  isCustomerProfile: async (userID, success, failed) => {
    console.log(userID);

    usersCollection
    .doc(userID)
    .get()
    .then(documentSnapshot => {
        console.log('User exists: ', documentSnapshot.exists);

        if (documentSnapshot.exists) {
          if (documentSnapshot.data()['type'] === 'customer') {
            success()
          } else{
            failed()
          }
        }
    });
  },

  updateUser: async (docID, values) => {
    console.log(docID);
    
    usersCollection
    .doc(docID)
    .update(values)
    .then(() => {
        console.log('User updated!');
    });        
  },

  updateProfile: async (values, userAction) => {
    const userID = firebase.auth().currentUser.uid;

    usersCollection
    .doc(userID)
    .update(values)
    .then(() => {
        console.log('User updated!');
        if (userAction != null) {
          userAction()
        }        
    });        
  },

  getProfile: async (userAction) => {
    const userID = firebase.auth().currentUser.uid;

    usersCollection
      .doc(userID)
      .get()
      .then(documentSnapshot => {
        console.log('User exists: ', documentSnapshot.exists);

        if (documentSnapshot.exists) {
            userAction(documentSnapshot.data())
        }
    });      
  },

  getUserProfile: async(userID, userAction) => {
    console.log("user id = ", userID);

    usersCollection
      .doc(userID)
      .get()
      .then(documentSnapshot => {
        if (documentSnapshot.exists) {
            userAction(documentSnapshot.data())
        }
    });  
  },

  getRating: async (userId, userAction) => {
    ratingCollection
    .doc(userId)
    .get()
    .then(ratingSnapshot => {

      console.log('Rating exists: ', ratingSnapshot.exists);

      if (ratingSnapshot.exists) {
        userAction(ratingSnapshot.data())
      } else {
        userAction(null)
      }      
    }) 
  },
    
};

export default USER_DB;