
# Instructions for the Maintainer

**********************
## PREPARING A RELEASE - first steps, command line
**********************

### 1. Switch to / create the <rel-7.x.x> branch

`git checkout -b rel-7.x.x`

### 2. Install clean and run security checks

`rm -rf node_modules && npm ci`

`npm audit`

### 3. Update version

* src/js/core/mejs.js: mejs.version = '7.x.x';
* package.json: "version": "7.x.x",

### 4. check with shell command;
`egrep "version:|mejs.version =" package.js src/js/core/mejs.js`

`head -4 package*.json | grep version`

### 5. Update changelog.md

### 6. Build release

`npm run build`

### 7. Check that mejs.version has been updated successfully below build/

`grep mejs.version build/* -r`

### 8. Add/commit all including build/ (if you commit dist)

`git add --all`

`git commit -am "release 4.x.x`

### 9. Carefully, interactively rebase, allowing "reword"ing commits for cleaner git log

`git rebase -i master`

### 10. git push


**********************
# PREPARING A RELEASE - second step on github.com
**********************

* Prepare a new release using changelog.md

**********************
# PREPARING A RELEASE - third step on npmjs.com
**********************
* Publish a new version to `npmjs.com` by using:
```
npm login
npm publish
```

**********************
# UPDATE THE WEBSITE
**********************
* [Update the version on the website](https://github.com/mediaelement/mediaelement/blob/master/docs/guidelines.md#website) `https://cdn.jsdelivr.net/npm/mediaelement@x.x.x` and update mediaplayer configuration if necessary.

### Notes for the modern build

- Bundling: use `npm run build` (esbuild + postcss-cli). No Grunt.
- Coverage: use `npm test` (c8 + mocha). No Istanbul.
- Ensure `iconSprite` is reachable (default auto-detection works when serving `build/`; otherwise set `window.mejs.MepDefaults.iconSprite`).