# VirtyDrive
Cross-Platform Linux drive creator, VirtyDrive setups your Linux isos on USB Drives, works on Windows, OSX and Linux.

Handy-Dandy tool for booting different Linux distros from USB Drives.
Currently supports TOP-10 DistroWatch plus 2 distros for the RapsberryPI Project

|Name|Version|Arch|Porpuse|
|:---:|:----:|:---:|:----:|
|Linux Mint|17.3|64-bit|Desktop|
|Debian|8|64-bit|Desktop|
|Ubuntu|16.04|64-bit|Desktop|
|Open SUSE|42.1|64-bit|Desktop|
|Fedora|24|64-bit|Desktop|
|Manjaro|16.06|64-bit|Desktop|
|Majeia|6|64-bit|Desktop|
|CentOS|7|64-bit|Server|
|ArchLinux|2016.04.01|64-bit|Multi|
|ElementaryOS|0.3.2|64-bit|Desktop|
|Noobs|1.9.0|ARM|Desktop|
|Rasbian|8.4|ARM|Multi|

*__Note__* that this is a live list so it will be update from time to time depending on distroswatch stats.

Virty will download the selected distro and write it to a **USB/SD-Card** Drive selected. If you have a iso file of a different distro you can also write it the same way.

### Weekend build
***

This is the first build, so issues are expected please if you find one [fill it in](https://github.com/Brunux/virtydrive/issues "Issues") we will try to fix it asap.

Be aware, the way the iso is downloaded consumes lot of RAM memory (the size of the iso file) there is a WIP to fix it.

Download **[Linux x64](https://github.com/Brunux/virtydrive/blob/master/build/daily/virtydrive-linux-x64.tar.gz)** run instructions:

1. user@LinuxBox$ `tar -xzvf virtydrive-linux-x64.tar.gz`
2. user@LinuxBox$ `cd virtydrive-linux-x64`
3. user@LinuxBox$ `sudo ./virtydrive`

***

Download **[Windows x64](https://github.com/Brunux/virtydrive/blob/master/build/daily/virtydrive-win32-x64.zip)** run instructions:

1. Uncompress the file.
2. Go to the new created directory.
3. Identify `virtydrive.exe` right click and select `run as administrator`.

***

Download **[OSX darwin](https://github.com/Brunux/virtydrive/blob/master/build/daily/virtydrive-darwin-x64.tar.gz)** run instructions:

1. **not yet tested** feedback needed...

***

VirtyDrive is based on [electron](https://github.com/electron/electron) framework please download and install.

If you want to run the latest version:

1. user$ `mkdir development; cd development`
2. user$ `git clone https://github.com/Brunux/virtydrive.git`
3. user$ `cd virtydrive`
4. user$ ` sudo electron /virty-app` why sudo? Writing to /devs needs elevated privileges.
5. test it.

If you want to contribute to the project (hope so! :) please:

1. Fork our repo.
2. Code.
3. Code.
4. Make PR.

There is WIP for the unit-test and a wrapper aka docker for the development process.
