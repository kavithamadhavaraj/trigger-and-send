var SOKT_ERR_URL = 'URL TO POST ERRORS';
var SOKT_NEW_USER_URL = 'URL TO NOTIFY IF ANY NEW USERS LOGIN';
var SOKT_DATA_SAVED = 'URL TO NOTIFY IF ANY DATA IS SAVED';
//get User email
var USER = Session.getEffectiveUser().getEmail();
var Logger = Logger;

function getUserData(){
  obj = {};
  obj.email = Session.getActiveUser().getEmail();
  obj.efctUser = Session.getEffectiveUser().getEmail();
  obj.reason = "on page load";
  Logger.log(USER +" : " + JSON.stringify(obj));
  return JSON.stringify(obj);
}

// Adds a custom menu to the active form to show the add-on sidebar
function onOpen(e) { 
  var ui = SpreadsheetApp.getUi().createAddonMenu();
  ui.addItem('Configure', 'showSidebar')
  .addItem('About', 'showAbout')
  .addToUi();   
}

function onInstall(e){
  onOpen(e);
  freshStart();
  //Deprecated -- KAVITHA
  //safeguardAutoChangeInit();
  //safeguardScheduleInit();
  //safeguardAutoFormSubmitInit();
  getUserDetail();
}
function include(filename) {  
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getUserDetail(){
  var USER = Session.getEffectiveUser().getEmail();
  obj = {};
  obj.email = USER;
  obj.efctUser = Session.getEffectiveUser().getEmail();
  obj.reason = "Addone installed";
  //Commented for testing purposes. Un-comment it for production -- KAVITHA
  hitApi(SOKT_NEW_USER_URL, JSON.stringify(obj));
}

function showAbout() {
  loadPage("about","About");
}

/**
 * Opens a sidebar in the form containing the add-on's user interface for
 * configuring the notifications this add-on will produce.
 */
function showSidebar() {
    //USE YOUR LOG SPREADSHEET'S ID
    Logger = useSpreadsheet('myID',"Trigger and Send Logs");  
    loadPage("home","Trigger & Send");
}

function loadPage(page,title) {
    var html = HtmlService.createTemplateFromFile(page)
            .evaluate()
            .setSandboxMode(HtmlService.SandboxMode.IFRAME)
            .setTitle(title)
            .setWidth(800);  
    SpreadsheetApp.getUi().showSidebar(html);      
}

/*
alerts and dialogs
*/
function showDialog(str) {
  Browser.msgBox(str);
}
function showAlert(message, title){
  SpreadsheetApp.getActiveSpreadsheet().toast(message, title);
}

/*
 @hit api
 @url = url to hit
 @data = data which has to post
*/

function hitApi(url, data, showAlertBool) {
  var options, response, headers;
  headers = {
    'Content-Type': 'application/json',
  }
  options = {
    'method': 'post',
    'headers': headers,
    "payload" : data, 
    
  };
  //Better way of catching the API responses -- BEGIN - KAVITHA
  var response;
  if (response = UrlFetchApp.fetch(url, options)){
    Logger.log(USER +" : " + "Success");
    if (showAlertBool == null) {
       showAlert(response, "Success");
    }
    return "Success";
  }else{
    //TODO: Uncomment it based on production requirement -- KAVITHA
    //postFailureReason("API Call failure","No Response from the Target")
    Logger.log(USER +" : " + "No Response");
    return "Failure";
  }
  //Better way of catching the API responses -- END - KAVITHA

}

function postFailureReason(type, err){
  var USER = Session.getEffectiveUser().getEmail();
  obj = {};
  obj.email = USER;
  obj.efctUser = Session.getEffectiveUser().getEmail();
  obj.reason = err;
  obj.type = type;
  hitApi(SOKT_ERR_URL, JSON.stringify(obj));
}

/*
@ delete trigger by event type
*/
function deleteTrigger(type){
  var triggers = ScriptApp.getProjectTriggers();  
  for (var i = 0; i < triggers.length; i++) {
    if (type === 'ON_EDIT'){
      ScriptApp.deleteTrigger(triggers[i]);
      deletePropertyBy(['changeObj']);
      break;
    }
    else if (type === 'ON_FORM_SUBMIT'){
      ScriptApp.deleteTrigger(triggers[i]);
      deletePropertyBy(['formSubmtObj']);
      break;
    }
    //Added support to Schedule -- KAVITHA
    else if (type === 'ON_SCHEDULE'){
      ScriptApp.deleteTrigger(triggers[i]);
      deletePropertyBy(['scheduleObj']);
      break;
    }
    else{
      Logger.log(USER +" : " + "Nothing to delete. No condition match!");
    }
  }
}

function freshStart(){
  Logger.log(USER +" : " + "freshStart");
  deleteTriggerByManually();
  delProps();
  showSidebar();
}

function delProps(){
  // Set a property in each of the three property stores.
  var up = PropertiesService.getScriptProperties();
  var sp = PropertiesService.getUserProperties();
  var dp = PropertiesService.getDocumentProperties();
  up.deleteAllProperties();
  sp.deleteAllProperties();
  dp.deleteAllProperties();
  Logger.log(USER +" : " + "deleted props happily");
}

function deleteTriggerByManually() {
  Logger.log(USER +" : " + "in deleteTriggerByManually"); 
  // Loop over all triggers and delete it
  //Added support to Schedule -- KAVITHA
  deletePropertyBy(['changeObj','changeEventRow','changeEventData','changeEventURL', 'scheduleObj']);
  var allTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < allTriggers.length; i++) {
    ScriptApp.deleteTrigger(allTriggers[i]);
  }
    Logger.log(USER +" : " + allTriggers.length);
  Logger.log(USER +" : " + "deleted all trigggers happily");
}


