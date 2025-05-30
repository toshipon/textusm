const { merge } = require("webpack-merge");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

// Base configuration shared between extension and webview
const baseConfig = {
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  devtool: process.env.NODE_ENV === "production" ? false : "source-map",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js", // Output filename based on entry name
  },
  resolve: {
    extensions: [".ts", ".js", ".css"], // Resolve these extensions
  },
  plugins: [
    // Extract CSS into separate files
    new MiniCssExtractPlugin({
      filename: "[name].css", // e.g., webview.css
    }),
    // Clean the dist directory before build (only in production)
    ...(process.env.NODE_ENV === "production"
      ? [new CleanWebpackPlugin({ cleanOnceBeforeBuildPatterns: ["**/*"] })]
      : []),
  ],
  optimization: {
    minimizer: [
      // Minimize JS/TS in production
      ...(process.env.NODE_ENV === "production"
        ? [
            new TerserPlugin({
              test: /\.(js|ts)$/i,
              parallel: true,
              terserOptions: {
                compress: {
                  drop_console: true,
                },
              },
            }),
          ]
        : []),
      // Add css-minimizer-webpack-plugin here if CSS minimization is needed
    ],
  },
};

// Configuration for the VS Code extension backend (Node.js environment)
const extensionConfig = merge(baseConfig, {
  name: "extension", // Configuration name
  target: "node", // Target environment is Node.js
  entry: {
    extension: "./src/extension.ts", // Main extension entry point
    webview: "./src/styles/webview.css", // CSS entry point (extracted by MiniCssExtractPlugin)
  },
  output: {
    libraryTarget: "commonjs2", // Required for VS Code extensions
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  externals: [
    {
      vscode: "commonjs vscode", // Exclude 'vscode' module
    },
    nodeExternals(), // Exclude node_modules
  ],
  module: {
    rules: [
      {
        test: /\.ts$/, // Rule for TypeScript files
        exclude: /node_modules/,
        use: "ts-loader",
      },
      {
        test: /\.css$/i, // Rule for CSS files
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  node: false, // Disable Node.js polyfills
});

// Configuration for the Webview frontend script (Web environment)
const webviewConfig = merge(baseConfig, {
  name: "webview", // Configuration name
  target: "web", // Target environment is the browser
  entry: {
    // Define webviewScript as an entry point
    webviewScript: "./src/views/chat/webviewScript.js",
  },
   output: {
     // Output webview script to dist/webviewScript.js
     filename: "webviewScript.js", // Explicit filename for the webview script bundle
     libraryTarget: "umd", // Use UMD format for broader compatibility
     // library: "webviewScript", // Optionally assign to a global variable (if needed)
   },
   // experiments: { outputModule: true } is removed as we are not outputting ES modules
  module: {
    rules: [
      {
        // Use ts-loader for .js files as well (requires allowJs: true in tsconfig)
         test: /\.(ts|js)$/, 
         exclude: /node_modules/,
         use: [
           {
             loader: 'ts-loader',
             options: {
               configFile: 'tsconfig.webview.json' // Use the webview-specific tsconfig
             }
           }
         ]
       },
      // CSS rule is not needed here as it's handled in extensionConfig
    ],
  },
  // Webview doesn't need node externals or vscode module
});

// Export both configurations
module.exports = [extensionConfig, webviewConfig];
