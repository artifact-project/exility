require('ts-node').register({
	ignore: /node_modules\/(?!skeletik|@exility)/,
});

const path = require('path');
const webpack = require('webpack');
const {default:exilityTransformer} = require('@exility/ts-transformer');

module.exports = {
	entry: {
		vendor: [
			'@exility/block',
			'@exility/ui-bootstrap/blocks/Core/Core',
			'@exility/dom/src/stddom/stddom',
			'@exility/compile-helpers/src/stdlib/stdlib',
		],
		app: ['./index.ts'],
	},
	output: {
		filename: '[name].bundle.js',
		path: path.join(__dirname, 'dist')
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'awesome-typescript-loader',
				exclude: /node_modules\/(?!@exility|skeletik)/,
				options: {
					getCustomTransformers() {
						return {
							before: [exilityTransformer],
							after: [],
						};
					}
				}
			},
			{
				test: /\.css$/,
				use: [
					{loader: 'style-loader'},
					{loader: 'css-loader'},
				],
			},
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
		modules: [
			'node_modules',
		],
	},
	plugins: [
		new webpack.optimize.CommonsChunkPlugin({name: 'vendor', filename: 'vendor.bundle.js'}),
		new webpack.DefinePlugin({
			'process.env': {NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')}
		})
	],
};
