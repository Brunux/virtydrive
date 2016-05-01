
 var remote = require('remote');
 var fs = require('fs');
 var dialog = remote.require('dialog');
 var drivelist = require('../node_modules/drivelist');

 var distrosList = require('./js/distros.json');

 var fileNameRoute = null;
 var fileName = null;
 var fileChoosed = false;
 var downloadFile = false;
 var checksumFileDownloaded = null;
 var distroToDownload = null;
 var devs = [];
 var devRoute = null;
 var devSelected = false;

 var hostInfo = null;


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
  if(distroToDownload != distrosList.length) {
    document.getElementById('btn-download').innerHTML = "Download & Create";
    downloadFile = true;
  }
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
    downloadFile = false;
    }
 });
}

function downloadDistro(){
  if (devSelected) {
    basicModal.show({
    body: '<center id="alert-center"><img id="alert-loader" src="../img/ajax_loader_rocket_48.gif"><p id="alert-msg"></p></center>',
    closable: true,
    buttons: {
        action: {
            title: 'Cancel',
            fn: basicModal.close
        }
      }
    });

    var progress = require('progress-stream');
    var req = require('request');
    var log = require('single-line-log').stdout;
    var numeral = require('numeral');

    fileName = distrosList[distroToDownload].name.replace(/\s+/g, '_') + '.iso';
    fileNameRoute = 'downloads/' + fileName;

    var str = progress({
      drain: true,
      time: 1000,
      length: distrosList[distroToDownload].size
    }, function(progress) {
      document.getElementById('alert-msg').innerHTML = 'Running: ' + numeral(progress.runtime).format('00:00:00') + ' ' +
        numeral(progress.speed).format('0.00b') + '/s ' + Math.round(progress.percentage*0.000001) + '% ' + '(' +
        numeral(progress.transferred).format('0.0b') + ')';
    });

    req(distrosList[distroToDownload].link, function() {
      checkSum();
    }).pipe(str).pipe(fs.createWriteStream(fileNameRoute));
    console.log('Downloading....');

  } else {
    infoSelectDev();
  }
}

function checkSum() {
  document.getElementById('alert-msg').innerHTML = 'Checksuming... this could take awhile, please wait.';
  var md5 = require('md5');

  fs.readFile(fileNameRoute, function(err, buf) {
    var checksumFile = (md5(buf));

    if(err === null && distrosList[distroToDownload].checkSum === checksumFile) {
      document.getElementById("alert-center").removeChild(document.getElementById("alert-loader"));
      document.getElementById('alert-msg').innerHTML = 'Awesome... Checksums match!<br>' + checksumFile;
      document.getElementsByClassName('basicModal__buttons')[0].innerHTML = '<a id="basicModal__action" class="basicModal__button" onclick="setTimeout(checkPlatform, 1000); basicModal.close();">Continue</a>';
      fileChoosed = true;
  } else {
      document.getElementById("alert-center").removeChild(document.getElementById("alert-loader"));
      document.getElementById('alert-msg').innerHTML = 'Sorry<br>Checksums do not match<br>Try to download it again.<br>' + checksumFile;
      console.log (err);
      fileChoosed = false;
    }
  });
}

function checkPlatform() {
  var OpSys = require('os');
  hostInfo = {
    'platform' : OpSys.platform(),
    'arch' : OpSys.arch(),
    'type' : OpSys.type()
  };
  console.log(hostInfo);
  ddWrites();
}

function confirmWrite() {
  if (downloadFile){
    try {
      downloadDistro();
      } catch (err) {
      infoDownloadFail();
      /*
        Set diferent dialog for erros:
        No enough space on hdd
        No Internet conection
        ...
      */
      fileChoosed = false;
      infoCheckSumFail();
      return;
    }
  } else {
    checkPlatform();
  }
}

function ddWrites(){
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
        basicModal.show({
        body: '<center id="alert-center"><img id="alert-loader" src="../img/ajax_loader_rocket_48.gif"><p id="alert-msg"></p></center>',
        closable: true,
        buttons: {
        action: {
            title: 'Please wait',
            fn: basicModal.close
            }
          }
        });

        var dd_bin = null;

        if (hostInfo.platform === 'win32' || hostInfo.platform === 'win64') {
          dd_bin = '../bin/dd.exe';
        } else if (hostInfo.platform === 'linux') {
          dd_bin = '../bin/dcfldd';
          var util  = require('util'),
              spawn = require('child_process').spawn,
              dd    = spawn(dd_bin, ['if=' + fileNameRoute, 'of=' + devRoute]);

          dd.stdout.on('data', function (data) {
            document.getElementById('alert-msg').innerHTML = 'Warning: ' + data;
            console.log('stdout: ' + data);
          });

          dd.stderr.on('data', function (data) {
            document.getElementById('alert-msg').innerHTML = 'Writing: ' + data + '<br>';
            console.log('stderr: ' + data);
          });

          dd.on('exit', function (code) {
            console.log('child process exited with code ' + code);
            if(code !== 0) {
              document.getElementsByClassName('basicModal__buttons')[0].innerHTML = '<a id="basicModal__action" class="basicModal__button" onclick="basicModal.close();">Close</a>';
              dd.stderr.on('data', function (data) {
              document.getElementById("alert-center").removeChild(document.getElementById("alert-loader"));
              document.getElementById('alert-msg').innerHTML = 'Error:<br>' + data;
              });
            } else {
              document.getElementById("alert-center").removeChild(document.getElementById("alert-loader"));
              document.getElementById('alert-msg').innerHTML = 'VirtyDrive succesfully created<br>' + fileName + ' on: ' + devRoute;
              document.getElementsByClassName('basicModal__buttons')[0].innerHTML = '<a id="basicModal__action" class="basicModal__button" onclick="basicModal.close();">Finish</a>';
            }
          });
        } else if(hostInfo.platform === 'darwin') {
          dd_bin = '../bin/osxdd';
        } else {
          infoCheckOSFail();
        }
      }
    } else {
      infoSelectSourceFile();
    }
  } else {
    infoSelectDev();
  }
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

function infoCheckSumFail(){
  dialog.showMessageBox({
    type: "info",
    buttons: ["OK"],
    title : "Fail",
    message: "",
    detail: "Download/Checksum fail! Please, check that you have enough space and writing permissions avalable on disk"
  });
}

function infoCheckOSFail(){
  dialog.showMessageBox({
    type: "info",
    buttons: ["OK"],
    title : "Fail",
    message: "",
    detail: "No operation system was detected, please make sure to run this as administrator or root"
  });
}
