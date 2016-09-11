 var fs = require('fs');
 const {dialog} = require('electron').remote;
 var drivelist = require('drivelist');

 let distrosList = require('./js/distros.json');
 var numeral = require('numeral');

 let fileNameRoute;
 let fileName;
 var fileChoosed = false;
 var downloadFile = false;
 var checksumFileDownloaded = null;
 let distroToDownload;
 let devs = [];
 let devRoute;
 let devSelectedName;
 let devSelected = false;

 let listDistros = (distrosList) => {
   let enumDistros = document.getElementById('enum-distros');
   let distrosListLength = distrosList.length;
   for (let i = 0; i < distrosListLength; i++) {
     let optionDistro = document.createElement('option');
     optionDistro.text = distrosList[i].name;
     enumDistros.add(optionDistro, enumDistros[i]);
   }
 };

 let selectDistro = () => {
   let distros = document.getElementById('enum-distros');
   distroToDownload = distros.options[distros.selectedIndex].index;
   console.log(distroToDownload);
   if (distroToDownload !== distrosList.length) {
     document.getElementById('btn-download').innerHTML = 'Download & Create';
     document.getElementById('iso-table').style.display = 'none';

     let distroDetailsKeys = Object.keys(distrosList[distroToDownload]);
     let distroDetailsValues = Object.keys(distrosList[distroToDownload]).map((value) => {
       return distrosList[distroToDownload][value];
     });

     console.log(distroDetailsKeys);

     let distroDetailsKeysLength = distroDetailsKeys.length;
     for (let i = 0; i < distroDetailsKeysLength; i++) {
       document.getElementById('distro-' + distroDetailsKeys[i]).innerHTML = distroDetailsValues[i];
     }

     document.getElementById('distro-details').style.display = 'block';
     document.getElementById('distro-table').style.display = 'block';
     downloadFile = true;
   }
 };

 let listDevs = () => {
   drivelist.list((error, disks) => {
     devs = disks;
     // if (error) throw error;
     let disksLength = disks.length;
     for (let i = 0; i < disksLength; i++) {
       if (disks[i].system === false) {
         var addDevHtml = `<div id="dev-${i}" onclick="devDetails(this.id)"><span class="icon icon icon-drive"></span> ${disks[i].name} </div><br>`;
         document.getElementById('dev-status').innerHTML = 'Devices';
         document.getElementById('dev-list').insertAdjacentHTML('beforeend', addDevHtml);
       } else {
         document.getElementById('dev-status').innerHTML = '<center>No devices found please connect one</center>';
       }
     }
   });
 };

 let devDetails = (devId) => {
   let devIndexSplited = devId.split('-');
   let devIndex = devIndexSplited[1];
   delete devs[devIndex].raw;
   console.log(devs[devIndex]);
   devRoute = devs[devIndex].device;
   devSelectedName = devs[devIndex].name;
   devSelected = true;

   let devDetailsKeys = Object.keys(devs[devIndex]);
   let devDetailsValues = Object.keys(devs[devIndex]).map((value) => {
     return devs[devIndex][value];
   });
   for (let key in devDetailsKeys) {
     if (devDetailsKeys[key]) {
       document.getElementById('detail-' + devDetailsKeys[key]).innerHTML = devDetailsValues[key].toString();
     } else {
       document.getElementById('detail-' + devDetailsKeys[key]).innerHTML = 'none';
     }
   }
   document.getElementById('dev-details').style.display = 'block';
 };

 let openIso = () => {
 dialog.showOpenDialog({ filters: [
   { name: 'iso', extensions: ['iso'] }
   ]}, function (fileDeails) {
   if (fileDeails === undefined) {
     return;
   } else {
     fileNameRoute = fileDeails[0];
     let fileNameSplited = fileNameRoute.split('/');
     fileName = fileNameSplited[fileNameSplited.length-1];
     console.log(fileName);
     fileChoosed = true;
     let resetDevList = '<option selected="true" style="display:none;">Distro</option>';
     document.getElementById('enum-distros').innerHTML = resetDevList;

     listDistros(distrosList);

     document.getElementById('btn-download').innerHTML = 'Create';
     document.getElementById('distro-table').style.display = 'none';
     document.getElementById('distro-details').style.display = 'block';
     document.getElementById('iso-table').style.display = 'block';

    // Update values with iso info
     document.getElementById('iso-file').innerHTML = fileName;
     document.getElementById('iso-location').innerHTML = fileNameRoute;
     document.getElementById('iso-checksum').innerHTML = 'None'; // Set checksume
     var fileNameRouteStat = fs.statSync(fileNameRoute);
     document.getElementById('iso-size').innerHTML = numeral(fileNameRouteStat.size).format('0.00 b');
     downloadFile = false;
   }
 });
 };

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
    var request = require('request');

    var filed = require('filed');

    fileName = distrosList[distroToDownload].name.replace(/\s+/g, '_') + '.iso';
    fileNameRoute = 'downloads/' + fileName;

    var stream = filed(fileNameRoute);
    var req = request(distrosList[distroToDownload].link).pipe(stream);
    var dataLength = null;

    req.on('data', function(data) {
      dataLength += data.length;
      document.getElementById('alert-msg').innerHTML = 'Downloading: ' +  numeral(dataLength).format('0.00 b') + ' of ' + distrosList[distroToDownload].size + ' MB';
    });

    stream.on('end', function () {
      basicModal.show({
      body: '<center id="alert-center"><p id="alert-msg">Download Finish!<br>File: ' + fileNameRoute + ' (' + numeral(dataLength).format('0.00 b') + ' )' + '<br>Do you wanto to checksum the file?"</p></center>',
      closable: true,
      buttons: {
          cancel: {
              title: 'CheckSum',
              fn: checkSumFile
          },
          action: {
              title: 'Just write it!',
              fn: confirmWrite
          }
        }
      });

      downloadFile = false;
      fileChoosed = true;
    });

    stream.on('error', function (err) {
      document.getElementById('alert-msg').innerHTML = 'Error downloading the file<br>Please try again';
      document.getElementsByClassName('basicModal__buttons')[0].innerHTML = '<a id="basicModal__action" class="basicModal__button" onclick="basicModal.close();">Close</a>';
      fileChoosed = false;
    });
  } else {
    infoSelectDev();
  }
}

