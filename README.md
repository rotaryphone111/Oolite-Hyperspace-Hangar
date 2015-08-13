#Oolite-Hyperspace-Hangar
Written by Ramen, with credit to Capt. Murphy and Norby, and Norby again, for
providing a fix for the one-ship-type-only bug, and lots more Norby.
Credit goes to Kheng for providing the hangar image.
(http://kheng.deviantart.com)

For installation instructions, see INSTALL.md

Changelog:
--------------------------------------------------------------------------------
- Version 1.14.5: Thu Aug 13 13:07:18 PDT 2015 - Added INSTALL.md and .gitignore, 
Renamed LICENSE.txt and README.txt to .md files. Added git repo functionality.
- Version 1.14.4: Mon Aug 10 15:48:16 PDT 2015 - Removed test message that was left in by
accident.
- Version 1.14.3: Mon Aug 10 15:21:34 PDT 2015 - Fixed incorrect ship pricing, which was causing
serveral bugs, including ships being sold, Ships Not Being Removed(tm), etc.
Also fixed the hangar not being activated. Turned oxp into git repo. (Not on the
internet yet.)
- Version 1.14.2: Fri Jul  3 12:58:53 PDT 2015 - I moved to California, so dates will now be in
PDT. I am also updating the changelog format to include version numbers from
this point forward.

Older Versions:
-------------------------------------------------------------------------------
- Tue Jun 16 23:28:02 EDT 2015 - Reinstated switch damage, due to annoying
implementation bugs. Added short range chart functionality if target world is
less than or equal to 7.0 LY away. Added intergalactic ordering.
- Mon Jun 15 17:34:06 EDT 2015 - Changed damage so that it happends when sending
and ordering, not switching.
- Sun Jun 14 20:28:05 EDT 2015 - Added galactic chart display to send function.
Added ability to use function keys to switch out of some hangar screens.
(not all)
- Sun Jun 14 12:49:25 EDT 2015 - Added a need to order ahead or wait for ships to
arrive if switching. Selling remains unchanged due to the galactic internet. (or
something) Added possibility of damage if the docked station's tech level is
below 6. 
- Fri Jun 12 11:54:43 EDT 2015 - Made it so that only stations with shipyards have
the hangar. Fixed changelog typo.
- Wed Jun 10 00:07:37 EDT 2015 - Added messages confirming actions, e.g. selling
a ship. Also fixed a bug with ships selling when they are not supposed to.
Also added spiffy lines to changelog.(Now to write a program MADE from spiffy
lines that adds MORE spiffy lines that do the same thing.)
- Tue Jun  9 22:44:15 EDT 2015 - fixed a ship-won't-sell bug and added Xenon UI
compatibility
- Tue Jun  9 15:00:36 EDT 2015 - added image of hangar with rotating model of ship
(thanks to Kheng: http://kheng.deviantart.com). Also fixed another storage bug.
- Mon Jun  8 14:56:22 EDT 2015 - added ship removal option and made OXPConfig
optional
- Sun Jun  7 18:49:06 EDT 2015 - fixed ship-non-deletion bug. (hopefully)
- Sun Jun  7 12:11:14 EDT 2015 - rediscovered ship-non-deletion bug. Fixed pricing
bug. (Thanks Day!)
- Fri Jun  5 14:08:11 EDT 2015 - fixed bug where ships would not delete themselves
after not buying anything and moving away from the shipyard interface.
- Wed May 27 16:16:01 EDT 2015 - Updated hangar so that options have to be
activated from OXPConfig. Added OXPConfig as a dependency. Removed accidentally
added .diff files from oxz.
- Fri May 15 14:09:05 EDT 2015 - implemented bug fix from Norby, added
instructions for activating hangar.
- Wed May 13 18:33:33 EDT 2015 - added selling of stored ships and warning
messages for selling ships. also improved code readability.
- Wed May 13 17:59:04 EDT 2015 - added many things, forgot to put them here.
Added a ship storage delay and fee, made those adjustable, and created options
menu. Also added defaults restore option and added displays of the current delay
and price. 
- Sat May  9 20:31:16 EDT 2015 - fixed one-ship-type-only bug, thanks Norby!
Also changed dating system.
- 5/9/15 - updated manifest.plist to include license.
- 5/9/15 - first version.
