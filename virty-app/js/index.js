
 var remote = require('remote');
 var dialog = remote.require('dialog');
 var drivelist = require('../node_modules/drivelist');

 var distrosList = require('./js/distros.json');

 var fileNameRoute = null;
 var fileName = null;
 var fileChoosed = false;
 var fileDownload = false;
 var distroToDownload = null;
 var devs = [];
 var devRoute = null;
 var devSelected = false;




function listDistros(distrosList){
 var enumDistros = document.getElementById("enum-distros");
 for(var i=0; i < distrosList.length; i++){
   var optionDistro = document.createElement("option");
   optionDistro.text = distrosList[i].name;
   enumDistros.add(optionDistro, enumDistros[i]);
 }
}

function selectDistro() {
  var distros = document.getElementById("enum-distros");
  distroToDownload = distros.options[distros.selectedIndex].index;
  console.log (distroToDownload);
  document.getElementById('btn-download').innerHTML = "Download & Create";
  fileDownload = true;
}

function downloadDistro(distro){
  /*
  Get iso file from distrosList[distro].link check the checksum
  save the file location in varriable:"fileNameRoute" and "fileName" verify all with a try
  then set "fileChoosed = true"
  */
  fileChoosed = true;

}

function listDevs() {
  drivelist.list(function(error, disks) {
    devs = disks;
      //if (error) throw error;
      for(var i=0; i < disks.length; i++){
        if(disks[i].system === false) {
          var addDevHtml = "<div id=\"dev-" + i + "\" onclick=\"devDetails(this.id)\"><span class=\"icon icon icon-drive\"></span>";
          document.getElementById('dev-status').innerHTML = "Devices";
          document.getElementById('dev-list').innerHTML = addDevHtml + disks[i].name + "</div>";
        } else {
          var noDevHtml = "<p></p><div onclick=\"listDevs()\"><span class=\"icon icon-arrows-ccw\"></span>";
          document.getElementById('dev-status').innerHTML = "<center>No devices found please connect one</center>";
          document.getElementById('dev-list').innerHTML = noDevHtml + "Click here to reload devs</div>";
        }
      }
  });
}

function devDetails(devId){
  var devIndexSplited = devId.split("-");
  var devIndex = devIndexSplited[1];
  console.log(devs[devIndex]);
  devRoute = devs[devIndex].device;
  devSelected = true;


  var devDetailsKeys = Object.keys(devs[devIndex]);
  var devDetailsValues = Object.keys(devs[devIndex]).map(function (value) {return devs[devIndex][value];});

  console.log(devDetailsKeys);

  for(i=0; i < devDetailsKeys.length; i++){
    document.getElementById("detail-"+devDetailsKeys[i]).innerHTML = devDetailsValues[i];
  }

  document.getElementById('dev-details').style.display = 'block';
}

function openIso() {
 dialog.showOpenDialog({ filters: [
   { name: 'iso', extensions: ['iso'] }
  ]}, function (fileDeails) {
  if (fileDeails === undefined) {
    return;
  } else {
    fileNameRoute = fileDeails[0];
    var fileNameSplited = fileNameRoute.split("/");
    fileName = fileNameSplited[fileNameSplited.length-1];
    //document.getElementById('fileSelect').innerHTML = fileName;

    console.log(fileName);
    fileChoosed = true;
    var resetDevList = "<option selected=\"true\" style=\"display:none;\">Distro</option>";
    document.getElementById('enum-distros').innerHTML = resetDevList;
    listDistros(distrosList);
    document.getElementById('btn-download').innerHTML = "Create";
    fileDownload = false;
    }
 });
}

function infoSelectSourceFile() {
  dialog.showMessageBox({
    type: "info",
    buttons: ["OK"],
    title : "Select a source",
    message: "",
    detail: "Please select an .iso file or a distribution to download"
  });
}

function infoSelectDev() {
  dialog.showMessageBox({
    type: "info",
    buttons: ["OK"],
    title : "Select a Device",
    message: "",
    detail: "Please select a divice to setup a distro"
  });
}

function infoDownloadFail(){
  dialog.showMessageBox({
    type: "info",
    buttons: ["OK"],
    title : "Fail",
    message: "",
    detail: "Download fail! Please, check your Internet connection and try again"
  });
}

function confirmWrite() {
  if (fileDownload === true){
    try {
      downloadDistro(distroToDownload);
    } catch (err) {
      infoDownloadFail();
      /*
        Set diferent dialog for erros:
        No enough space on hdd
        No Internet conection
        ...
      */
    }
  }
  if(devSelected) {
    if(fileChoosed) {
      var confirmWriteResponse = dialog.showMessageBox({
        type: "question",
        buttons: ["Cancel", "Yes" ],
        title : "Write ISO file",
        message: "Please confirm",
        detail: "All data on " + devRoute + " will be overwriten with " + fileName + " data.\n Would you like to proceed?"
      });
      if (confirmWriteResponse === 1) {
        ddWrites();
      } else {
        return;
      }
    } else {
      infoSelectSourceFile();
    }
  } else {
    infoSelectDev();
  }
}

function ddWrites(){

}