//Modify this to ask the user if he/she wants to checksuming the file
function checkSumFile() {
  basicModal.show({
  body: '<center id="alert-center"><img id="alert-loader" src="../img/ajax_loader_rocket_48.gif"><p id="alert-msg">Checksuming... This could take awhile.</p></center>',
  closable: true,
  buttons: {
      action: {
          title: 'Please wait',
          fn: basicModal.visible
      }
    }
  });

  var checksum = require('checksum');
  checksum.file(fileNameRoute, function (err, sum) {
    console.log('Checksuming...');
    if(err === null && distrosList[distroToDownload].checkSum === sum) {
      document.getElementById("alert-center").removeChild(document.getElementById("alert-loader"));
      document.getElementById('alert-msg').innerHTML = 'Awesome... Checksums match!<br>' + sum;
      document.getElementsByClassName('basicModal__buttons')[0].innerHTML = '<a id="basicModal__action" class="basicModal__button" onclick="ddWrites(); basicModal.close();">Continue</a>';
      console.log(sum + ' null && sum');
      fileChoosed = true;
    } else {
      document.getElementById("alert-center").removeChild(document.getElementById("alert-loader"));
      document.getElementById('alert-msg').innerHTML = 'Sorry<br>Checksums do not match<br>Try to download it again.<br>' + sum;
      document.getElementsByClassName('basicModal__buttons')[0].innerHTML = '<a id="basicModal__action" class="basicModal__button" onclick="basicModal.close();">Close</a>';
      console.log (err);
      fileChoosed = false;
    }
  });
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
    }
  } else if(fileChoosed) {
    ddWrites();
  } else {
    infoSelectSourceFile();
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
        detail: "All data on " + devSelectedName + " will be overwriten with " + fileName + " data.\n Would you like to proceed?"
      });

      if (confirmWriteResponse === 1) {
        basicModal.show({
        body: '<center id="alert-center"><img id="alert-loader" src="../img/ajax_loader_rocket_48.gif"><p id="alert-msg"></p></center>',
        closable: true,
        buttons: {
          action: {
              title: 'Please wait',
              fn: basicModal.visible
            }
          }
        });

        var imageWrite = require('etcher-image-write');

        var myStream = fs.createReadStream(fileNameRoute);

        var emitter = imageWrite.write(devRoute, myStream, {
          check: false,
          size: fs.statSync(fileNameRoute).size
        });

        emitter.on('progress', function(state) {
          document.getElementById('alert-msg').innerHTML = 'Writing: ' + Math.round(state.percentage) + '% ' + '(' + numeral(state.transferred).format('0.00 b')  + ')<br>' + 'Speed: ' + numeral(state.speed).format('0.00 b') + '/s ' + ' ETA: ' + numeral(state.eta).format('00:00:00');
          console.log(state);
        });

        emitter.on('error', function(error) {
          document.getElementById("alert-center").removeChild(document.getElementById("alert-loader"));
          document.getElementById('alert-msg').innerHTML = 'heads-up!<br>' + error + '<br>Please try again' ;
          document.getElementsByClassName('basicModal__buttons')[0].innerHTML = '<a id="basicModal__action" class="basicModal__button" onclick="basicModal.close();">Close</a>';
          console.error(error);
        });

        emitter.on('done', function(success) {
          if (success) {
            document.getElementById('alert-center').removeChild(document.getElementById("alert-loader"));
            document.getElementById('alert-msg').innerHTML = 'VirtyDrive succesfully created!<br>' + fileName + ' on: ' + devRoute + "<br>Now you can boot in your new GNU/Linux have fun!";
            document.getElementsByClassName('basicModal__buttons')[0].innerHTML = '<a id="basicModal__action" class="basicModal__button" onclick="basicModal.close();">Finish</a>';
            console.log('Success!');
          } else {
            document.getElementById("alert-center").removeChild(document.getElementById("alert-loader"));
            document.getElementById('alert-msg').innerHTML = 'heads-up! something went wrong,<br>Please try again';
            document.getElementsByClassName('basicModal__buttons')[0].innerHTML = '<a id="basicModal__action" class="basicModal__button" onclick="basicModal.close();">Close</a>';
            console.log('Failed!');
          }
        });
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

function infoCheckDevs(){
  document.getElementById('dev-details').style.display = 'none';
  var allDevsListed = document.getElementById('dev-list');
  while (allDevsListed.hasChildNodes()) {
    allDevsListed.removeChild(allDevsListed.lastChild);
}
  devSelected = false;
  basicModal.show({
  body: '<center id="alert-center"><img id="alert-loader" src="../img/ajax_loader_rocket_48.gif"><p id="alert-msg">Checking for Drives</p></center>',
  closable: true,
  callback: function() { setTimeout(basicModal.close, 3000); setTimeout(listDevs, 3000);},
  buttons: {
      action: {
          title: 'Please wait',
          fn: basicModal.visible
      }
    }
  });
}
