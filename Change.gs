function deletePropertyBy(arr){
  var DC = PropertiesService.getDocumentProperties();
  for (var i = 0; i < arr.length; i++) {
    DC.deleteProperty(arr[i]);
  }
}

function getUserChangeTriggers(){
  var changeObj = getLocData('changeObj');
  var DOC_PROP = PropertiesService.getDocumentProperties();
  var row = DOC_PROP.getProperty('changeEventRow');
  var update = DOC_PROP.getProperty('update');
  if(changeObj && update === null){
    changeObj = JSON.parse(changeObj);
    deleteTriggerById(parseInt(changeObj.id));
    var sheet = SpreadsheetApp.getActive();
    var id = ScriptApp.newTrigger('autoChangeTrig').forSpreadsheet(sheet).onEdit().create().getUniqueId();
    changeObj.id = id;
    DOC_PROP.setProperty('changeObj', JSON.stringify(changeObj));
    DOC_PROP.setProperty('update', true);
  }
  changeObj = getLocData('changeObj');
  return changeObj;
}

function autoChangeInit(url) {
  Logger = useSpreadsheet('YOUR LOG SPREADSHEET ID',"Trigger and Send Logs");  
  Logger.log(USER +" : " +"Trigger created");
  /*delete triggers and property -- KAVITHA */
  var data = getLocData('changeObj');
  Logger.log(USER +" : " +data);
  if (data){
    data = JSON.parse(data);
    deleteTriggerById(parseInt(data.id));
    deletePropertyBy(['changeObj','changeEventRow','changeEventData']);
  }
  
  var sheet = SpreadsheetApp.getActive();
  var id = ScriptApp.newTrigger('autoChangeTrig').forSpreadsheet(sheet).onEdit().create().getUniqueId();
  
  var obj = {
    id: id,
    URL: url
  };
  Logger.log(USER +" : " +obj)
  var DC = PropertiesService.getDocumentProperties();
  DC.setProperty('changeObj', JSON.stringify(obj));
  Logger.log(USER +" : " +DC.getKeys())
  //validate first and then send message
  showDialog("Event Created successfully.");
}

//Wait for 20 seconds before sending change data - BEGIN - KAVITHA
function delayChangeEvent(){
  try{
    var DOC_PROP = PropertiesService.getDocumentProperties();
    Utilities.sleep(20000);
    Logger.log(USER +" : " + "Sending data...");      
    rowData =  DOC_PROP.getProperty('changeEventData');
    changeObj = DOC_PROP.getProperty('changeObj');
    Logger.log(USER +" : " + changeObj);
    if(changeObj !== null && changeObj !== undefined && changeObj !== "")
      url =  (JSON.parse(changeObj)).URL;
    
    if((rowData !== null) && (url !== null)){
        hitApi(url, rowData);
        DOC_PROP.deleteProperty('changeEventURL');
        DOC_PROP.deleteProperty('changeEventRow');
        DOC_PROP.deleteProperty('changeEventData');
        Logger.log(USER +" : " +"API Called");     
      }
  }
  catch(e) {
    postFailureReason("changeEventTriggerFailure", e);
  } 
}
//Wait for 20 seconds before sending change data - END KAVITHA


//MODIFIED changeEvent -- BEGIN - KAVITHA
function autoChangeTrig(e){  
  try {
    var data, range, header, rowNum, row, obj, o;
    Logger = useSpreadsheet('YOUR LOG SPREADSHEET ID',"Trigger and Send Logs");  
    var DOC_PROP = PropertiesService.getDocumentProperties();
    data = getDataWholeSheet();
    range = e.range;
    header = data[0];
    rowNum = parseInt(range.getRowIndex());
    row = data[rowNum-1];
    obj = mergeArrInObject(header, row);
    if(obj){
       Logger.log(USER +" : " +"Change in row " + (rowNum-1));
       var oldRow = DOC_PROP.getProperty('changeEventRow');
       //Change in new row found. Flushing the old data -- KAVITHA
       if((oldRow !== null) && ((rowNum-1) != oldRow)){
          Logger.log(USER +" : " +"Change in new row found... flushing old data");
          rowData = DOC_PROP.getProperty('changeEventData');
          url = JSON.parse(DOC_PROP.getProperty('changeObj')).URL;
          hitApi(url, rowData);
      }
       DOC_PROP.setProperty('changeEventRow', rowNum-1);
       DOC_PROP.setProperty('changeEventData', JSON.stringify(obj));
       if(oldRow === null){
         delayChangeEvent();
       }
    }     
  }
  catch(e) {
    Logger.log(USER +" : " +e);
    postFailureReason("autoChangeTrigFailure", e);
  } 
}
//MODIFIED changeEvent -- END KAVITHA

function mergeArrInObject(keys, data){
  var o = {};
  //Set a flag that denotes the valid row - Kavitha - BEGIN
  var validRow = false;
  for (var j=0; j<keys.length; j++){
    var key = checkKeyStr(keys[j]);
    if((data[j] !== null) && (data[j] !== "") && (data[j] !== undefined)){
        validRow = true;
    }
    o[key] = data[j];
  }
    if(validRow)
      return o;
    else{
      Logger.log(USER +" : " +"Empty Row. Ignoring..");
    }
    //Set a flag that denotes the valid row - Kavitha - END
}