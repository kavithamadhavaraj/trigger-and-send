/**
AUTHOR : KAVITHA MADHAVARAJ
**/

function getScheduleTriggers(){
  return getLocData('scheduleObj');
}

function scheduleTrig(e){  
  Logger = useSpreadsheet('YOUR LOG SPREADSHEET ID',"Trigger and Send Logs");  
  Logger.log(USER +" : " + "Schedule Trigger Invoked.");
  try {
    var DOC_PROP = PropertiesService.getDocumentProperties();
    var cur_row_index = null;
    var obj = DOC_PROP.getProperty('scheduleObj');
    Logger.log(USER +" : " + JSON.parse(obj));
  
    if(obj){
      obj = JSON.parse(obj);
      var cur_sheet = getDataWholeSheet();
      var header = cur_sheet[0];
      var url = obj.URL;
      var sheet_length = Object.keys(getDataWholeSheet()).length;
      var k=0;
      Logger.log(USER +" : " + sheet_length);
      
      for (cur_row_index = parseInt(obj.row); (cur_row_index < sheet_length && k < 200 ); cur_row_index++, k++){
         var frame = JSON.stringify(mergeArrInObject (header, cur_sheet[cur_row_index]));

         if (frame !== null && frame !== "" && frame !== undefined){
           Logger.log(USER +" : " +cur_row_index +  "Hitting api");
           if (hitApi(url, frame) === "Success"){
              obj.row = cur_row_index + 1 
              DOC_PROP.setProperty('scheduleObj', JSON.stringify(obj));
           }
           else{
             Logger.log(USER +" : " + "Failed");
             cur_row_index = cur_row_index - 1;
             continue;
           }
         }else{
           obj.row = cur_row_index + 1
           DOC_PROP.setProperty('scheduleObj', JSON.stringify(obj));
         }
      }
      
      Logger.log(USER +" : " + cur_row_index+ "" +Object.keys(getDataWholeSheet()).length + "" + k );
      if(cur_row_index >= Object.keys(getDataWholeSheet()).length){        
        Logger.log(USER +" : " + "Deleting trigger by ID");
        deleteTriggerById(parseInt(JSON.parse(getLocData('scheduleObj')).id));
        Logger.log(USER +" : " + "Deleting property by ID");
        deletePropertyBy(['scheduleObj']);
        Logger.log(USER +" : " + "Schedule Completed Sucessfully.");
        showDialog("Schedule Completed Sucessfully.");
      }      
    }
  }
  catch(e) {
    postFailureReason("scheduleTriggerFailure", e);
  } 
}

function scheduleInit(url) {
  Logger = useSpreadsheet('YOUR LOG SPREADSHEET ID',"Trigger and Send Logs");  

  //delete triggers and property
  var data = getLocData('scheduleObj');
  Logger.log(USER +" : " +data);
  
  if (data){
    data = JSON.parse(data);
    deleteTriggerById(parseInt(data.id));
    deletePropertyBy(['scheduleObj']);
  }
  
  var id = ScriptApp.newTrigger('scheduleTrig').timeBased().everyHours(1).create().getUniqueId();
  Logger.log(USER +" : " +"Schedule Trigger created");
  
  var obj = {
    id: id,
    row: 1,
    URL: url
  };
  
  Logger.log(USER +" : " + obj);
  var DC = PropertiesService.getDocumentProperties();
  DC.setProperty('scheduleObj', JSON.stringify(obj));
  Logger.log(USER +" : " +DC.getKeys())
  //validate first and then send message
  showDialog("Scheduled Successfully.");
}