function safeguardAutoFormSubmitInit(){
  var id = getLocData('triggerId');
  var url = getLocData('hUrl');
  if (id && url){
    var obj = {
      id: id,
      URL: url
    };
    var PROP = PropertiesService.getDocumentProperties();
    PROP.setProperty('formSubmtObj', JSON.stringify(obj));
    deleteTriggerById(parseInt(id));
    deletePropertyBy(['triggerId', 'hUrl']);
    
    o = obj;
    o.reason = "data Saved form submit event";
    o.user = Session.getEffectiveUser().getEmail();
    hitApi(SOKT_DATA_SAVED, JSON.stringify(o));
  }  
}


function getUserFormTriggers(){
  return getLocData('formSubmtObj');
}

function test(){
  Logger.log(USER +" : " +ScriptApp.getProjectTriggers());
  Logger.log(USER +" : " +getLocData('changeObj'));
  Logger.log(USER +" : " +getLocData('formSubmtObj'));
  //deletePropertyBy(['formSubmtObj', 'changeObj']);
  //deletePropertyBy(['triggerId', 'hUrl']);
  //Logger.log(USER +" : " +Session.getEffectiveUser().getEmail());
  //Logger.log(USER +" : " +Session);
}


function autoFormSubmitInit(url) {
  
  /*delete triggers and property*/
  var data = getLocData('formSubmtObj');
  if (data){
    data = JSON.parse(data);
    deleteTriggerById(parseInt(data.id));
    deletePropertyBy(['formSubmtObj']);
  }
  
  var sheet = SpreadsheetApp.getActive();
  var id = ScriptApp.newTrigger('autoFormSubmitTrig').forSpreadsheet(sheet).onFormSubmit().create().getUniqueId();
  
  var obj = {
    id: id,
    URL: url
  };
  var DC = PropertiesService.getDocumentProperties();
  DC.setProperty('formSubmtObj', JSON.stringify(obj));
  
  //validate first and then send message
  showDialog("Event Created successfully.");
}

function autoFormSubmitTrig(e){
  try {
    var rowIndex = e.range.getRowIndex();
    var sheet = e.source.getSheetByName(e.source.getSheetName());
    var rawData = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
    var data = JSON.stringify(formatRowData(sheet, rawData));
    var o = getUserFormTriggers();
    o = JSON.parse(o);
    hitApi(o.URL, data);
  } catch(e) {
    postFailureReason("autoFormSubmitTrigFailure", e);
  } 
}


// data = [val1, val2, val3]
function formatRowData(sheet, data){
  //assuming 1st row as column header
  var keys = sheet.getRange(1, 1 , 1, sheet.getLastColumn()).getValues()[0],
      formattedRow = {};
      
  for (var i=0; i<keys.length && i<data.length; i++) {
    var key = checkKeyStr(keys[i]);
    formattedRow[key] = data[i];
  }
  
  // returns { "key1": "val1", "key2": "val2", "key3": "val3" }
  return formattedRow;  
}
