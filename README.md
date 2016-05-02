# VirtyDrive
VirtyDrive setups your Linux isos on USB Drives, works on Windows, OSX and Linux.

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

Virty will download the selected distro and write it to a **USB/SD-Card** Drive selected. If you have a iso file of a different dristo you can also write it the same way.

VirtyDrive is based on [electron](https://github.com/electron/electron) framework please download it and install it globally.

Then run:

1. user$ `mkdir development; cd development`
2. user$ `git clone https://github.com/Brunux/virtydrive.git`
3. user$ `cd virtydrive`
4. root# `electron /virty-app` why root? Writing to /devs needs elevated privileges.
5. test it
6. ...
7. fork our repo
8. code
9. code
10. make PR

Please share :)
