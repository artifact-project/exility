const webpack = require('webpack');

module.exports = {
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: /node_modules\/(?!@exility|skeletik)/,
				loader: 'awesome-typescript-loader',
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
