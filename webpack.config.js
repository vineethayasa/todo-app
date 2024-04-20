/* eslint-disable no-undef */

const path = require("path");
const webpack = require("webpack");
module.exports = {
	mode: "development",
	entry: "./index.js",
	output: {
		filename: "bundle.js",
		path: path.resolve(__dirname, "dist"),
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: "babel-loader",
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
			{
				test: /\.(png|svg|jpg|gif)$/i,
				use: "file-loader",
			},
			{
				test: /\.html$/i,
				loader: "html-loader",
			},
			{
				test: /\.node$/,
				loader: "file-loader",
				options: {
					name: "[name].[ext]",
				},
			},
		],
	},
	resolve: {
		fallback: {
			"path": require.resolve("path-browserify"),
			"stream": require.resolve("stream-browserify"),
			"http": require.resolve("stream-http"),
			"https": require.resolve("https-browserify"),
			"fs": false,
			"url": false,
			"util": false,
			"zlib": false,
			"os": false,
			"assert": false,
			"crypto": false,
			"querystring": false,
			"domain": false,
			"child_process": false,
			"async_hooks": false,
			"inspector": false,
			"net": false,
			"tls": false,
			"node-gyp": false,
			"npm": false,
			"diagnostics_channel": false,
			"worker_threads": false,
			"mock-aws-s3": false,
			"aws-sdk": false,
			"nock": false,
		},
	},
	plugins: [
		new webpack.IgnorePlugin({
			resourceRegExp: /^@mapbox\/node-pre-gyp$/,
		}),
		new webpack.IgnorePlugin({
			resourceRegExp: /^@sentry\/profiling-node$/,
		}),
		new webpack.IgnorePlugin({
			resourceRegExp: /^bcrypt$/,
		}),
		new webpack.IgnorePlugin({
			resourceRegExp: /^express$/,
		}),
		new webpack.IgnorePlugin({
			resourceRegExp: /^sequelize$/,
		}),
		new webpack.IgnorePlugin({
			resourceRegExp: /express/,
			contextRegExp: /models\/index\.js|app\.js/,
		}),
		new webpack.ContextReplacementPlugin(
			/models\/./, // Replace all imports within the models directory
			true // Treat all files as dependencies
		)
	],
	stats: {
		warnings: false 
	}
};