function deleteTriggerById(triggerId) {
  Logger.log(USER +" : " + "in deleteTriggerById");
  Logger.log(USER +" : " + triggerId);
  
  // Loop over all triggers.
  var allTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < allTriggers.length; i++) {
    // If the current trigger is the correct one, delete it.
    if (allTriggers[i].getUniqueId() == triggerId) {
      Logger.log(USER +" : " + "trigger deleted happily!");
      ScriptApp.deleteTrigger(allTriggers[i]);
      break;
    }
  }
}

function getLocData(key){
  DC = PropertiesService.getDocumentProperties();
  return DC.getProperty(key);
}

//get whole sheet data
function getDataWholeSheet() {
  var sheet, data;
  sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  data = sheet.getDataRange().getValues();
  return data;
}

//Utility to get the header data -- KAVITHA
function getHeader() {
  var sheet, data;
  sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  data = sheet.getDataRange().getValues()[0];
  return data;
}

function arrToObject (arr){
  
  //assuming header
  var keys = arr[0];
  //vacate keys from main array
  var newArr = arr.slice(1, arr.length);
  
  var formatted = [],
      data = newArr,
      cols = keys,
      l = cols.length;
  
  for (var i=0; i<data.length; i++) {    
    var d = data[i], o = {}; 
    //Set a flag that denotes the valid row - Kavitha - BEGIN
    var validRow = false;
    for (var j=0; j<l; j++){    
      if((d[j] !== null)  && (d[j] !== "") && (d[j] !== undefined)){
        validRow = true;
      }
      var key = checkKeyStr(cols[j]);
      o[key] = d[j];
    }
      Logger.log(USER +" : " + validRow);

    if(validRow)
      formatted.push(o);
    else{
      Logger.log(USER +" : "+ "Empty Row. Ignoring..");
    }
    //Set a flag that denotes the valid row - Kavitha - END
  }
  return formatted;
}

function checkKeyStr(str){
  str = (str.toString()).replace(" ", "_")
  return str.replace(/([~!@#$%^&*()+=`{}\[\]\|\\:;'<>,.\/? -])+/g, '');
}