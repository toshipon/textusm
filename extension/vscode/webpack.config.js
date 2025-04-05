const { merge } = require("webpack-merge");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const MiniCssExtractPlugin = require("mini-css-extract-plugin"); // 追加
const path = require("path"); // 追加

const common = {
  // エントリーポイントをオブジェクト形式に変更
  entry: {
    extension: "./src/extension.ts",
    webview: "./src/styles/webview.css", // CSS エントリーポイントを追加
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: "ts-loader",
      },
      // CSS ルールを追加
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  output: {
    // 出力ファイル名をエントリー名に基づいて動的に設定
    path: path.resolve(__dirname, "dist"), // path.resolve を使用
    filename: "[name].js", // [name] プレースホルダーを使用 (extension.js になる)
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  resolve: {
    extensions: [".ts", ".js", ".css"], // .css を追加
  },
  target: "node",
  node: false,
  externals: [
    {
      vscode: "commonjs vscode",
    },
    nodeExternals(),
  ],
  // プラグインを追加
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css", // 出力 CSS ファイル名 (webview.css になる)
    }),
  ],
};

if (process.env.NODE_ENV === "production") {
  module.exports = merge(common, {
    plugins: [
      // CleanWebpackPlugin は production ビルドでのみ実行
      new CleanWebpackPlugin({
        // dist 全体をクリーンアップ (CSS も含めるため)
        // root: `${__dirname}/dist`, // merge で上書きされるので不要かも
        // exclude: [],
        // verbose: true,
        // dry: false,
        cleanOnceBeforeBuildPatterns: ['**/*'], // dist ディレクトリ全体をクリーンアップ
      }),
      // MiniCssExtractPlugin は common に移動したのでここでは不要
    ],
    optimization: {
      minimizer: [
        new TerserPlugin({
          test: /\.(js|ts)$/i,
          parallel: true,
          terserOptions: {
            compress: {
              drop_console: true,
            },
          },
        }),
        // CSS の最小化が必要な場合は css-minimizer-webpack-plugin を追加
      ],
    },
    // production モードでは source-map を無効にするか、別のタイプを選択
    devtool: false,
  });
} else {
  // development モードの設定
  module.exports = merge(common, {
    // development モードでは source-map を有効にする
    devtool: 'source-map',
    // development モードでは CleanWebpackPlugin を実行しない場合が多い
    // plugins: [
    //   // MiniCssExtractPlugin は common にある
    // ],
  });
}
