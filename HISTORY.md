Locator Lang Change History
===========================

@NEXT@
------------------


0.2.1 (2014-03-07)
------------------

* PR #7: bugfix for `requiredLangs` to avoid getting into a funky state in locator when mixing this plugin with `locator-yui`, where meta modules will be generated multiple times.

0.2.0 (2014-03-06)
------------------

* PR #6: supporting requiredLangs of langs to fallback lang bundles and lang entries when needed

0.1.2 (2014-02-13)
------------------

* remove transpiler in favor for `require('intl-messageformat').__parse`
* parsed messages are now arrays

0.1.1 (2013-11-01)
------------------

* add transpiler support
* add a yrb to javascript transpiler


0.1.0 (2013-10-17)
------------------

* using `/` instead of `.` for the delimiter when registering under `Y.Inlt`.
* allows the application to declare the default language tag.
* guarantees that build files will always include a language tag.
* adding support for yrb format in a form of `*.pres` files.


0.0.1-rc2 (2013-09-27)
------------------

* taking in consideration the BCP 47 language tag to organize lang bundles


0.0.1-beta (2013-09-13)
------------------

* json5 support
* better organization to support multiple output formats
* yui format is opt-in from now on


0.0.1-alfa (2013-09-12)
------------------

* Initial release.
