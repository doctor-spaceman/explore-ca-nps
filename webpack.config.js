const path = require('path');
const Dotenv = require('dotenv').config();
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssnanoPlugin = require('cssnano-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const devMode = process.env.NODE_ENV === 'development';
const apiKeyMaps = process.env.APP_API_KEY_GMAPS;


module.exports = {
    watch: true,
    // Source maps
    devtool: devMode ? 'cheap-module-source-map' : 'source-map',
    // Modules
    module: {
        rules: [
          {
            test: /\.(sa|sc|c)ss$/,
            use: [{
                loader: devMode ? 'style-loader' : MiniCssExtractPlugin.loader
            }, {
                // This loader resolves url() and @imports inside CSS
                loader: 'css-loader', options: {
                    sourceMap: true     
                }           
            }, {
                // Then we apply postCSS fixes like autoprefixer and minifying
                loader: 'postcss-loader', options: {
                    sourceMap: true
                }
            }, {
                // First we transform SASS to standard CSS
                loader: 'sass-loader', options: {
                    sourceMap: true
                }
            }]
          },
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: [{
                loader: 'babel-loader'
            }]
          },
          {
            test: /\.(png|jpe?g|gif|svg)$/,
            use: [{
                loader: 'file-loader', options: {
                    publicPath: './assets/img', 
                    outputPath: 'assets/img', 
                    name: '[name].[ext]'
                }
            }]
          }
        ]
    },
    // Optimizers
    optimization: {
        minimizer: [
          new CssnanoPlugin({
            sourceMap: true
          }),
          new TerserPlugin()
        ]
    },
    // Plugins
    plugins: [
        new webpack.DefinePlugin({
            "process.env.APP_API_KEY_NPS": JSON.stringify(process.env.APP_API_KEY_NPS),
            "process.env.APP_API_KEY_WEATHER": JSON.stringify(process.env.APP_API_KEY_WEATHER)
        }),
        new HtmlWebpackPlugin({
          template: path.resolve(__dirname, 'src', 'index.html'),
          minify: false,
          mapsUrl: `https://maps.googleapis.com/maps/api/js?key=${apiKeyMaps}`
        }),
        new MiniCssExtractPlugin({
            filename: 'style.css'
        })
    ]
};