const {join} = require('path');
const webpack = require('webpack');

module.exports = {
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				loader: 'awesome-typescript-loader',
				options: {
					configFileName: join(process.env.EXILITY_STORYBOOK_DIRNAME, 'tsconfig.json'),
				},
			},
			{
				test: /\.css$/,
				use: [
					{loader: 'style-loader'},
					{loader: 'css-loader'},
				],
			},
		],
	},

	resolve: {
		extensions: ['.tsx', '.ts', '.js'],

		modules: [
			process.env.EXILITY_STORYBOOK_DIRNAME,
			'node_modules',
		],
	},


	plugins: [
		new webpack.EnvironmentPlugin(['NODE_ENV', 'EXILITY_STORYBOOK_DIRNAME'])
	]
};
