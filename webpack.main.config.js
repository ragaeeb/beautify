const webpack = require('webpack'); // Import webpack
const dotenv = require('dotenv').config().parsed; // Import dotenv and call config
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: './src/main.js',
    // Put your normal webpack config below here
    module: {
        rules: require('./webpack.rules'),
    },
    plugins: [
        // Add the plugins array if it doesn't exist yet
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'production', // Use 'production' unless process.env.NODE_ENV is defined
            ...dotenv, // Spread the dotenv parsed variables into EnvironmentPlugin
        }),
        new CopyPlugin({
            patterns: [{ from: 'assets/images', to: 'assets/images' }],
        }),
    ],
};
