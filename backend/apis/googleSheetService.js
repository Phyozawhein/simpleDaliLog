
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd()+'/token.json');
const CREDENTIALS_PATH = path.join(process.cwd()+'/credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
     
    async function authorize(scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']) {
      
        let client = await loadSavedCredentialsIfExist();
        if (client) {
          return client;
        }
        client = await authenticate({
          scopes,
          keyfilePath: CREDENTIALS_PATH,
        });
        if (client.credentials) {
          await saveCredentials(client);
        }
        return client;
      }
      
      async function listPackages(auth){
        const sheets = google.sheets({version: 'v4', auth});
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: '1Rjbq_DBlU62ZuF10kMQj5rnFyAltlMxfrMLmSiY2mCE',
          range: 'Sheet3!A2:B',
        });
        return res.data.values;
      }
      
      async function getLoginData(auth){
        const sheets = google.sheets({version: 'v4', auth});
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: '1Rjbq_DBlU62ZuF10kMQj5rnFyAltlMxfrMLmSiY2mCE',
          range: 'Sheet2!A1:B',
        });
        const row = res.data.values[0];
        
        return {email:row[0], password:row[1]}
      }


      async function authLogin(){
        const data = await authorize().then(getLoginData)
        return data
      }

      async function getInventory(){
        const data= await authorize(['https://www.googleapis.com/auth/spreadsheets']).then(listPackages)
       
        return data
      }

      async function updateList(auth,payload ) {
        const sheets = google.sheets({version: 'v4', auth});
        const data = sheets.spreadsheets.values.update(
          {
            auth: auth,
            spreadsheetId: '1Rjbq_DBlU62ZuF10kMQj5rnFyAltlMxfrMLmSiY2mCE',
            range: "Sheet3!A2:B",
            valueInputOption: "USER_ENTERED",
            resource: {values: payload},
          }
        );
        return data;
      }
      async function updatePackageList (payload){
        const data = await authorize().then((auth)=>updateList(auth,payload))
        return data
      }

      
module.exports = {
  getInventory: getInventory,
  authLogin: authLogin,
  updatePackageList : updatePackageList,
}