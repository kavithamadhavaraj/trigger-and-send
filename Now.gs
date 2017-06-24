//check if provided range has atleast one row and does not exceed the maximum limit -- KAVITHA
function isDataValid(arr){
  return ((arr.length) > 0 && (arr.length) <= 200) ? true : false;
}

/*
@ selecting range on keyup
*/
function selectRange(range){
  var sheet, data;
  sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  data = sheet.getRange(range);
  data.activate();
}

function getDataFromRange(range){
  var sheet, data;
  sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet(); 
  data = sheet.getRange(range).getValues();
  return data;
}

function isArrayEmptyOrUndefined(_arr, _index1) {
  try {
    //modified the validation to one row instead of two rows -- KAVITHA
    if (_arr[_index1] !== undefined && _arr[_index1].length > 0){
      return false;
    }
    else{
      return true;
    }
  } 
  catch(e) { 
    return true; 
  }
}

//sending data one by one - BEGIN -- KAVITHA
/*
 @header header array
 @url = url to hit
 @data = data which has to post
 @row_num = which row number to start from, (will be null if "manual" range option is selected)
 @range = range info, (will be null if "all" option is selected)

*/
function sendDataInLoop(url, data, header, row_num, range){
  var data_length = Object.keys(data).length;
  var i;
  if(row_num == null){
      Logger.log(USER +" : " +"Sending "+ range);
      showDialog("You'll be notified upon completion.");
  }

  for(i=0;((i<200) && (i<data_length));i++){
      var obj = mergeNowArrInObject (header,data[i], range);
      if(obj){ 
        obj = JSON.stringify(obj)
        if(hitApi(url,obj, false) !== "Success"){
           if(row_num)
             showDialog('Error in sending '+(row_num+i)+'. Try again.');
           else
             showDialog('Error while sending the data. Try again.');
           return;
        }
        else{
          if(row_num){
             showAlert("Row - " + (row_num+i) + ' sent successfully.', 'Info');
             Logger.log(USER +" : " +"Sent "+ (row_num+i));
          }
        }
     }
  }
  if(row_num)
     showDialog('Completed sending rows from '+ row_num + " to " + (row_num + i -1));
  else
     showDialog('Completed sending data.');
}
//sending data one by one - END -- KAVITHA


/* MODIFIED -- KAVITHA
prepare data before submit
@range = sheet range
@url = url to hit
@sendOnce = boolean, how to send data once or multiple
*/
function prepareData(formData){
  Logger = useSpreadsheet('YOUR LOG SPREADSHEET ID',"Trigger and Send Logs");  
  var header = getHeader();
  var data; 
  var row_num = null;
  
  if (formData.option === "all"){
    formData.range = null;
    row_num = parseInt(formData.row_num);
    data = getDataWholeSheet().slice(row_num-1);
  }
  else{
    data = getDataFromRange(formData.range);
    if (!isDataValid(data)){
      showDialog("Data is either empty / too big to send.");
      return false
    }
  }
  
  //check if data is empty or undefined
  if(isArrayEmptyOrUndefined(data, 0)){
    showDialog('Insufficient data in sheet or sheet is empty. At least one row is needed to send data');
    return false;
  }
  else{
    showAlert('Task Started', "Info");
  }
  sendDataInLoop(formData.url, data, header, row_num, formData.range);

}

//Set a flag that denotes the valid row - BEGIN - KAVITHA
function mergeNowArrInObject (keys, data, range){
  var o = {};
  var validRow = false;
  // Merge the custom range data into object -- BEGIN -- KAVITHA
  if(range !== null && range !== undefined && range !== ""){   
    var rangeNum = (range.replace(/[0-9]/g, '')).split(":");
    rangeNum[0] = convertLetterToNumber(rangeNum[0].toUpperCase());
    rangeNum[1] = convertLetterToNumber(rangeNum[1].toUpperCase());
    if (rangeNum[0] > rangeNum[1])
      keys = keys.slice(rangeNum[1]-1, rangeNum[0]); 
    else
      keys = keys.slice(rangeNum[0]-1, rangeNum[1]);
  }

  // Merge the custom range data into object -- END -- KAVITHA
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

// Utility to convert the column names to number -- KAVITHA
var convertLetterToNumber = function(val) {
  var base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', i, j, result = 0;

  for (i = 0, j = val.length - 1; i < val.length; i += 1, j -= 1) {
    result += Math.pow(base.length, j) * (base.indexOf(val[i]) + 1);
  }

  return result;
};