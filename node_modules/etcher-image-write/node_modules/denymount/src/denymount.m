/*
 * Copyright 2016 Resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <CoreFoundation/CoreFoundation.h>
#import <DiskArbitration/DiskArbitration.h>

void DMDenyMount(DASessionRef session, const char *diskName);
DADissenterRef DMMountApprovalCallback(DADiskRef disk, void *context);
bool DMAreDisksEqual(DADiskRef disk1, DADiskRef disk2);
DADiskRef DMGetWholeDisk(DADiskRef disk);

volatile bool running = true;

int main(int argc, const char *argv[]) {
  if (argc != 2) {
    fprintf(stderr, "Usage: %s diskName\n", argv[0]);
    return EXIT_FAILURE;
  }

  @autoreleasepool {

    // Create a serial queue to schedule callbacks on
    dispatch_queue_t queue = dispatch_queue_create("denymount", DISPATCH_QUEUE_SERIAL);

    // Run loops aren't signal-safe, so setup dispatch sources to handle
    // INT and TERM signals and toggle our `running` flag
    void(^terminationHandler)(void) = ^{ running = false; };
    dispatch_source_t sigintSource = dispatch_source_create(DISPATCH_SOURCE_TYPE_SIGNAL, SIGINT, 0, queue);
    dispatch_source_t sigtermSource = dispatch_source_create(DISPATCH_SOURCE_TYPE_SIGNAL, SIGTERM, 0, queue);
    dispatch_source_set_event_handler(sigintSource, terminationHandler);
    dispatch_source_set_event_handler(sigtermSource, terminationHandler);

    // Setup the disk arbitration session
    DASessionRef session = DASessionCreate(kCFAllocatorDefault);
    DMDenyMount(session, argv[1]);
    DASessionSetDispatchQueue(session, queue);

    // Start signal sources to listen for signals
    dispatch_resume(sigintSource);
    dispatch_resume(sigtermSource);

    // Run the run loop to service GCD
    while (running) {
      @autoreleasepool {
        CFRunLoopRunInMode(kCFRunLoopDefaultMode, 1, true);
      }
    }

    // Cleanup
    dispatch_source_cancel(sigintSource);
    dispatch_source_cancel(sigtermSource);
    DASessionSetDispatchQueue(session, NULL);
    CFRelease(session);
    session = NULL;
  }

  return EXIT_SUCCESS;
}

/**
 * Check that two DADiskRef's are equal.
 *
 * We consider two disks to be equal if they share the same BSD name.
 *
 * @private
 * @param disk1 The first disk.
 * @param disk2 The second disk.
 * @returns Whether the two disks are equal or not.
 */
bool DMAreDisksEqual(DADiskRef disk1, DADiskRef disk2) {
  return strcmp(DADiskGetBSDName(disk1), DADiskGetBSDName(disk2)) == 0;
}

/**
 * Attempt to get the whole disk from a DADiskRef.
 *
 * If our disk represents `/dev/disk2s3`, then the whole disk
 * represents `/dev/disk2`.
 *
 * If the passed disk is already the whole disk, then the same
 * disk is returned.
 *
 * The caller implicitly retains the object and is responsible
 * for releasing it with `CFRelease()`.
 *
 * @private
 * @param disk The disk.
 * @return The whole disk object.
 */
DADiskRef DMGetWholeDisk(DADiskRef disk) {
  DADiskRef whole = DADiskCopyWholeDisk(disk);

  if (whole) {
    return whole;
  }

  return disk;
}

/**
 * Set an interceptor to prevent a disk from being mounted
 *
 * The disk name can be either a BSD name, like `disk2` or the full
 * path to the device file, like `/dev/disk2`.
 *
 * Notice that partitions of a disk will be denied if you pass the
 * whole disk to this function. So if you intercept `disk2`, `disk2s1`
 * will be denied as well.
 *
 * See `DMMountApprovalCallback` for an explanation on how this
 * is performed.
 *
 * @param session  The DiskArbitration session.
 * @param diskName The disk name.
 */
void DMDenyMount(DASessionRef session, const char *diskName) {
  printf("Intercepting %s...\n", diskName);

  // Creating a `DADiskRef` disk object from a BSD name allows us to
  // gracefully handle full path to device files.
  DADiskRef disk = DADiskCreateFromBSDName(kCFAllocatorDefault, session, diskName);

  // Registers a callback function to be called whenever
  // a volume is to be mounted.
  DARegisterDiskMountApprovalCallback(session,
                                      kDADiskDescriptionMatchVolumeMountable,
                                      DMMountApprovalCallback,
                                      (void *)disk);
}

/**
 * The Deny Mount callback.
 *
 * This function is called each time a disk attempts to be mounted,
 * as configured by `DMDenyMount`.
 *
 * The function checks that the disk matches the one we're trying to
 * intercept, and if so, returns a `DADissenter` object informing
 * exclusive access over the disk, therefore causing the disk to not
 * get mounted.
 *
 * If the disks don't match, a `NULL` `DADissenter` is returned.
 *
 * @private
 * @param disk    The disk that attempts to get mounted.
 * @param context The context passed from the callback registration.
 * @returns       The DADissenter object with exclusive access.
 */
DADissenterRef DMMountApprovalCallback(DADiskRef disk, void *context) {
  DADiskRef wholeDisk = DMGetWholeDisk(disk);

  // A `NULL` dissenter causes the disk to be mounted.
  // We set this by default, unless the disk matches.
  DADissenterRef dissenter = NULL;

  printf("Request to mount volume %s... ", DADiskGetBSDName(wholeDisk));

  if (DMAreDisksEqual(wholeDisk, context)) {
    printf("DENY\n");
    dissenter = DADissenterCreate(kCFAllocatorDefault, kDAReturnExclusiveAccess, NULL);
  } else {
    printf("OK");
  }

  // The result from `DMGetWholeDisk` needs to be manually released.
  // See the documentation of tha function for more information.
  CFRelease(wholeDisk);
  wholeDisk = NULL;

  return dissenter;
}
