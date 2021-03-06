"use strict";

var webpack = require("webpack");
var path = require("path");
var MiniCssExtractPlugin = require("mini-css-extract-plugin");
var RemoveCoreFromName = require("../webpack-remove-core-from-name");
//var TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
var dts = require("dts-bundle");
var rimraf = require("rimraf");
//var packageJson = require("./package.json");
var fs = require("fs");
var replace = require("replace-in-file");
var svgStoreUtils = require(path.resolve(
  __dirname,
  "./node_modules/webpack-svgstore-plugin/src/helpers/utils.js"
));

module.exports = function (options, packageJson) {
  const today = new Date();
  const year = today.getFullYear();
  var banner = [
    "surveyjs - Survey JavaScript library v" + packageJson.version,
    "Copyright (c) 2015-" + year + " Devsoft Baltic OÜ  - http://surveyjs.io/",
    "License: MIT (http://www.opensource.org/licenses/mit-license.php)",
  ].join("\n");

  // TODO add to dts_bundler
  var dts_banner = [
    "Type definitions for Survey JavaScript library v" + packageJson.version,
    "Copyright (c) 2015-" + year + " Devsoft Baltic OÜ  - http://surveyjs.io/",
    "Definitions by: Devsoft Baltic OÜ <https://github.com/surveyjs/>",
    "",
  ].join("\n");

  var buildPath = __dirname + "/build/";
  var isProductionBuild = options.buildType === "prod";

  function createSVGBundle() {
    var options = {
      fileName: path.resolve(__dirname, "./svgbundle.html"),
      template: path.resolve(__dirname, "../svgbundle.pug"),
      svgoOptions: {
        plugins: [{ removeTitle: true }],
      },
      prefix: "icon-",
    };

    svgStoreUtils.filesMap(path.join("./src/images/**/*.svg"), (files) => {
      const fileContent = svgStoreUtils.createSprite(
        svgStoreUtils.parseFiles(files, options),
        options.template
      );

      fs.writeFileSync(options.fileName, fileContent);
    });
  }

  function removeLines(fileName, regex) {
    replace.sync(
      {
        files: fileName,
        from: regex,
        to: "",
      },
      (error, changes) => {
        if (error) {
          return console.error("Error occurred:", error);
        }
        console.log("check me :     " + fileName);
        console.log("Modified files:", changes.join(", "));
      }
    );
  }

  var percentage_handler = function handler(percentage, msg) {
    if (0 == percentage) {
      console.log("Build started... good luck!");
      createSVGBundle();
    } else if (1 == percentage) {
      if (isProductionBuild) {
        dts.bundle({
          name: "../../" + packageJson.name,
          main: buildPath + "typings/entries/" + options.platform + ".d.ts",
          outputAsModuleFolder: true,
          headerText: dts_banner,
        });

        var fileName = buildPath + packageJson.name + ".d.ts";

        //removeLines(
        //  fileName,
        //  /^import\s+.*("|')survey-core("|');\s*(\n|\r)?/gm
        //);
        removeLines(fileName, /^import\s+.*("|')\..*("|');\s*(\n|\r)?/gm);
        removeLines(fileName, /export let\s+\w+:\s+\w+;/g);
        removeLines(fileName, /export default\s+\w+;/g);

        rimraf.sync(buildPath + "typings");
      }
    }
  };

  var config = {
    mode: isProductionBuild ? "production" : "development",
    entry: {
      [packageJson.name]: path.resolve(
        __dirname,
        "../../src/entries/" + options.platform + ".ts"
      ),
    },
    resolve: {
      extensions: [".ts", ".js", ".tsx", ".scss"],
      //plugins: [new TsconfigPathsPlugin(/*{ configFile: "./tsconfig.json" }*/)],
      alias: {
        tslib: path.join(__dirname, "../../src/entries/chunks/helpers.ts"),
      },
    },
    optimization: {
      minimize: isProductionBuild,
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          loader: "ts-loader",
          options: {
            compilerOptions: {
              declaration: isProductionBuild,
              outDir: buildPath + "typings/",
            },
            //transpileOnly: options.buildType !== "prod",
            appendTsSuffixTo: [/\.vue$/],
          },
        },
        {
          test: /\.css$/,
          loader: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                sourceMap: options.buildType !== "prod",
              },
            },
          ],
        },
        {
          test: /\.s(c|a)ss$/,
          loader: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                sourceMap: options.buildType !== "prod",
              },
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: options.buildType !== "prod",
              },
            },
          ],
        },
        {
          test: /\.html$/,
          loader: "html-loader",
        },
        {
          test: /\.(svg|png)$/,
          use: {
            loader: "url-loader",
            options: {},
          },
        },
      ],
    },
    output: {
      path: buildPath,
      filename: "[name]" + (isProductionBuild ? ".min" : "") + ".js",
      library: options.libraryName,
      libraryTarget: "umd",
      umdNamedDefine: true,
    },
    plugins: [
      new webpack.ProgressPlugin(percentage_handler),
      new webpack.DefinePlugin({
        "process.env.ENVIRONMENT": JSON.stringify(options.buildType),
        "process.env.VERSION": JSON.stringify(packageJson.version),
      }),
      new MiniCssExtractPlugin({
        filename: isProductionBuild ? "[rc-name].min.css" : "[rc-name].css",
      }),
      new webpack.WatchIgnorePlugin([/svgbundle\.html/]),
      new webpack.BannerPlugin({
        banner: banner,
      }),
      new RemoveCoreFromName(),
    ],
  };

  if (isProductionBuild) {
    config.plugins.push = config.plugins.concat([]);
  } else {
    config.devtool = "inline-source-map";
    config.plugins = config.plugins.concat([
      new webpack.LoaderOptionsPlugin({ debug: true }),
    ]);
  }

  return config;
};
