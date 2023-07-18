const path = require("path");
const webpack = require("webpack");
const FilemanagerPlugin = require("filemanager-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const WextManifestWebpackPlugin = require("wext-manifest-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

let network = "mainnet";
if (!process.env.ALBY_API_URL) {
  process.env.ALBY_API_URL = "https://api.regtest.getalby.com";
  if (!process.env.ALBY_OAUTH_AUTHORIZE_URL) {
    process.env.ALBY_OAUTH_AUTHORIZE_URL =
      "https://app.regtest.getalby.com/oauth";
  }
  network = "testnet";
}

if (
  !process.env.ALBY_OAUTH_CLIENT_ID &&
  !process.env.ALBY_OAUTH_CLIENT_SECRET
) {
  const oauthCredentials = {
    development: {
      testnet: {
        chrome: {
          id: "CLAp8AfS3W",
          secret: "KwIxF0VbGX2ZHLbbbYgE",
        },
        firefox: {
          id: "zWdxnF04Hd",
          secret: "wY5uLJJDjNWrDlB6lAj8",
        },
      },
      mainnet: {
        chrome: {
          id: "Zf7u3Zlyxl",
          secret: "7wtcdVi61emqwzAH9Nm6",
        },
        firefox: {
          id: "uQkyHFBkaC",
          secret: "0agh0cKkGWQSXTGRz9oy",
        },
      },
    },
  };

  const oauthBrowser =
    process.env.TARGET_BROWSER === "firefox" ? "firefox" : "chrome";

  // setup ALBY_OAUTH_CLIENT_ID
  const selectedOAuthCredentials =
    oauthCredentials[process.env.NODE_ENV]?.[network]?.[oauthBrowser];
  if (!selectedOAuthCredentials) {
    throw new Error("No OAuth credentials found for current configuration");
  }
  console.info("Using OAuth credentials for", oauthBrowser, network);
  process.env.ALBY_OAUTH_CLIENT_ID = selectedOAuthCredentials.id;
  process.env.ALBY_OAUTH_CLIENT_SECRET = selectedOAuthCredentials.secret;
}

// default value is set in the code where it is used
if (!process.env.ALBY_OAUTH_AUTHORIZE_URL) {
  process.env.ALBY_OAUTH_AUTHORIZE_URL = ""; // env variables are passed as string. empty strings are still falsy
}

// default value is set in the code where it is used
if (!process.env.BITCOIN_BEACH_GALOY_URL) {
  process.env.BITCOIN_BEACH_GALOY_URL = ""; // env variables are passed as string. empty strings are still falsy
}

// default value is set in the code where it is used
if (!process.env.BITCOIN_JUNGLE_GALOY_URL) {
  process.env.BITCOIN_JUNGLE_GALOY_URL = ""; // env variables are passed as string. empty strings are still falsy
}

// default value is set in the code where it is used
if (!process.env.HMAC_VERIFY_HEADER_KEY) {
  process.env.HMAC_VERIFY_HEADER_KEY = ""; // env variables are passed as string. empty strings are still falsy
}
if (!process.env.VERSION) {
  process.env.VERSION = require("./package.json").version;
}

const viewsPath = path.join(__dirname, "static", "views");
const nodeEnv = process.env.NODE_ENV || "development";
const destPath = path.join(__dirname, "dist", nodeEnv);

const targetBrowser = process.env.TARGET_BROWSER;

const getExtensionFileType = (browser) => {
  if (browser === "opera") {
    return "crx";
  }

  if (browser === "firefox") {
    return "xpi";
  }

  return "zip";
};

var options = {
  stats: {
    all: false,
    builtAt: true,
    errors: true,
    hash: true,
  },

  mode: nodeEnv,
  entry: {
    manifest: "./src/manifest.json",
    background: "./src/extension/background-script/index.ts",
    contentScriptOnEndWebLN: "./src/extension/content-script/onendwebln.js",
    contentScriptOnEndAlby: "./src/extension/content-script/onendalby.js",
    contentScriptOnEndLiquid: "./src/extension/content-script/onendliquid.js",
    contentScriptOnEndNostr: "./src/extension/content-script/onendnostr.js",
    contentScriptOnEndWebBTC: "./src/extension/content-script/onendwebbtc.js",
    contentScriptOnStart: "./src/extension/content-script/onstart.ts",
    inpageScript: "./src/extension/inpage-script/index.js",
    inpageScriptWebLN: "./src/extension/inpage-script/webln.js",
    inpageScriptWebBTC: "./src/extension/inpage-script/webbtc.js",
    inpageScriptLiquid: "./src/extension/inpage-script/liquid.js",
    inpageScriptNostr: "./src/extension/inpage-script/nostr.js",
    inpageScriptAlby: "./src/extension/inpage-script/alby.js",
    popup: "./src/app/router/Popup/index.tsx",
    prompt: "./src/app/router/Prompt/index.tsx",
    options: "./src/app/router/Options/index.tsx",
    welcome: "./src/app/router/Welcome/index.tsx",
  },

  output: {
    path: path.join(destPath, targetBrowser),
    filename: "js/[name].bundle.js",
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    alias: {
      "webextension-polyfill": "webextension-polyfill",
      Buffer: "buffer",
      process: "process/browser",
      assert: "assert",
      stream: "stream-browserify",
    },
    plugins: [new TsconfigPathsPlugin()],
  },

  module: {
    rules: [
      {
        type: "javascript/auto", // prevent webpack handling json with its own loaders,
        test: /manifest\.json$/,
        use: {
          loader: "wext-manifest-loader",
          options: {
            usePackageJSONVersion: true, // set to false to not use package.json version for manifest
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.(js|ts)x?$/,
        exclude: /node_modules/,
        use: {
          loader: "swc-loader",
        },
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader, // It creates a CSS file per JS file which contains CSS
          },
          { loader: "css-loader", options: { sourceMap: true } },
          { loader: "postcss-loader", options: { sourceMap: true } },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
    ],
  },

  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: ["process"],
    }),
    // Plugin to not generate js bundle for manifest entry
    new WextManifestWebpackPlugin(),
    // Generate sourcemaps
    // TODO: reenable
    // new webpack.SourceMapDevToolPlugin({ filename: false }),
    // environmental variables
    new webpack.EnvironmentPlugin([
      "BITCOIN_BEACH_GALOY_URL",
      "BITCOIN_JUNGLE_GALOY_URL",
      "NODE_ENV",
      "TARGET_BROWSER",
      "VERSION",
      "HMAC_VERIFY_HEADER_KEY",
      "ALBY_OAUTH_CLIENT_ID",
      "ALBY_OAUTH_CLIENT_SECRET",
      "ALBY_OAUTH_AUTHORIZE_URL",
      "ALBY_API_URL",
    ]),
    // delete previous build files
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [
        path.join(process.cwd(), "dist", nodeEnv, targetBrowser),
        path.join(
          process.cwd(),
          "dist",
          nodeEnv,
          `${targetBrowser}.${getExtensionFileType(targetBrowser)}`
        ),
      ],
      cleanStaleWebpackAssets: false,
      verbose: true,
    }),
    new HtmlWebpackPlugin({
      template: path.join(viewsPath, "popup.html"),
      inject: "body",
      chunks: ["popup"],
      hash: true,
      filename: "popup.html",
    }),
    new HtmlWebpackPlugin({
      template: path.join(viewsPath, "options.html"),
      inject: "body",
      chunks: ["options"],
      hash: true,
      filename: "options.html",
    }),
    new HtmlWebpackPlugin({
      template: path.join(viewsPath, "prompt.html"),
      inject: "body",
      chunks: ["prompt"],
      hash: true,
      filename: "prompt.html",
    }),
    new HtmlWebpackPlugin({
      template: path.join(viewsPath, "welcome.html"),
      inject: "body",
      chunks: ["welcome"],
      hash: true,
      filename: "welcome.html",
    }),
    // write css file(s) to build folder
    new MiniCssExtractPlugin({ filename: "[name].css" }), // No css subfolder has been used as this breaks path's to url's such as fonts.
    // copy static assets
    new CopyWebpackPlugin({
      patterns: [{ from: "static/assets", to: "assets" }],
    }),
    new BundleAnalyzerPlugin({
      generateStatsFile: nodeEnv !== "development" ? true : false,
      analyzerMode: nodeEnv !== "development" ? "static" : "disabled",
      reportFilename: "../bundle-report.html",
      statsFilename: "../bundle-stats.json",
      openAnalyzer: nodeEnv !== "development",
    }),
  ],
};

if (nodeEnv === "development") {
  options.devtool = "inline-source-map";
} else {
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
      new FilemanagerPlugin({
        events: {
          onEnd: {
            archive: [
              {
                format: "zip",
                source: path.join(destPath, targetBrowser),
                destination: `${path.join(
                  destPath,
                  targetBrowser
                )}.${getExtensionFileType(targetBrowser)}`,
                options: { zlib: { level: 6 } },
              },
            ],
          },
        },
      }),
    ],
  };
}

module.exports = options;
