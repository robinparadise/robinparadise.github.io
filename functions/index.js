const functions = require("firebase-functions");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((req, res) => {
//   res.set('Cache-Control', 'public, max-age=60, s-maxage=120');
//   res.send("Hello from Firebase!");
// });

exports.ssr = functions.https.onRequest((req, res) => {
  console.log(req.path)
  res.send("Hello from Firebase!");
})