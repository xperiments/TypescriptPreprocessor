TypescriptPreprocessor
======================

A typescript preprocessor helper based on simple attachable plugins.

Plugins already developed:
* @source -> adds more than one source folder to classpath.
* @import -> use cls.ass.packages as imports. Automatically resolves relative reference paths.
* @define -> use cls.ass.packages as definition imports. Automatically resolves relative reference paths to .d.ts files.

Plugins developing:
* @embed -> embeds png,svg,js,txt into a png library file. Also generates atlas inside the png and creates a library.d.ts file

##@source example:
```
///@source /src
///@source /def
```

##@import & @define example:
```
///@import es.xperiments.Demo
///@define es.xperiments.Demo
```
Will resolve to:
```
///<reference path='src/es/xperiments/demo.ts'/>
///<reference path='src/es/xperiments/demo.d.ts'/>
```

